export type Vector3 = [number, number, number]
export function add(a: Vector3, b: Vector3): Vector3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}
export function scale(a: Vector3, factor: number): Vector3 {
  return [a[0] * factor, a[1] * factor, a[2] * factor]
}
export function subtract(a: Vector3, b: Vector3): Vector3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}
export function cross(a: Vector3, b: Vector3): Vector3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}
export function normalize(a: Vector3, fallback: Vector3 = [0, 1, 0]): Vector3 {
  const length = Math.hypot(...a)
  return length > 1e-12 ? scale(a, 1 / length) : [...fallback]
}
export function vectorAt(values: number[], index: number): Vector3 {
  return [
    values[index * 3] ?? 0,
    values[index * 3 + 1] ?? 0,
    values[index * 3 + 2] ?? 0,
  ]
}
