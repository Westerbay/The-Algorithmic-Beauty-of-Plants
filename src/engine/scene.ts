import { createSceneRuntime } from "./scene-runtime.js"
import type { LSystemScene, SceneOptions } from "../types"

/** Create only after mounting the canvas. Importing this module is SSR-safe. */
export function createScene(
  canvas: HTMLCanvasElement,
  options: SceneOptions,
): LSystemScene {
  return createSceneRuntime(canvas, options)
}
