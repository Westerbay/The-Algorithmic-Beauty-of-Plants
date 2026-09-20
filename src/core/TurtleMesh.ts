import { add, cross, normalize, scale, subtract, vectorAt } from "./math.ts"
import type { Vector3 } from "./math.ts"

/** CPU geometry with the array/buffer API consumed by the original custom renderer. */
export class TurtleMesh {
  verticesLine: number[] = []
  colorIndicesLine: number[] = []
  elementsLine: number[] = []
  normalsLine: number[] = []
  tangentsLine: number[] = []
  verticesPolygon: number[] = []
  normalsPolygon: number[] = []
  tangentsPolygon: number[] = []
  colorIndicesPolygon: number[] = []
  verticesRod: number[] = []
  colorIndicesRod: number[] = []
  elementsRod: number[] = []
  normalsRod: number[] = []
  tangentsRod: number[] = []
  verticesLeaf: number[] = []
  colorIndicesLeaf: number[] = []
  elementsLeaf: number[] = []
  normalsLeaf: number[] = []
  tangentsLeaf: number[] = []
  minX = Infinity
  maxX = -Infinity
  minY = Infinity
  maxY = -Infinity
  minZ = Infinity
  maxZ = -Infinity

  updateCenter(vertex: Vector3): void {
    this.minX = Math.min(this.minX, vertex[0])
    this.maxX = Math.max(this.maxX, vertex[0])
    this.minY = Math.min(this.minY, vertex[1])
    this.maxY = Math.max(this.maxY, vertex[1])
    this.minZ = Math.min(this.minZ, vertex[2])
    this.maxZ = Math.max(this.maxZ, vertex[2])
  }

  addVertexLine(
    vertex: Vector3,
    colorIndex: number,
    normal: Vector3,
    tangent: Vector3,
  ): void {
    this.updateCenter(vertex)
    this.verticesLine.push(...vertex)
    this.colorIndicesLine.push(colorIndex)
    this.normalsLine.push(...normal)
    this.tangentsLine.push(...tangent)
  }

  addVertexPolygon(
    vertex: Vector3,
    colorIndex: number,
    normal: Vector3,
    tangent: Vector3,
  ): void {
    this.updateCenter(vertex)
    this.verticesPolygon.push(...vertex)
    this.colorIndicesPolygon.push(colorIndex)
    this.normalsPolygon.push(...normal)
    this.tangentsPolygon.push(...tangent)
  }

  addLine(startIdx: number, endIdx: number): void {
    this.elementsLine.push(startIdx, endIdx)
  }

  addRod(startIdx: number, endIdx: number, radius: number): void {
    const start = vectorAt(this.verticesLine, startIdx)
    const end = vectorAt(this.verticesLine, endIdx)
    const direction = normalize(subtract(end, start))
    const up: Vector3 = Math.abs(direction[1]) < 0.99 ? [0, 1, 0] : [1, 0, 0]
    const axis1 = normalize(cross(direction, up))
    const axis2 = normalize(cross(direction, axis1))
    const base = this.verticesRod.length / 3
    for (let cap = 0; cap < 2; cap++) {
      const position = cap === 0 ? start : end
      const color = this.colorIndicesLine[cap === 0 ? startIdx : endIdx] ?? 0
      for (let side = 0; side < 4; side++) {
        const angle = (Math.PI * side) / 2
        const normal = add(
          scale(axis1, Math.cos(angle)),
          scale(axis2, Math.sin(angle)),
        )
        const vertex = add(position, scale(normal, radius))
        this.updateCenter(vertex)
        this.verticesRod.push(...vertex)
        this.normalsRod.push(...normal)
        this.tangentsRod.push(...direction)
        this.colorIndicesRod.push(color)
      }
    }
    for (const [a, b, c, d] of [
      [0, 1, 5, 4],
      [1, 2, 6, 5],
      [2, 3, 7, 6],
      [3, 0, 4, 7],
      [0, 3, 2, 1],
      [4, 5, 6, 7],
    ] as [number, number, number, number][]) {
      this.elementsRod.push(
        base + a,
        base + b,
        base + c,
        base + a,
        base + c,
        base + d,
      )
    }
  }

  addPolygon(indices: number[], length: number): void {
    if (indices.length < 3) return
    let sum: Vector3 = [0, 0, 0]
    for (const index of indices)
      sum = add(sum, vectorAt(this.normalsPolygon, index))
    const averageNormal = normalize(
      sum,
      normalize(vectorAt(this.normalsPolygon, indices[0] ?? 0)),
    )
    const offset = scale(averageNormal, length * 0.01)
    const base = this.verticesLeaf.length / 3
    const count = indices.length
    for (let back = 0; back < 2; back++) {
      for (const index of indices) {
        const original = vectorAt(this.verticesPolygon, index)
        const position = back ? subtract(original, offset) : original
        this.updateCenter(position)
        this.verticesLeaf.push(...position)
        this.normalsLeaf.push(
          ...scale(vectorAt(this.normalsPolygon, index), back ? -1 : 1),
        )
        this.tangentsLeaf.push(
          ...scale(vectorAt(this.tangentsPolygon, index), back ? -1 : 1),
        )
        this.colorIndicesLeaf.push(this.colorIndicesPolygon[index] ?? 0)
      }
    }
    for (let index = 1; index < count - 1; index++) {
      this.elementsLeaf.push(base, base + index, base + index + 1)
      this.elementsLeaf.push(
        base + count,
        base + count + index + 1,
        base + count + index,
      )
    }
    for (let index = 0; index < count; index++) {
      const next = (index + 1) % count
      this.elementsLeaf.push(
        base + index,
        base + next,
        base + count + next,
        base + index,
        base + count + next,
        base + count + index,
      )
    }
  }

  getVertexLineBuffer(): Float32Array {
    return new Float32Array(this.verticesLine)
  }
  getColorIndexLineBuffer(): Float32Array {
    return new Float32Array(this.colorIndicesLine)
  }
  getElementLineBuffer(): Uint32Array {
    return new Uint32Array(this.elementsLine)
  }
  getNormalLineBuffer(): Float32Array {
    return new Float32Array(this.normalsLine)
  }
  getTangentLineBuffer(): Float32Array {
    return new Float32Array(this.tangentsLine)
  }
  getVertexRodBuffer(): Float32Array {
    return new Float32Array(this.verticesRod)
  }
  getColorIndexRodBuffer(): Float32Array {
    return new Float32Array(this.colorIndicesRod)
  }
  getElementRodBuffer(): Uint32Array {
    return new Uint32Array(this.elementsRod)
  }
  getNormalRodBuffer(): Float32Array {
    return new Float32Array(this.normalsRod)
  }
  getTangentRodBuffer(): Float32Array {
    return new Float32Array(this.tangentsRod)
  }
  getVertexLeafBuffer(): Float32Array {
    return new Float32Array(this.verticesLeaf)
  }
  getColorIndexLeafBuffer(): Float32Array {
    return new Float32Array(this.colorIndicesLeaf)
  }
  getElementLeafBuffer(): Uint32Array {
    return new Uint32Array(this.elementsLeaf)
  }
  getNormalLeafBuffer(): Float32Array {
    return new Float32Array(this.normalsLeaf)
  }
  getTangentLeafBuffer(): Float32Array {
    return new Float32Array(this.tangentsLeaf)
  }
  centerX(): number {
    return (this.minX + this.maxX) / 2
  }
  centerY(): number {
    return (this.minY + this.maxY) / 2
  }
  centerZ(): number {
    return (this.minZ + this.maxZ) / 2
  }
  maxDepth(): number {
    return Math.max(Math.abs(this.maxZ), Math.abs(this.minZ))
  }
}
