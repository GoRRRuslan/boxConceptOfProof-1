import { computeBoxGridLayout } from '@flows/spikeFlow/_facadesLogic/computeBoxGridLayout'

describe('computeBoxGridLayout', () => {
  it('keeps a single box at the origin at full size', () => {
    const layout = computeBoxGridLayout(1)

    expect(layout.positions).toEqual([[0, 0, 0]])

    expect(layout.scale).toEqual([1, 1, 1])
  })

  it.each([4, 16, 64])('creates exactly %i distinct positions', boxCount => {
    const layout = computeBoxGridLayout(boxCount)
    const uniquePositions = new Set(layout.positions.map(position => position.join(',')))

    expect(layout.positions).toHaveLength(boxCount)

    expect(uniquePositions.size).toBe(boxCount)
  })

  it('centres the grid horizontally', () => {
    const layout = computeBoxGridLayout(16)
    const horizontalSum = layout.positions.reduce((sum, position) => sum + position[0], 0)

    expect(horizontalSum).toBeCloseTo(0)
  })

  it('moves the camera further away for bigger grids', () => {
    const smallGridDistance = Math.abs(computeBoxGridLayout(4).cameraPosition[2])
    const largeGridDistance = Math.abs(computeBoxGridLayout(64).cameraPosition[2])

    expect(largeGridDistance).toBeGreaterThan(smallGridDistance)
  })
})
