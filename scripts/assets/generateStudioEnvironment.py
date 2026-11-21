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
GAIN = 3.5
# The reflections need the panels to be much brighter than a plain picture (clearcoat reflects only a few percent): the bright spot of the native version.
PANEL_BOOST = 1.0
# The panels of the native environment picture: (left, top, width, height) in pixels of a 512 x 256 image.
PANELS = [(60, 40, 90, 40), (300, 30, 120, 36), (200, 110, 50, 20)]

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


def rounded_box_alpha(px, py, left, top, width, height, radius):
    """1 inside a rounded rectangle (pixels), 0 outside, with a one pixel soft edge."""
    cx, cy = left + width / 2, top + height / 2
    qx = np.abs(px - cx) - (width / 2 - radius)
    qy = np.abs(py - cy) - (height / 2 - radius)
    outside = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - radius
    return np.clip(0.5 - outside, 0, 1)


def radiance(directions, panel_boost=None):
    """The environment of the native (SceneKit) version, which this one copies: a 512 x 256 equirectangular picture of a dark room with three
    soft white panels (a vertical gradient 0.55 -> 0.16 -> 0.04 and three rounded rectangles of 0.9 white), see BoxScene.swift EnvironmentImage."""
    x, y, z = directions[..., 0], directions[..., 1], directions[..., 2]
    u = np.arctan2(x, z) / (2 * np.pi) + 0.5           # azimuth, 0..1 (the middle of the picture is straight ahead, towards the camera)
    v = np.arccos(np.clip(y, -1, 1)) / np.pi             # from the top (north pole), 0..1
    px, py = u * 512, v * 256
    t = v
    gradient = np.where(t < 0.5, 0.55 + (0.16 - 0.55) * (t / 0.5), 0.16 + (0.04 - 0.16) * ((t - 0.5) / 0.5))
    value = gradient
    for left, top, width, height in PANELS:
        alpha = 0.9 * rounded_box_alpha(px, py, left, top, width, height, 10)
        value = value * (1 - alpha) + (1.0 if panel_boost is None else panel_boost) * alpha
    return np.stack([value, value, value], -1) * GAIN


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
        total += weight * radiance(sample, PANEL_BOOST)
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
        total += np.einsum("hwk,hwc,hw->kc", basis, radiance(directions), solid_angle)
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
            rgb = radiance(directions, PANEL_BOOST) if level == 0 else blurred_radiance(directions, sigma)
            body += encode_r11g11b10(rgb).astype("<u4").tobytes()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(bytes(body))
    print(f"wrote {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size // 1024} KB), sh[0] = {sh[0]}")


main()
