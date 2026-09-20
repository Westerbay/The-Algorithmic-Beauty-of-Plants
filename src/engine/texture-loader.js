export async function loadTextureSources(kind) {
  if (kind === "ground") {
    const modules = await Promise.all([
      import("../textures/groundDiffuse64.js"),
      import("../textures/groundNormal64.js"),
    ])
    return modules.map((module) => module.default)
  }
  const modules = await Promise.all([
    import("../textures/skyFront64.js"),
    import("../textures/skyBack64.js"),
    import("../textures/skyRight64.js"),
    import("../textures/skyLeft64.js"),
    import("../textures/skyTop64.js"),
    import("../textures/skyBottom64.js"),
  ])
  return modules.map((module) => module.default)
}

export function loadImage(source, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted)
      return reject(new DOMException("Cancelled", "AbortError"))
    const image = new Image()
    const cleanup = () => {
      image.onload = null
      image.onerror = null
      signal.removeEventListener("abort", abort)
    }
    const abort = () => {
      cleanup()
      image.src = ""
      reject(new DOMException("Cancelled", "AbortError"))
    }
    image.onload = () => {
      cleanup()
      resolve(image)
    }
    image.onerror = () => {
      cleanup()
      reject(new Error("The background texture could not be loaded."))
    }
    signal.addEventListener("abort", abort, { once: true })
    image.src = source
  })
}
