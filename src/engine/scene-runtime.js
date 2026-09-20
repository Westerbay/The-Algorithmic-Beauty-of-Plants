import { generateGeometry, validateDefinition } from "../core/index.ts"
import { Renderer } from "./renderer.js"

const DEFAULTS = {
  sky: false,
  ground: false,
  lighting: true,
  shadows: true,
  autoRotate: false,
  primitive: "rods",
  theme: "light",
}

export function createSceneRuntime(canvas, initialOptions) {
  const document = canvas.ownerDocument
  const window = document.defaultView
  if (!window) throw new Error("A scene requires a mounted browser canvas.")
  const gl = canvas.getContext("webgl", {
    antialias: true,
    alpha: false,
    stencil: true,
  })
  if (!gl) throw new Error("WebGL is unavailable in this browser.")
  let options = { ...DEFAULTS, ...initialOptions }
  let disposed = false
  let contextLost = false
  let visible = true
  let frame = null
  let lastTime = null
  let frameCount = 0
  let requestedRevision = 0
  let meshRevision = 0
  let currentMesh = null
  let currentDefinition = null
  let dragging = null
  const jobs = new Map()
  const events = new AbortController()
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
  const previousTouchAction = canvas.style.touchAction
  const previousTabIndex = canvas.getAttribute("tabindex")
  const renderOptions = () => ({
    ...options,
    autoRotate: options.autoRotate && !reducedMotion.matches,
  })
  let renderer = new Renderer(gl, renderOptions(), invalidate)
  canvas.style.touchAction = "pan-y"
  if (previousTabIndex === null) canvas.tabIndex = 0

  function report(error) {
    options.onError?.(error instanceof Error ? error : new Error(String(error)))
  }
  function stop() {
    if (frame !== null) window.cancelAnimationFrame(frame)
    frame = null
    lastTime = null
  }
  function resize() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (width <= 0 || height <= 0) return false
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const pixelWidth = Math.max(1, Math.round(width * dpr))
    const pixelHeight = Math.max(1, Math.round(height * dpr))
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight
    return true
  }
  function invalidate() {
    if (
      disposed ||
      contextLost ||
      !visible ||
      document.hidden ||
      frame !== null
    )
      return
    frame = window.requestAnimationFrame(render)
  }
  function render(time) {
    frame = null
    if (disposed || contextLost || !visible || document.hidden || !resize())
      return
    const delta =
      lastTime === null ? 1 / 60 : Math.min(0.05, (time - lastTime) / 1000)
    lastTime = time
    try {
      renderer.render(delta)
      frameCount++
    } catch (error) {
      stop()
      report(error)
      return
    }
    if (options.autoRotate && !reducedMotion.matches) invalidate()
  }
  function yieldTurn() {
    return new Promise((resolve) => {
      const id = window.setTimeout(() => {
        jobs.delete(id)
        resolve()
      }, 0)
      jobs.set(id, resolve)
    })
  }
  function orbit(dx, dy) {
    renderer.camera.yaw -= dx * 0.005
    const limit = Math.PI / 2 - 0.01
    renderer.camera.pitch = Math.max(
      -limit,
      Math.min(limit, renderer.camera.pitch + dy * 0.005),
    )
    invalidate()
  }
  function zoom(direction) {
    if (disposed) return
    if (direction === "in") renderer.camera.decreaseRadius()
    else renderer.camera.increaseRadius()
    invalidate()
  }
  function resetCamera() {
    if (disposed) return
    renderer.camera.reset()
    invalidate()
  }
  const listen = (target, name, callback, extra = {}) =>
    target.addEventListener(name, callback, { ...extra, signal: events.signal })
  listen(canvas, "pointerdown", (event) => {
    if (event.button !== 0 || disposed || contextLost) return
    dragging = { id: event.pointerId, x: event.clientX, y: event.clientY }
    canvas.setPointerCapture?.(event.pointerId)
    if (event.pointerType !== "touch") canvas.focus({ preventScroll: true })
  })
  listen(canvas, "pointermove", (event) => {
    if (!dragging || dragging.id !== event.pointerId) return
    orbit(event.clientX - dragging.x, event.clientY - dragging.y)
    dragging.x = event.clientX
    dragging.y = event.clientY
  })
  const releasePointer = (event) => {
    if (!dragging || dragging.id !== event.pointerId) return
    dragging = null
    if (canvas.hasPointerCapture?.(event.pointerId))
      canvas.releasePointerCapture(event.pointerId)
  }
  listen(canvas, "pointerup", releasePointer)
  listen(canvas, "pointercancel", releasePointer)
  listen(canvas, "lostpointercapture", () => {
    dragging = null
  })
  listen(
    canvas,
    "wheel",
    (event) => {
      const focused =
        canvas.getRootNode().activeElement === canvas ||
        document.activeElement === canvas
      if (!event.ctrlKey && !focused) return
      event.preventDefault()
      zoom(event.deltaY < 0 ? "in" : "out")
    },
    { passive: false },
  )
  listen(canvas, "keydown", (event) => {
    const action = {
      ArrowLeft: () => orbit(-12, 0),
      ArrowRight: () => orbit(12, 0),
      ArrowUp: () => orbit(0, -12),
      ArrowDown: () => orbit(0, 12),
      "+": () => zoom("in"),
      "=": () => zoom("in"),
      "-": () => zoom("out"),
      Home: resetCamera,
      r: resetCamera,
      R: resetCamera,
    }[event.key]
    if (action) {
      event.preventDefault()
      action()
    }
  })
  listen(document, "visibilitychange", () => {
    if (document.hidden) stop()
    else invalidate()
  })
  listen(reducedMotion, "change", () => {
    renderer.setOptions(renderOptions())
    stop()
    invalidate()
  })
  listen(window, "resize", invalidate)
  listen(canvas, "webglcontextlost", (event) => {
    event.preventDefault()
    contextLost = true
    stop()
    renderer.dispose()
    report(
      new Error(
        "The WebGL context was lost. The scene will resume when it becomes available.",
      ),
    )
  })
  listen(canvas, "webglcontextrestored", () => {
    if (disposed) return
    try {
      renderer = new Renderer(gl, renderOptions(), invalidate)
      if (currentMesh && currentDefinition)
        renderer.loadMesh(currentMesh, currentDefinition.colors)
      contextLost = false
      invalidate()
    } catch (error) {
      contextLost = true
      report(error)
    }
  })
  const resizeObserver = window.ResizeObserver
    ? new window.ResizeObserver(invalidate)
    : null
  resizeObserver?.observe(canvas)
  const intersectionObserver = window.IntersectionObserver
    ? new window.IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting)
        if (visible) invalidate()
        else stop()
      })
    : null
  intersectionObserver?.observe(canvas)
  invalidate()

  return {
    async update(definition) {
      if (disposed) return
      const revision = ++requestedRevision
      const snapshot = validateDefinition(definition)
      await yieldTurn()
      if (disposed || revision !== requestedRevision) return
      const mesh = generateGeometry(snapshot)
      await yieldTurn()
      if (disposed || revision !== requestedRevision) return
      if (!contextLost) renderer.loadMesh(mesh, snapshot.colors)
      currentMesh = mesh
      currentDefinition = snapshot
      meshRevision = revision
      invalidate()
    },
    setOptions(partial) {
      if (disposed) return
      options = { ...options, ...partial }
      if (!contextLost) renderer.setOptions(renderOptions())
      stop()
      invalidate()
    },
    zoom,
    resetCamera,
    async download(format) {
      if (disposed || !currentMesh || !currentDefinition)
        throw new Error("Generate a scene before exporting it.")
      if (format !== "obj" && format !== "ply")
        throw new Error("Unsupported export format.")
      const { TurtleMeshExporter } = await import("./exporter.js")
      if (disposed) return
      const exporter = new TurtleMeshExporter()
      if (format === "obj")
        await exporter.toObjAndMtl(currentMesh, renderer.colors)
      else await exporter.toPly(currentMesh, renderer.colors)
    },
    dispose() {
      if (disposed) return
      disposed = true
      requestedRevision++
      stop()
      events.abort()
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
      jobs.forEach((resolve, id) => {
        window.clearTimeout(id)
        resolve()
      })
      jobs.clear()
      if (dragging && canvas.hasPointerCapture?.(dragging.id))
        canvas.releasePointerCapture(dragging.id)
      dragging = null
      renderer.dispose()
      currentMesh = null
      currentDefinition = null
      canvas.style.touchAction = previousTouchAction
      if (previousTabIndex === null) canvas.removeAttribute("tabindex")
    },
    getDiagnostics() {
      return {
        disposed,
        running: frame !== null,
        visible,
        contextLost,
        frameCount,
        meshRevision,
        gpuBuffers: renderer.buffers.size,
        gpuTextures: renderer.textures.size,
      }
    },
  }
}
