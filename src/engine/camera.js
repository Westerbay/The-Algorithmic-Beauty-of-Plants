import { mat4, vec3 } from "gl-matrix"

export class Camera {
  constructor() {
    this.rotateSpeed = 0.01
    this.FOV = 60
    this.nearPlane = 0.001
    this.farPlane = 1000
    this.radius = 1
    this.fitRadius = 1
    this.zoomFactor = 1
    this.yaw = 0
    this.pitch = 0
    this.minHeight = 0
    this.groundClearance = 0.001
    this.horizontalRadius = 0.1
    this.verticalDistance = 0.1
    this.boundingRadius = 0.1
    this.center = vec3.fromValues(0, 0, 0)
    this.position = vec3.fromValues(0, 0, 0)
    this.rotate = false
  }

  reset() {
    this.yaw = 0
    this.pitch = 0
    this.zoomFactor = 1
    this.radius = this.fitRadius
  }

  increaseRadius() {
    this.zoomFactor = Math.min(1000, this.zoomFactor * 1.15)
    this.radius = this.fitRadius * this.zoomFactor
  }

  decreaseRadius() {
    this.zoomFactor = Math.max(0.05, this.zoomFactor / 1.15)
    this.radius = this.fitRadius * this.zoomFactor
  }

  setGeometryBounds(mesh) {
    vec3.set(this.center, mesh.centerX(), mesh.centerY(), mesh.centerZ())
    this.minHeight = mesh.minY
    this.horizontalRadius = 0
    this.verticalDistance = 0
    this.boundingRadius = 0
    const tangent = Math.tan((this.FOV * Math.PI) / 360)
    // The actual vertex envelope avoids the empty corners of a bounding box.
    // Account for every yaw so autorotation cannot crop a fitted model.
    for (const vertices of [
      mesh.verticesLine,
      mesh.verticesRod,
      mesh.verticesLeaf,
    ]) {
      for (let index = 0; index < vertices.length; index += 3) {
        const horizontal = Math.hypot(
          vertices[index] - this.center[0],
          vertices[index + 2] - this.center[2],
        )
        const vertical = Math.abs(vertices[index + 1] - this.center[1])
        this.horizontalRadius = Math.max(this.horizontalRadius, horizontal)
        this.verticalDistance = Math.max(
          this.verticalDistance,
          horizontal + vertical / tangent,
        )
        this.boundingRadius = Math.max(
          this.boundingRadius,
          Math.hypot(horizontal, vertical),
        )
      }
    }
    this.groundClearance = Math.max(
      0.000001,
      Math.min(0.1, this.boundingRadius * 0.01),
    )
    this.nearPlane = Math.max(
      0.000001,
      Math.min(0.1, this.boundingRadius / 100),
    )
    this.reset()
  }

  fit(width, height) {
    const tangent = Math.tan((this.FOV * Math.PI) / 360)
    const horizontalAngle = Math.atan(tangent * Math.max(0.001, width / height))
    this.fitRadius = Math.max(
      0.01,
      1.2 * this.verticalDistance,
      (1.2 * this.horizontalRadius) / Math.sin(horizontalAngle),
    )
    // Preserve the user's zoom relative to the available frame on resize.
    this.radius = this.fitRadius * this.zoomFactor
    this.farPlane = Math.max(1000, this.radius + this.boundingRadius * 4)
  }

  computePosition() {
    const x = this.radius * Math.cos(this.pitch) * Math.sin(this.yaw)
    let y = this.radius * Math.sin(this.pitch)
    const z = this.radius * Math.cos(this.pitch) * Math.cos(this.yaw)
    if (y + this.center[1] - this.groundClearance < this.minHeight) {
      y = this.minHeight - this.center[1] + this.groundClearance
    }
    return vec3.fromValues(
      x + this.center[0],
      y + this.center[1],
      z + this.center[2],
    )
  }

  update(delta = 1 / 60) {
    if (this.rotate) {
      this.yaw += this.rotateSpeed * Math.min(delta, 0.05) * 60
      if (this.yaw > 2 * Math.PI) this.yaw -= 2 * Math.PI
    }
    this.position = this.computePosition()
  }

  computeMatrices(width, height, delta = 1 / 60) {
    this.fit(width, height)
    this.update(delta)
    const projection = mat4.create()
    mat4.perspective(
      projection,
      (this.FOV * Math.PI) / 180,
      width / height,
      this.nearPlane,
      this.farPlane,
    )
    const viewWorld = mat4.create()
    mat4.lookAt(viewWorld, this.position, this.center, [0, 1, 0])
    const world = mat4.create()
    mat4.multiply(world, projection, viewWorld)
    const viewBackground = mat4.create()
    mat4.copy(viewBackground, viewWorld)
    viewBackground[15] = 1
    viewBackground[14] = 0
    viewBackground[13] = 0
    viewBackground[12] = 0
    viewBackground[11] = 0
    viewBackground[3] = 0
    viewBackground[7] = 0
    const background = mat4.create()
    mat4.multiply(background, projection, viewBackground)
    return [background, world]
  }
}
