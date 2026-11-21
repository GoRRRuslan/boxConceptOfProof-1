"""Draws the reflection environment of the 3D scene: a dark photo studio with a few bright soft-boxes, as a Filament image-based light.

Output: src/assets/environments/studio_ibl.ktx  (KTX 1, cube map 256 px, 5 mip levels, R11G11B10F, with the 9 spherical-harmonics
irradiance coefficients that Filament reads from the "sh" key; the same layout `cmgen` writes).
Usage : python3 scripts/assets/generateStudioEnvironment.py   (needs numpy: pip install numpy)

Why: glossy and metallic boxes only look glossy and metallic if they have something contrasty to reflect. The default environment of
react-native-filament is an evenly lit sky, which gives flat, plasticky reflections. A studio (black room, white panels) gives the sharp,
saturated highlights of a car paint finish. Mip level k holds the room blurred for roughness k/4 (level 0 is a mirror).
"""
import pathlib
import struct

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "src" / "assets" / "environments" / "studio_ibl.ktx"
SIZE = 256
LEVELS = 5
# Overall brightness of the room relative to the default environment (the light intensity in the scene config stays the same).
GAIN = 0.62

# Soft-boxes: (direction, up hint, half width, half height in radians, edge softness in radians, luminance). +Y is up, +Z is towards the
# camera, the boxes face +Z.
SOFTBOXES = [
    # A flat, even studio: the faces keep one saturated colour (no big gradients), the rims catch light, and the bright spot of a face comes
    # from a lamp (see SCENE_POINT_LIGHTS), not from the environment.
    ((0.0, 0.1, 1.0), (0, 1, 0), 1.2, 0.9, 0.6, 0.15),          # a faint even fill in front
    ((0.0, 1.0, -0.1), (0, 0, -1), 0.55, 0.3, 0.1, 2.2),        # overhead panel: a little light on the lids
    ((1.0, 0.15, 0.1), (0, 1, 0), 0.08, 0.8, 0.05, 3.5),        # strip on the right: a bright line along the edges
    ((-0.2, 0.3, -1.0), (0, 1, 0), 0.9, 0.2, 0.15, 6.0),        # strip behind: bright rims against the dark background
]
# Tints: the panels are not pure white, a faint cool/warm split is what makes metal look rich.
TINTS = [(1.0, 1.0, 1.0), (1.0, 1.0, 1.0), (1.0, 0.97, 0.93), (1.0, 0.95, 0.9)]


def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)


def radiance(directions):
    """HDR radiance (..., 3) of the studio seen along `directions` (..., 3) (unit vectors)."""
    x, y, z = directions[..., 0], directions[..., 1], directions[..., 2]
    # The room: a dim, slightly cool ceiling, a dark middle and an almost black floor.
    gradient = np.where(y > 0, 0.04 + 0.04 * y, 0.04 + 0.03 * y)
    result = np.stack([gradient * 0.95, gradient * 0.98, gradient * 1.05], -1)
    for (direction, up_hint, half_width, half_height, softness, luminance), tint in zip(SOFTBOXES, TINTS):
        forward = np.array(direction, dtype=float)
        forward /= np.linalg.norm(forward)
        right = np.cross(np.array(up_hint, dtype=float), forward)
        right /= np.linalg.norm(right)
        up = np.cross(forward, right)
        along = directions @ forward
        u = np.arctan2(directions @ right, along)
        v = np.arctan2(directions @ up, along)
        inside = np.exp(-((u / (half_width + softness)) ** 2 + (v / (half_height + softness)) ** 2) * 1.6) * smoothstep(half_width + 2 * softness, half_width, np.abs(u) * 0.55) ** 0.0
        inside = np.where(along > 0, inside, 0.0)
        result = result + inside[..., None] * luminance * np.array(tint)
    return result * GAIN


def face_directions(face, size):
    axis = (np.arange(size) + 0.5) / size * 2 - 1
    s, t = np.meshgrid(axis, axis)
    one = np.ones_like(s)
    x, y, z = [
        (one, -t, -s), (-one, -t, s), (s, one, t), (s, -one, -t), (s, -t, one), (-s, -t, -one),
    ][face]
    directions = np.stack([x, y, z], -1)
    return directions / np.linalg.norm(directions, axis=-1, keepdims=True)


def blurred_radiance(directions, sigma, samples=192):
    """Radiance averaged over a cone (gaussian, `sigma` radians) around every direction: the room seen through a rough surface.

    The same sample pattern (a golden-angle spiral) is used for every texel, so the result is smooth: random samples per texel gave a
    mottled, blotchy reflection."""
    flat = directions.reshape(-1, 3)
    helper = np.where(np.abs(flat[:, :1]) < 0.9, np.array([[1.0, 0, 0]]), np.array([[0, 1.0, 0]]))
    tangent = np.cross(flat, helper)
    tangent /= np.linalg.norm(tangent, axis=-1, keepdims=True)
    bitangent = np.cross(flat, tangent)
    total = np.zeros((flat.shape[0], 3))
    weight_sum = 0.0
    for index in range(samples):
        radius = np.sqrt((index + 0.5) / samples) * 2.5 * sigma  # up to 2.5 sigma
        azimuth = index * 2.399963229728653
        weight = np.exp(-0.5 * (radius / sigma) ** 2)
        sample = np.cos(radius) * flat + np.sin(radius) * (np.cos(azimuth) * tangent + np.sin(azimuth) * bitangent)
        total += weight * radiance(sample)
        weight_sum += weight
    return (total / weight_sum).reshape(directions.shape)


def encode_r11g11b10(rgb):
    """Packs float RGB into the 32 bit unsigned-int-10f-11f-11f layout (truncating, never rounding up)."""
    half = np.clip(rgb, 0, 65000).astype(np.float16).view(np.uint16).astype(np.uint32)
    red = (half[..., 0] >> 4) & 0x7FF   # 5 bit exponent + top 6 mantissa bits
    green = (half[..., 1] >> 4) & 0x7FF
    blue = (half[..., 2] >> 5) & 0x3FF  # 5 bit exponent + top 5 mantissa bits
    return red | (green << 11) | (blue << 22)


def diffuse_radiance(directions):
    """What the box 'sees' for its colour (the diffuse light, stored as the spherical harmonics): an even, slightly top-lit room. It is kept apart
    from the reflections (the cube map), which are nearly black, so that the faces keep one saturated colour and only a lamp makes a shine."""
    y = directions[..., 1]
    value = 0.62 + 0.22 * y
    return np.stack([value, value, value], -1)


def spherical_harmonics():
    """9 RGB coefficients of the diffuse (cosine-convolved) irradiance, in the form Filament reads them."""
    size = 64
    total = np.zeros((9, 3))
    for face in range(6):
        directions = face_directions(face, size)
        axis = (np.arange(size) + 0.5) / size * 2 - 1
        s, t = np.meshgrid(axis, axis)
        solid_angle = 4 / (size * size) / (1 + s * s + t * t) ** 1.5
        x, y, z = directions[..., 0], directions[..., 1], directions[..., 2]
        basis = np.stack([0.282095 + 0 * x, 0.488603 * y, 0.488603 * z, 0.488603 * x, 1.092548 * x * y, 1.092548 * y * z, 0.315392 * (3 * z * z - 1), 1.092548 * x * z, 0.546274 * (x * x - y * y)], -1)
        total += np.einsum("hwk,hwc,hw->kc", basis, diffuse_radiance(directions), solid_angle)
    cosine = np.array([1.0, 2 / 3, 2 / 3, 2 / 3, 0.25, 0.25, 0.25, 0.25, 0.25])
    constants = np.array([0.282095, 0.488603, 0.488603, 0.488603, 1.092548, 1.092548, 0.315392, 1.092548, 0.546274])
    return total * (cosine * constants)[:, None]


def main():
    sh = spherical_harmonics()
    text = "".join(f"{r:.6g} {g:.6g} {b:.6g}\n" for r, g, b in sh)
    key_value = b"sh\0" + text.encode() + b"\0"
    key_value = struct.pack("<I", len(key_value)) + key_value
    key_value += b"\0" * (-len(key_value) % 4)
    header = b"\xabKTX 11\xbb\r\n\x1a\n" + struct.pack("<13I", 0x04030201, 35898, 1, 6407, 35898, 35898, SIZE, SIZE, 0, 0, 6, LEVELS, len(key_value))
    body = bytearray(header + key_value)
    for level in range(LEVELS):
        size = SIZE >> level
        sigma = 0.0 if level == 0 else max(0.03, (level / 4) ** 2.2 * 1.1)
        body += struct.pack("<I", size * size * 4)
        for face in range(6):
            directions = face_directions(face, size)
            rgb = radiance(directions) if level == 0 else blurred_radiance(directions, sigma)
            body += encode_r11g11b10(rgb).astype("<u4").tobytes()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(bytes(body))
    print(f"wrote {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size // 1024} KB), sh[0] = {sh[0]}")


main()
