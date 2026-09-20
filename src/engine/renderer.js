import { mat4 } from "gl-matrix"
import { Camera } from "./camera.js"
import { Background } from "./background.js"
import { Shader } from "./shaders.js"
import { createShadowMatrix } from "./shadow.js"
import { loadImage, loadTextureSources } from "./texture-loader.js"

export class Renderer {
  constructor(gl, options, invalidate) {
    this.gl = gl
    this.options = options
    this.invalidate = invalidate
    this.camera = new Camera()
    this.background = new Background()
    this.buffers = new Set()
    this.textures = new Set()
    this.programs = new Set()
    this.shaders = new Set()
    this.pending = new Map()
    this.backgroundTextures = {}
    this.meshGeometries = []
    this.skyGeometries = []
    this.groundGeometry = null
    this.mesh = null
    this.colors = new Float32Array([0.5, 0.5, 0.5])
    this.modelGround = mat4.create()
    this.shadowMatrix = mat4.create()
    this.hasStencil = gl.getContextAttributes()?.stencil === true
    this.disposed = false
    this.uintIndices = !!gl.getExtension("OES_element_index_uint")
    try {
      const shader = new Shader()
      this.systemProgram = this.createProgram(
        shader.getVertexShaderSystem(),
        shader.getFragmentShaderSystem(),
        shader.getAttributesSystem(),
        shader.getUniformsSystem(),
      )
      this.backgroundProgram = this.createProgram(
        shader.getVertexShaderBackground(),
        shader.getFragmentShaderBackground(),
        shader.getAttributesBackground(),
        shader.getUniformsBackground(),
      )
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      this.setOptions(options)
    } catch (error) {
      this.dispose()
      throw error
    }
  }

  createProgram(vertex, fragment, attributes, uniforms) {
    const gl = this.gl
    const program = gl.createProgram()
    if (!program) throw new Error("Unable to create a WebGL program.")
    this.programs.add(program)
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertex],
      [gl.FRAGMENT_SHADER, fragment],
    ]) {
      const shader = gl.createShader(type)
      if (!shader) throw new Error("Unable to create a WebGL shader.")
      this.shaders.add(shader)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw new Error("WebGL shader: " + gl.getShaderInfoLog(shader))
      gl.attachShader(program, shader)
    }
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error("WebGL program: " + gl.getProgramInfoLog(program))
    for (const shader of gl.getAttachedShaders(program) || []) {
      gl.detachShader(program, shader)
      gl.deleteShader(shader)
      this.shaders.delete(shader)
    }
    const locations = {}
    for (const name of attributes)
      locations[name] = gl.getAttribLocation(program, name)
    for (const name of uniforms)
      locations[name] = gl.getUniformLocation(program, name)
    return { program, locations }
  }

  createGeometry(attributes, indices) {
    const gl = this.gl
    const buffers = []
    const upload = (target, data) => {
      const buffer = gl.createBuffer()
      if (!buffer) throw new Error("Unable to allocate a WebGL buffer.")
      this.buffers.add(buffer)
      buffers.push(buffer)
      gl.bindBuffer(target, buffer)
      gl.bufferData(target, data, gl.STATIC_DRAW)
      return buffer
    }
    try {
      let maxIndex = 0
      for (const value of indices) maxIndex = Math.max(maxIndex, value)
      if (!this.uintIndices && maxIndex > 65535)
        throw new Error(
          "This browser cannot display a mesh of this size. Reduce the generation count.",
        )
      const entries = Object.entries(attributes).map(
        ([name, [data, size]]) => ({
          name,
          size,
          buffer: upload(
            gl.ARRAY_BUFFER,
            data instanceof Float32Array ? data : new Float32Array(data),
          ),
        }),
      )
      const type = this.uintIndices ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT
      const elementBuffer = upload(
        gl.ELEMENT_ARRAY_BUFFER,
        this.uintIndices ? new Uint32Array(indices) : new Uint16Array(indices),
      )
      return { entries, elementBuffer, count: indices.length, type, buffers }
    } catch (error) {
      for (const buffer of buffers) {
        gl.deleteBuffer(buffer)
        this.buffers.delete(buffer)
      }
      throw error
    }
  }

  removeGeometry(geometry) {
    if (!geometry) return
    for (const buffer of geometry.buffers) {
      this.gl.deleteBuffer(buffer)
      this.buffers.delete(buffer)
    }
  }

  loadMesh(mesh, colors) {
    if (this.disposed) return
    const geometries = []
    try {
      for (const kind of ["Line", "Rod", "Leaf"]) {
        geometries.push(
          this.createGeometry(
            {
              aPosition: [mesh[`getVertex${kind}Buffer`](), 3],
              aNormal: [mesh[`getNormal${kind}Buffer`](), 3],
              aColorIndex: [mesh[`getColorIndex${kind}Buffer`](), 1],
            },
            mesh[`getElement${kind}Buffer`](),
          ),
        )
      }
    } catch (error) {
      geometries.forEach((geometry) => this.removeGeometry(geometry))
      throw error
    }
    this.meshGeometries.forEach((geometry) => this.removeGeometry(geometry))
    this.meshGeometries = geometries
    this.mesh = mesh
    this.colors = new Float32Array(
      colors.flatMap((color) => {
        let hex = color.slice(1)
        if (hex.length === 3) hex = [...hex].map((char) => char + char).join("")
        const rgb = Number.parseInt(hex, 16)
        return [
          ((rgb >> 16) & 255) / 255,
          ((rgb >> 8) & 255) / 255,
          (rgb & 255) / 255,
        ]
      }),
    )
    this.camera.setGeometryBounds(mesh)
    mat4.fromTranslation(this.modelGround, [0, mesh.minY, 0])
    this.shadowMatrix = createShadowMatrix(
      this.background.lightPosition,
      mesh.minY,
    )
  }

  setOptions(options) {
    this.options = { ...this.options, ...options }
    for (const kind of ["ground", "sky"]) {
      if (this.options[kind]) this.ensureBackground(kind)
      else this.pending.get(kind)?.abort()
    }
  }

  ensureBackground(kind) {
    if (
      this.disposed ||
      this.backgroundTextures[kind] ||
      this.pending.has(kind)
    )
      return
    const controller = new AbortController()
    this.pending.set(kind, controller)
    void (async () => {
      try {
        const sources = await loadTextureSources(kind)
        if (this.disposed || controller.signal.aborted) return
        const images = await Promise.all(
          sources.map((source) => loadImage(source, controller.signal)),
        )
        if (this.disposed || controller.signal.aborted) return
        const textures = []
        try {
          for (const image of images) textures.push(this.createTexture(image))
          this.createBackgroundGeometry(kind)
          this.backgroundTextures[kind] = textures
        } catch (error) {
          for (const texture of textures) {
            this.gl.deleteTexture(texture)
            this.textures.delete(texture)
          }
          throw error
        }
        this.invalidate()
      } catch (error) {
        if (!this.disposed && !controller.signal.aborted)
          this.options.onError?.(
            error instanceof Error ? error : new Error(String(error)),
          )
      } finally {
        if (this.pending.get(kind) === controller) {
          this.pending.delete(kind)
          if (controller.signal.aborted && !this.disposed && this.options[kind])
            this.ensureBackground(kind)
        }
      }
    })()
  }

  createTexture(image) {
    const gl = this.gl
    const texture = gl.createTexture()
    if (!texture) throw new Error("Unable to allocate a background texture.")
    this.textures.add(texture)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    const powerOfTwo = (size) => (size & (size - 1)) === 0
    const mipmaps = powerOfTwo(image.width) && powerOfTwo(image.height)
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      mipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR,
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_S,
      mipmaps ? gl.REPEAT : gl.CLAMP_TO_EDGE,
    )
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_T,
      mipmaps ? gl.REPEAT : gl.CLAMP_TO_EDGE,
    )
    if (mipmaps) gl.generateMipmap(gl.TEXTURE_2D)
    return texture
  }

  createBackgroundGeometry(kind) {
    const b = this.background
    if (kind === "ground" && !this.groundGeometry) {
      this.groundGeometry = this.createGeometry(
        {
          aPosition: [b.groundVertices, 3],
          aNormal: [b.groundNormals, 3],
          aTangent: [b.groundTangent, 3],
          aUV: [b.groundUVs, 2],
        },
        b.groundElements,
      )
    }
    if (kind === "sky" && !this.skyGeometries.length) {
      const geometries = []
      try {
        for (const vertices of b.skyVertices)
          geometries.push(
            this.createGeometry(
              {
                aPosition: [vertices, 3],
                aNormal: [b.skyNormals, 3],
                aTangent: [b.skyTangents, 3],
                aUV: [b.skyUVs, 2],
              },
              b.skyElements,
            ),
          )
        this.skyGeometries = geometries
      } catch (error) {
        geometries.forEach((geometry) => this.removeGeometry(geometry))
        throw error
      }
    }
  }

  draw(geometry, program, mode) {
    if (!geometry || !geometry.count) return
    const gl = this.gl
    for (const entry of geometry.entries) {
      const location = program.locations[entry.name]
      if (location == null || location < 0) continue
      gl.bindBuffer(gl.ARRAY_BUFFER, entry.buffer)
      gl.enableVertexAttribArray(location)
      gl.vertexAttribPointer(location, entry.size, gl.FLOAT, false, 0, 0)
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.elementBuffer)
    gl.drawElements(mode, geometry.count, geometry.type, 0)
  }

  render(delta) {
    if (this.disposed) return
    const gl = this.gl
    const dark = this.options.theme === "dark"
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.clearColor(
      ...(dark ? [0.145, 0.145, 0.145, 1] : [0.973, 0.969, 0.957, 1]),
    )
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
    this.camera.rotate = this.options.autoRotate
    const [skyMatrix, worldMatrix] = this.camera.computeMatrices(
      gl.canvas.width,
      gl.canvas.height,
      delta,
    )
    if (
      this.options.sky &&
      this.backgroundTextures.sky &&
      this.skyGeometries.length
    ) {
      gl.disable(gl.DEPTH_TEST)
      this.renderBackground(skyMatrix, true)
    }
    gl.enable(gl.DEPTH_TEST)
    if (
      this.options.ground &&
      this.backgroundTextures.ground &&
      this.groundGeometry
    )
      this.renderBackground(worldMatrix, false)
    if (!this.mesh) return
    const program = this.systemProgram
    const u = program.locations
    gl.useProgram(program.program)
    gl.uniformMatrix4fv(u.cameraMatrix, false, worldMatrix)
    gl.uniform3fv(u.colorStack, this.colors)
    gl.uniform1i(u.colorStackLength, this.colors.length / 3)
    gl.uniform3fv(u.uLightPos, this.background.lightPosition)
    gl.uniform3fv(u.uViewPos, this.camera.position)
    gl.uniform1i(u.uEnableLighting, this.options.lighting)
    gl.uniform4fv(u.shadowColor, [0, 0, 0, dark ? 0.6 : 0.35])
    const drawMesh = () => {
      this.draw(
        this.meshGeometries[this.options.primitive === "lines" ? 0 : 1],
        program,
        this.options.primitive === "lines" ? gl.LINES : gl.TRIANGLES,
      )
      this.draw(this.meshGeometries[2], program, gl.TRIANGLES)
    }
    gl.uniform1i(u.isShadow, false)
    gl.uniformMatrix4fv(u.model, false, mat4.create())
    drawMesh()
    if (this.options.shadows) {
      // Blend overlapping projected branches/leaves once, while keeping the
      // opaque model in front. A stencil attachment needs no texture download.
      if (this.hasStencil) {
        gl.enable(gl.STENCIL_TEST)
        gl.stencilFunc(gl.EQUAL, 0, 0xff)
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR)
        gl.depthMask(false)
      }
      gl.uniform1i(u.isShadow, true)
      gl.uniformMatrix4fv(u.model, false, this.shadowMatrix)
      drawMesh()
      gl.depthMask(true)
      if (this.hasStencil) gl.disable(gl.STENCIL_TEST)
    }
  }

  renderBackground(matrix, sky) {
    const gl = this.gl
    const program = this.backgroundProgram
    const u = program.locations
    gl.useProgram(program.program)
    gl.uniformMatrix4fv(u.model, false, sky ? mat4.create() : this.modelGround)
    gl.uniformMatrix4fv(u.cameraMatrix, false, matrix)
    gl.uniform1i(u.uDiffuseMap, 0)
    gl.uniform1i(u.uNormalMap, 1)
    gl.uniform3fv(u.uLightPos, this.background.lightPosition)
    gl.uniform3fv(u.uViewPos, this.camera.position)
    gl.uniform1i(u.uEnableLighting, !sky && this.options.lighting)
    const textures = this.backgroundTextures[sky ? "sky" : "ground"]
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, sky ? textures[0] : textures[1])
    gl.activeTexture(gl.TEXTURE0)
    if (sky)
      this.skyGeometries.forEach((geometry, index) => {
        gl.bindTexture(gl.TEXTURE_2D, textures[index])
        this.draw(geometry, program, gl.TRIANGLES)
      })
    else {
      gl.bindTexture(gl.TEXTURE_2D, textures[0])
      this.draw(this.groundGeometry, program, gl.TRIANGLES)
    }
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.pending.forEach((controller) => controller.abort())
    this.pending.clear()
    this.buffers.forEach((buffer) => this.gl.deleteBuffer(buffer))
    this.textures.forEach((texture) => this.gl.deleteTexture(texture))
    this.programs.forEach((program) => this.gl.deleteProgram(program))
    this.shaders.forEach((shader) => this.gl.deleteShader(shader))
    this.buffers.clear()
    this.textures.clear()
    this.programs.clear()
    this.shaders.clear()
    this.mesh = null
    this.meshGeometries = []
    this.skyGeometries = []
    this.backgroundTextures = {}
  }
}
