import assert from "node:assert/strict"
import test from "node:test"
import { Camera } from "../src/engine/camera.js"
import { generateGeometry, getPreset, PRESETS } from "../src/core/index.ts"

for (const preset of PRESETS) {
  test(`${preset.id} fits wide, square and narrow canvases through a complete orbit`, () => {
    const mesh = generateGeometry(getPreset(preset.id))
    const camera = new Camera()
    camera.setGeometryBounds(mesh)
    for (const [width, height] of [
      [880, 520],
      [400, 400],
      [280, 400],
    ]) {
      for (let step = 0; step < 24; step++) {
        camera.yaw = (step * Math.PI) / 12
        const [, matrix] = camera.computeMatrices(width!, height!, 0)
        for (const vertices of [
          mesh.verticesLine,
          mesh.verticesRod,
          mesh.verticesLeaf,
        ]) {
          for (let index = 0; index < vertices.length; index += 3) {
            const x = vertices[index]!,
              y = vertices[index + 1]!,
              z = vertices[index + 2]!
            const w =
              matrix![3]! * x +
              matrix![7]! * y +
              matrix![11]! * z +
              matrix![15]!
            for (const row of [0, 1, 2]) {
              const value =
                (matrix![row]! * x +
                  matrix![4 + row]! * y +
                  matrix![8 + row]! * z +
                  matrix![12 + row]!) /
                w
              assert.ok(
                Number.isFinite(value) && Math.abs(value) < 1,
                `${preset.id} clipped at ${width}x${height}, orbit step ${step}`,
              )
            }
          }
        }
      }
    }
  })
}

test("camera preserves relative user zoom on resize and resets for a new mesh", () => {
  const camera = new Camera()
  camera.setGeometryBounds(generateGeometry(getPreset("tree")))
  camera.computeMatrices(880, 520, 0)
  const wideRadius = camera.radius
  assert.ok(
    wideRadius < 4,
    "the desktop tree should fill more than the legacy depth + 4 frame",
  )
  camera.decreaseRadius()
  const zoom = camera.zoomFactor
  assert.ok(zoom < 1)
  camera.computeMatrices(280, 400, 0)
  assert.equal(camera.zoomFactor, zoom)
  assert.ok(
    camera.fitRadius > wideRadius,
    "narrow view needs additional horizontal framing room",
  )
  assert.equal(camera.radius, camera.fitRadius * zoom)
  camera.yaw = 1
  camera.pitch = 0.3
  camera.reset()
  assert.equal(camera.zoomFactor, 1)
  assert.equal(camera.yaw, 0)
  assert.equal(camera.pitch, 0)
  assert.equal(camera.radius, camera.fitRadius)
  camera.increaseRadius()
  camera.setGeometryBounds(generateGeometry(getPreset("plant")))
  assert.equal(camera.zoomFactor, 1)
})
