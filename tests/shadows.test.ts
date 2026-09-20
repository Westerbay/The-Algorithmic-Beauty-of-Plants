import assert from "node:assert/strict"
import test from "node:test"
import { vec3 } from "gl-matrix"
import { createShadowMatrix } from "../src/engine/shadow.js"

const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} != ${expected}`)

test("shadow projection fixes the receiving plane and follows the light direction", () => {
  const light = [4, 8, -2]
  for (const height of [-3, 0, 2]) {
    const matrix = createShadowMatrix(light, height)
    const onPlane = vec3.transformMat4(vec3.create(), [1, height, -5], matrix)
    close(onPlane[0], 1)
    close(onPlane[1], height)
    close(onPlane[2], -5)
    const point = [1, height + 4, -5] as const
    const projected = vec3.transformMat4(vec3.create(), point, matrix)
    close(projected[1], height)
    close(
      (point[0] - projected[0]) / light[0]!,
      (point[1] - projected[1]) / light[1]!,
    )
    close(
      (point[2] - projected[2]) / light[2]!,
      (point[1] - projected[1]) / light[1]!,
    )
  }
})
