import { mat4 } from "gl-matrix"

/** Directional projection onto the model's lowest horizontal plane. */
export function createShadowMatrix(light, height) {
  const [x, y, z] = light
  return mat4.fromValues(
    1,
    0,
    0,
    0,
    -x / y,
    0,
    -z / y,
    0,
    0,
    0,
    1,
    0,
    (x / y) * height,
    height,
    (z / y) * height,
    1,
  )
}
