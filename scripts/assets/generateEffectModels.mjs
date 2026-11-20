#!/usr/bin/env node
// Builds the three tiny effect meshes of the 3D scene as GLB files (no textures: the soft edges are vertex alpha).
//   fx_disc.glb   soft round glow, 1 unit across, facing +Z  (particles, comets, dust, aura behind a box)
//   fx_ring.glb   thin soft ring, 1 unit across, facing +Z   (shock wave)
//   fx_shaft.glb  soft curtain of light, 1 unit high from y = 0, rising from the open box towards the watch
// All three are unlit, double sided and alpha blended; the scene tints and fades them through baseColorFactor.
// Usage: node scripts/assets/generateEffectModels.mjs <outputDirectory>
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const outputDirectory = process.argv[2] ?? 'src/assets/models'
const SEGMENTS = 32

const buildMesh = ({ positions, alphas, indices }) => ({ positions, alphas, indices })

// Concentric rings of vertices, each ring { radius, alpha }; the first ring may have radius 0 (the centre).
const buildRadial = rings => {
  const positions = []
  const alphas = []
  const indices = []
  const ringStarts = []

  rings.forEach(ring => {
    ringStarts.push(positions.length / 3)

    if (ring.radius === 0) {
      positions.push(0, 0, 0)

      alphas.push(ring.alpha)

      return
    }

    for (let segment = 0; segment < SEGMENTS; segment += 1) {
      const angle = (segment / SEGMENTS) * Math.PI * 2

      positions.push(Math.cos(angle) * ring.radius, Math.sin(angle) * ring.radius, 0)

      alphas.push(ring.alpha)
    }
  })

  for (let ringIndex = 0; ringIndex < rings.length - 1; ringIndex += 1) {
    const inner = ringStarts[ringIndex]
    const outer = ringStarts[ringIndex + 1]

    if (rings[ringIndex].radius === 0) {
      for (let segment = 0; segment < SEGMENTS; segment += 1) {
        indices.push(inner, outer + segment, outer + ((segment + 1) % SEGMENTS))
      }
    } else {
      for (let segment = 0; segment < SEGMENTS; segment += 1) {
        const next = (segment + 1) % SEGMENTS

        indices.push(inner + segment, outer + segment, outer + next, inner + segment, outer + next, inner + next)
      }
    }
  }

  return buildMesh({ positions, alphas, indices })
}

const buildDisc = () =>
  buildRadial([
    { radius: 0, alpha: 1 },
    { radius: 0.05, alpha: 0.93 },
    { radius: 0.1, alpha: 0.74 },
    { radius: 0.15, alpha: 0.5 },
    { radius: 0.2, alpha: 0.29 },
    { radius: 0.27, alpha: 0.1 },
    { radius: 0.35, alpha: 0.03 },
    { radius: 0.5, alpha: 0 },
  ])

const buildRing = () =>
  buildRadial([
    { radius: 0.36, alpha: 0 },
    { radius: 0.44, alpha: 0.9 },
    { radius: 0.5, alpha: 0 },
  ])

// Light rising out of the open box: a soft flat curtain facing the camera (it is fixed), 1 unit high from y = 0, 1 unit wide
// at the bottom and wider at the top. Horizontally the light is strongest along the two edges (it follows the walls of the box)
// with a gentler glow in the middle and nothing at the sides; vertically it is strongest at the box and fades away towards the
// watch. Every vertex carries its own alpha, so there is no hard edge anywhere.
const SHAFT_COLUMNS = 14
const SHAFT_ROWS = 12
const gauss = (value, centre, width) => Math.exp(-(((value - centre) / width) ** 2))
const smooth = (edge0, edge1, value) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)))

  return t * t * (3 - 2 * t)
}
const shaftAlpha = (across, up) => {
  const horizontal = (0.55 * gauss(across, 0, 0.45) + 0.45 * (gauss(across, -0.7, 0.2) + gauss(across, 0.7, 0.2))) * (1 - Math.abs(across) ** 4)
  const vertical = (1 - up) ** 1.4 * smooth(0, 0.08, up)

  return 0.9 * horizontal * vertical
}

const buildShaft = () => {
  const positions = []
  const alphas = []
  const indices = []

  for (let row = 0; row <= SHAFT_ROWS; row += 1) {
    const up = row / SHAFT_ROWS

    for (let column = 0; column <= SHAFT_COLUMNS; column += 1) {
      const across = (column / SHAFT_COLUMNS) * 2 - 1

      positions.push(across * 0.5 * (1 + 0.7 * up), up, 0)

      alphas.push(shaftAlpha(across, up))
    }
  }

  for (let row = 0; row < SHAFT_ROWS; row += 1) {
    for (let column = 0; column < SHAFT_COLUMNS; column += 1) {
      const first = row * (SHAFT_COLUMNS + 1) + column
      const second = first + SHAFT_COLUMNS + 1

      indices.push(first, first + 1, second + 1, first, second + 1, second)
    }
  }

  return buildMesh({ positions, alphas, indices })
}

const toBuffer = (typedArray, targetOffset, padding) => Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength)

const buildGlb = (mesh, name) => {
  const vertexCount = mesh.positions.length / 3
  const positionArray = new Float32Array(mesh.positions)
  const normalArray = new Float32Array(vertexCount * 3)
  const colorArray = new Float32Array(vertexCount * 4)

  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    normalArray[vertex * 3 + 2] = 1

    colorArray.set([1, 1, 1, mesh.alphas[vertex]], vertex * 4)
  }

  const indexArray = new Uint16Array(mesh.indices)
  const pad4 = buffer => Buffer.concat([buffer, Buffer.alloc((4 - (buffer.length % 4)) % 4)])
  const chunks = [pad4(toBuffer(positionArray)), pad4(toBuffer(normalArray)), pad4(toBuffer(colorArray)), pad4(toBuffer(indexArray))]
  const offsets = chunks.reduce((accumulator, chunk) => [...accumulator, accumulator[accumulator.length - 1] + chunk.length], [0])
  const minimum = [0, 1, 2].map(axis => Math.min(...positionArray.filter((_, index) => index % 3 === axis)))
  const maximum = [0, 1, 2].map(axis => Math.max(...positionArray.filter((_, index) => index % 3 === axis)))
  const json = {
    asset: { version: '2.0', generator: 'generateEffectModels.mjs' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name, mesh: 0 }],
    meshes: [{ name, primitives: [{ attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2 }, indices: 3, material: 0 }] }],
    materials: [
      {
        name: `${name}_Material`,
        doubleSided: true,
        alphaMode: 'BLEND',
        pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 1 },
        extensions: { KHR_materials_unlit: {} },
      },
    ],
    extensionsUsed: ['KHR_materials_unlit'],
    accessors: [
      { bufferView: 0, componentType: 5126, count: vertexCount, type: 'VEC3', min: minimum, max: maximum },
      { bufferView: 1, componentType: 5126, count: vertexCount, type: 'VEC3' },
      { bufferView: 2, componentType: 5126, count: vertexCount, type: 'VEC4' },
      { bufferView: 3, componentType: 5123, count: indexArray.length, type: 'SCALAR' },
    ],
    bufferViews: chunks.map((chunk, index) => ({
      buffer: 0,
      byteOffset: offsets[index],
      byteLength: [positionArray, normalArray, colorArray, indexArray][index].byteLength,
      ...(index === 3 ? { target: 34963 } : { target: 34962 }),
    })),
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

for (const [fileName, name, mesh] of [
  ['fx_disc.glb', 'Fx_Disc', buildDisc()],
  ['fx_ring.glb', 'Fx_Ring', buildRing()],
  ['fx_shaft.glb', 'Fx_Shaft', buildShaft()],
]) {
  const glb = buildGlb(mesh, name)

  writeFileSync(join(outputDirectory, fileName), glb)

  console.log(`${fileName}: ${glb.length} bytes`)
}
