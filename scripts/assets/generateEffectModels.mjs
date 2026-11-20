#!/usr/bin/env node
// Builds the three tiny effect meshes of the 3D scene as GLB files. The soft edges are a small alpha texture (embedded PNG):
// vertex alpha is NOT reliable in Filament's glTF loader (Android ignored it and drew hard discs), a texture always works.
//   fx_disc.glb   soft round glow, 1 unit across, facing +Z  (sparks, dust, aura behind a box)
//   fx_ring.glb   thin soft ring, 1 unit across, facing +Z   (shock wave)
//   fx_shaft.glb  soft curtain of light, 1 unit high from y = 0, 1 wide at the bottom and wider at the top (rises from the open box)
// All three are unlit, double sided and alpha blended; the scene tints and fades them through baseColorFactor.
// Usage: node scripts/assets/generateEffectModels.mjs <outputDirectory>
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { deflateSync } from 'node:zlib'

const outputDirectory = process.argv[2] ?? 'src/assets/models'

// ------------------------------- PNG encoder ------------------------------- //
const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }

  return value >>> 0
})
const crc32 = buffer => {
  let crc = 0xffffffff

  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }

  return (crc ^ 0xffffffff) >>> 0
}
const pngChunk = (type, data) => {
  const length = Buffer.alloc(4)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const checksum = Buffer.alloc(4)

  length.writeUInt32BE(data.length, 0)

  checksum.writeUInt32BE(crc32(body), 0)

  return Buffer.concat([length, body, checksum])
}
// White pixels, the given alpha (0..1) per pixel: alphaAt(column, row) with 0 <= column < width.
const encodePng = (width, height, alphaAt) => {
  const rows = []

  for (let row = 0; row < height; row += 1) {
    const line = Buffer.alloc(1 + width * 4)

    for (let column = 0; column < width; column += 1) {
      const alpha = Math.round(255 * Math.min(1, Math.max(0, alphaAt(column, row))))

      line.set([255, 255, 255, alpha], 1 + column * 4)
    }

    rows.push(line)
  }

  const header = Buffer.alloc(13)

  header.writeUInt32BE(width, 0)

  header.writeUInt32BE(height, 4)

  header.set([8, 6, 0, 0, 0], 8)

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(Buffer.concat(rows))),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

// ------------------------------- Textures ------------------------------- //
const gauss = (value, centre, width) => Math.exp(-(((value - centre) / width) ** 2))
const smooth = (edge0, edge1, value) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)))

  return t * t * (3 - 2 * t)
}
const RADIAL_SIZE = 128
// Distance from the centre of a square texture, 0 at the middle, 0.5 at the middle of an edge.
const radiusAt = (column, row) => Math.hypot((column + 0.5) / RADIAL_SIZE - 0.5, (row + 0.5) / RADIAL_SIZE - 0.5)

// Soft glow: gaussian falloff, exactly 0 at the edge.
const discAlpha = (column, row) => {
  const radius = radiusAt(column, row)

  return gauss(radius, 0, 0.17) * (1 - smooth(0.36, 0.5, radius))
}
// Thin soft ring.
const ringAlpha = (column, row) => {
  const radius = radiusAt(column, row)

  return gauss(radius, 0.42, 0.045) * (1 - smooth(0.47, 0.5, radius))
}
// Light along the walls of the box: strongest along the two edges, a gentler glow in the middle, nothing at the sides; strongest
// at the box and fading away towards the watch. `across` -1..1, `up` 0 (bottom) .. 1 (top).
const SHAFT_WIDTH = 96
const SHAFT_HEIGHT = 192
const shaftAlpha = (column, row) => {
  const across = ((column + 0.5) / SHAFT_WIDTH) * 2 - 1
  const up = 1 - (row + 0.5) / SHAFT_HEIGHT
  const horizontal = (0.55 * gauss(across, 0, 0.45) + 0.45 * (gauss(across, -0.7, 0.2) + gauss(across, 0.7, 0.2))) * (1 - Math.abs(across) ** 4)
  const vertical = (1 - up) ** 1.4 * smooth(0, 0.08, up)

  return 0.9 * horizontal * vertical
}

// ------------------------------- Meshes ------------------------------- //
// A quad (or trapezoid): corners bottom-left, bottom-right, top-right, top-left; UV (0,1) is the bottom-left of the texture.
const quad = (bottomHalfWidth, bottom, topHalfWidth, top) => ({
  positions: [-bottomHalfWidth, bottom, 0, bottomHalfWidth, bottom, 0, topHalfWidth, top, 0, -topHalfWidth, top, 0],
  uvs: [0, 1, 1, 1, 1, 0, 0, 0],
  indices: [0, 1, 2, 0, 2, 3],
})

const pad4 = buffer => Buffer.concat([buffer, Buffer.alloc((4 - (buffer.length % 4)) % 4)])

const buildGlb = (mesh, png, name) => {
  const positionArray = new Float32Array(mesh.positions)
  const normalArray = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1])
  const uvArray = new Float32Array(mesh.uvs)
  const indexArray = new Uint16Array(mesh.indices)
  const arrays = [positionArray, normalArray, uvArray, indexArray]
  const chunks = [...arrays.map(array => pad4(Buffer.from(array.buffer))), pad4(png)]
  const offsets = chunks.reduce((accumulator, chunk) => [...accumulator, accumulator[accumulator.length - 1] + chunk.length], [0])
  const minimum = [0, 1, 2].map(axis => Math.min(...positionArray.filter((_, index) => index % 3 === axis)))
  const maximum = [0, 1, 2].map(axis => Math.max(...positionArray.filter((_, index) => index % 3 === axis)))
  const json = {
    asset: { version: '2.0', generator: 'generateEffectModels.mjs' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name, mesh: 0 }],
    meshes: [{ name, primitives: [{ attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, material: 0 }] }],
    materials: [
      {
        name: `${name}_Material`,
        doubleSided: true,
        alphaMode: 'BLEND',
        pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 1 },
        extensions: { KHR_materials_unlit: {} },
      },
    ],
    extensionsUsed: ['KHR_materials_unlit'],
    textures: [{ source: 0, sampler: 0 }],
    samplers: [{ magFilter: 9729, minFilter: 9729, wrapS: 33071, wrapT: 33071 }],
    images: [{ bufferView: 4, mimeType: 'image/png' }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 4, type: 'VEC3', min: minimum, max: maximum },
      { bufferView: 1, componentType: 5126, count: 4, type: 'VEC3' },
      { bufferView: 2, componentType: 5126, count: 4, type: 'VEC2' },
      { bufferView: 3, componentType: 5123, count: indexArray.length, type: 'SCALAR' },
    ],
    bufferViews: [
      ...arrays.map((array, index) => ({
        buffer: 0,
        byteOffset: offsets[index],
        byteLength: array.byteLength,
        target: index === 3 ? 34963 : 34962,
      })),
      { buffer: 0, byteOffset: offsets[4], byteLength: png.length },
    ],
    buffers: [{ byteLength: offsets[offsets.length - 1] }],
  }
  const binary = Buffer.concat(chunks)
  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8')
  const paddedJson = Buffer.concat([jsonBuffer, Buffer.alloc((4 - (jsonBuffer.length % 4)) % 4, 0x20)])
  const header = Buffer.alloc(12)
  const jsonHeader = Buffer.alloc(8)
  const binaryHeader = Buffer.alloc(8)

  header.write('glTF', 0, 'ascii')

  header.writeUInt32LE(2, 4)

  header.writeUInt32LE(12 + 8 + paddedJson.length + 8 + binary.length, 8)

  jsonHeader.writeUInt32LE(paddedJson.length, 0)

  jsonHeader.write('JSON', 4, 'ascii')

  binaryHeader.writeUInt32LE(binary.length, 0)

  binaryHeader.write('BIN\0', 4, 'ascii')

  return Buffer.concat([header, jsonHeader, paddedJson, binaryHeader, binary])
}

mkdirSync(outputDirectory, { recursive: true })

for (const [fileName, name, mesh, png] of [
  ['fx_disc.glb', 'Fx_Disc', quad(0.5, -0.5, 0.5, 0.5), encodePng(RADIAL_SIZE, RADIAL_SIZE, discAlpha)],
  ['fx_ring.glb', 'Fx_Ring', quad(0.5, -0.5, 0.5, 0.5), encodePng(RADIAL_SIZE, RADIAL_SIZE, ringAlpha)],
  ['fx_shaft.glb', 'Fx_Shaft', quad(0.5, 0, 0.85, 1), encodePng(SHAFT_WIDTH, SHAFT_HEIGHT, shaftAlpha)],
]) {
  const glb = buildGlb(mesh, png, name)

  writeFileSync(join(outputDirectory, fileName), glb)

  console.log(`${fileName}: ${glb.length} bytes`)
}
