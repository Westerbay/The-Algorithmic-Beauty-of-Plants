export type Locale = "fr" | "en"
export type PresetId = "plant" | "hilbert" | "flower" | "tree"
export interface Definition {
  axiom: string
  rules: Array<{ symbol: string; replacement: string }>
  generations: number
  /** Step length in centimetres. */
  length: number
  /** Branch diameter as a percentage of the step length. */
  diameter: number
  /** Rotation angle in degrees. */
  angle: number
  colors: string[]
}
export type LSystemDefinition = Definition
export interface SceneOptions {
  sky: boolean
  ground: boolean
  lighting: boolean
  shadows: boolean
  autoRotate: boolean
  primitive: "rods" | "lines"
  theme: "light" | "dark"
  onError?: (error: Error) => void
}
export interface SceneDiagnostics {
  disposed: boolean
  running: boolean
  visible: boolean
  contextLost: boolean
  frameCount: number
  meshRevision: number
  gpuBuffers: number
  gpuTextures: number
}
export interface LSystemScene {
  update(definition: Definition): Promise<void>
  setOptions(options: Partial<SceneOptions>): void
  zoom(direction: "in" | "out"): void
  resetCamera(): void
  download(format: "obj" | "ply"): Promise<void>
  dispose(): void
  getDiagnostics(): SceneDiagnostics
}
