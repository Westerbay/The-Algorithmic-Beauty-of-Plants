import { useCallback, useEffect, useId, useRef, useState } from "react"
import type { FormEvent } from "react"
import { createScene } from "../engine/scene"
import { getPreset, PRESETS } from "../core/presets"
import {
  validateDefinition,
  MAX_GENERATIONS,
  MAX_INPUT_LENGTH,
  MAX_RULES,
} from "../core/index"
import type { LSystemDefinition, SceneOptions } from "../types"
import { commandHelp, messages } from "../messages"
import type { MessageKey } from "../messages"
import "../styles.css"

export interface LSystemProps {
  initialPreset?: "plant" | "hilbert" | "flower" | "tree"
  initialDefinition?: LSystemDefinition
  locale?: "en" | "fr"
  theme?: "light" | "dark" | "system"
  controls?: "full" | "compact" | "none"
  autoRotate?: boolean
  className?: string
  onError?: (error: Error) => void
  onDefinitionChange?: (definition: LSystemDefinition) => void
}

type PresetId = NonNullable<LSystemProps["initialPreset"]>
type Scene = ReturnType<typeof createScene>
type SceneSettings = Omit<SceneOptions, "theme" | "onError">
type Failure = {
  kind: "scene" | "definition" | "export"
  error: Error
  initial?: boolean
}
type NumericField = "generations" | "length" | "diameter" | "angle"

function copyDefinition(definition: LSystemDefinition): LSystemDefinition {
  return {
    ...definition,
    rules: definition.rules.map((rule) => ({ ...rule })),
    colors: [...definition.colors],
  }
}

function asError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

function errorKey(failure: Failure): MessageKey {
  if (failure.kind === "scene")
    return failure.initial ? "unavailable" : "sceneError"
  if (failure.kind === "export") return "exportError"
  const code = String(
    (failure.error as Error & { code?: string }).code ?? "",
  ).toLowerCase()
  if (code === "invalid_number") {
    const field = failure.error.message.toLowerCase()
    if (field.startsWith("generations")) return "errorGeneration"
    if (field.startsWith("length")) return "errorLength"
    if (field.startsWith("diameter")) return "errorDiameter"
    if (field.startsWith("angle")) return "errorAngle"
  }
  if (code === "invalid_definition" && /axiom/i.test(failure.error.message))
    return "errorAxiom"
  if (/limit|complex|large|budget|overflow|size/.test(code)) return "errorSize"
  if (/generation/.test(code)) return "errorGeneration"
  if (/length/.test(code)) return "errorLength"
  if (/diameter/.test(code)) return "errorDiameter"
  if (/angle/.test(code)) return "errorAngle"
  if (/axiom/.test(code)) return "errorAxiom"
  if (/color|colour|palette/.test(code)) return "errorColours"
  if (/bracket|branch|polygon|balance|stack/.test(code)) return "errorBrackets"
  if (/unsupported|command|parametric/.test(code)) return "errorUnsupported"
  if (/rule|duplicate|symbol/.test(code)) return "errorRules"
  return "invalidDefinition"
}

function Icon({
  name,
}: {
  name: "plus" | "minus" | "reset" | "next" | "close" | "download"
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "plus" && <path d="M4 10h12M10 4v12" />}
      {name === "minus" && <path d="M4 10h12" />}
      {name === "reset" && (
        <>
          <path d="M4 7a7 7 0 1 1-.3 5M4 3v4h4" />
          <circle cx="10" cy="10" r="1.5" />
        </>
      )}
      {name === "next" && (
        <>
          <path d="M3 5h2c4 0 6 10 10 10h2M14 12l3 3-3 3M3 15h2c1.5 0 2.5-1.5 3.5-3M11.5 8C12.5 6.5 13.5 5 15 5h2M14 2l3 3-3 3" />
        </>
      )}
      {name === "close" && <path d="m5 5 10 10M15 5 5 15" />}
      {name === "download" && <path d="M10 2v10m-4-4 4 4 4-4M3 13v4h14v-4" />}
    </svg>
  )
}

export function LSystem({
  initialPreset = "plant",
  initialDefinition,
  locale = "en",
  theme = "system",
  controls = "full",
  autoRotate = false,
  className,
  onError,
  onDefinitionChange,
}: LSystemProps) {
  const m = messages[locale]
  const id = useId()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<Scene | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const helpButtonRef = useRef<HTMLButtonElement>(null)
  const callbacksRef = useRef({ onError, onDefinitionChange })
  callbacksRef.current = { onError, onDefinitionChange }

  const [draft, setDraft] = useState<LSystemDefinition>(() =>
    copyDefinition(initialDefinition ?? getPreset(initialPreset)),
  )
  const [definition, setDefinition] = useState<LSystemDefinition>(() =>
    copyDefinition(initialDefinition ?? getPreset(initialPreset)),
  )
  const [preset, setPreset] = useState<PresetId>(initialPreset)
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    theme === "dark" ? "dark" : "light",
  )
  const [settings, setSettings] = useState<SceneSettings>({
    sky: false,
    ground: false,
    lighting: true,
    shadows: true,
    autoRotate,
    primitive: "rods",
  })
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(true)
  const [failure, setFailure] = useState<Failure | null>(null)
  const [retry, setRetry] = useState(0)
  const [helpOpen, setHelpOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<"obj" | "ply">("obj")
  const [exporting, setExporting] = useState(false)
  const requestRef = useRef(0)
  const lastRequestedRef = useRef<LSystemDefinition | null>(null)
  const definitionRef = useRef(definition)
  definitionRef.current = definition
  const optionsRef = useRef<SceneOptions>({ ...settings, theme: resolvedTheme })
  optionsRef.current = { ...settings, theme: resolvedTheme }
  const initialSource = JSON.stringify([
    initialPreset,
    initialDefinition ?? null,
  ])
  const initialSourceRef = useRef(initialSource)

  const report = useCallback(
    (error: unknown, kind: Failure["kind"], initial = false) => {
      const normalized = asError(error)
      setFailure({ error: normalized, kind, initial })
      callbacksRef.current.onError?.(normalized)
    },
    [],
  )

  const drawDefinition = useCallback(
    (next: LSystemDefinition) => {
      const scene = sceneRef.current
      if (!scene || lastRequestedRef.current === next) return
      lastRequestedRef.current = next
      const request = ++requestRef.current
      setBusy(true)
      setFailure(null)
      Promise.resolve()
        .then(() => scene.update(validateDefinition(copyDefinition(next))))
        .then(() => {
          if (sceneRef.current !== scene || requestRef.current !== request)
            return
          setBusy(false)
          callbacksRef.current.onDefinitionChange?.(copyDefinition(next))
        })
        .catch((error: unknown) => {
          if (sceneRef.current !== scene || requestRef.current !== request)
            return
          setBusy(false)
          report(error, "definition")
        })
    },
    [report],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let scene: Scene | null = null
    let active = true
    setReady(false)
    setFailure(null)
    setExporting(false)
    lastRequestedRef.current = null
    try {
      scene = createScene(canvas, {
        ...optionsRef.current,
        onError: (error: Error) => {
          if (!active) return
          setReady(false)
          setBusy(false)
          report(error, "scene")
        },
      })
      sceneRef.current = scene
      setReady(true)
      drawDefinition(definitionRef.current)
    } catch (error) {
      setBusy(false)
      report(error, "scene", true)
    }
    return () => {
      active = false
      ++requestRef.current
      scene?.dispose()
      if (sceneRef.current === scene) sceneRef.current = null
      lastRequestedRef.current = null
    }
  }, [drawDefinition, report, retry])

  useEffect(() => {
    drawDefinition(definition)
  }, [definition, drawDefinition])

  useEffect(() => {
    try {
      sceneRef.current?.setOptions({ ...settings, theme: resolvedTheme })
    } catch (error) {
      report(error, "scene")
    }
  }, [settings, resolvedTheme, report])

  useEffect(() => {
    if (theme !== "system") {
      setResolvedTheme(theme)
      return
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const sync = () => setResolvedTheme(media.matches ? "dark" : "light")
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [theme])

  useEffect(() => {
    setSettings((current) => ({ ...current, autoRotate }))
  }, [autoRotate])

  useEffect(() => {
    if (initialSourceRef.current === initialSource) return
    initialSourceRef.current = initialSource
    const next = copyDefinition(initialDefinition ?? getPreset(initialPreset))
    setDraft(next)
    setDefinition(copyDefinition(next))
    setPreset(initialPreset)
  }, [initialSource, initialPreset, initialDefinition])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (helpOpen && !dialog.open) dialog.showModal()
    if (!helpOpen && dialog.open) {
      dialog.close()
      helpButtonRef.current?.focus()
    }
  }, [helpOpen])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const next = validateDefinition(copyDefinition(draft))
      setDefinition(next)
    } catch (error) {
      report(error, "definition")
    }
  }

  function updateNumber(field: NumericField, value: number) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function changePreset(nextPreset: PresetId) {
    const next = getPreset(nextPreset)
    setPreset(nextPreset)
    setDraft(copyDefinition(next))
    setDefinition(copyDefinition(next))
  }

  function nextPreset() {
    const index = PRESETS.findIndex((item) => item.id === preset)
    changePreset(PRESETS[(index + 1) % PRESETS.length]!.id)
  }

  async function download() {
    const scene = sceneRef.current
    if (!scene) return
    setExporting(true)
    try {
      await scene.download(exportFormat)
    } catch (error) {
      if (sceneRef.current === scene) report(error, "export")
    } finally {
      if (sceneRef.current === scene) setExporting(false)
    }
  }

  const errorNotice = failure && (
    <div className="lsystem-error" role="alert">
      <p>{m[errorKey(failure)]}</p>
      {failure.kind === "scene" && (
        <button
          type="button"
          className="lsystem-button"
          onClick={() => setRetry((value) => value + 1)}
        >
          {m.retry}
        </button>
      )}
      <details className="lsystem-error-details">
        <summary>{m.errorDetails}</summary>
        <p>{failure.error.message}</p>
      </details>
    </div>
  )

  return (
    <div
      className={["lsystem", className].filter(Boolean).join(" ")}
      data-theme={resolvedTheme}
      data-controls={controls}
      lang={locale}
    >
      <div className="lsystem-layout">
        <div className="lsystem-viewport" aria-busy={busy}>
          <canvas
            ref={canvasRef}
            className="lsystem-canvas"
            aria-label={m.scene}
            aria-describedby={`${id}-instruction`}
            tabIndex={0}
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown + - Home"
          />
          {controls !== "none" && (
            <div className="lsystem-scene-label">
              <span>L-system</span>
              <span>
                {m.generations} {definition.generations}
              </span>
            </div>
          )}
          <span
            id={`${id}-instruction`}
            className={
              controls === "none" ? "lsystem-sr-only" : "lsystem-instruction"
            }
          >
            {m.instruction}
          </span>
          {busy && (
            <span className="lsystem-loading" aria-hidden="true">
              {m.drawing}
            </span>
          )}
          {(failure?.kind === "scene" || (failure && controls !== "full")) && (
            <div className="lsystem-scene-error">{errorNotice}</div>
          )}
          {controls !== "none" && (
            <div
              className="lsystem-camera-controls"
              role="group"
              aria-label={m.view}
            >
              {controls === "compact" && (
                <button
                  type="button"
                  className="lsystem-icon-button"
                  aria-label={m.nextPreset}
                  title={m.nextPreset}
                  disabled={!ready || busy}
                  onClick={nextPreset}
                >
                  <Icon name="next" />
                </button>
              )}
              <button
                type="button"
                className="lsystem-icon-button"
                aria-label={m.zoomOut}
                title={m.zoomOut}
                disabled={!ready}
                onClick={() => sceneRef.current?.zoom("out")}
              >
                <Icon name="minus" />
              </button>
              <button
                type="button"
                className="lsystem-icon-button"
                aria-label={m.zoomIn}
                title={m.zoomIn}
                disabled={!ready}
                onClick={() => sceneRef.current?.zoom("in")}
              >
                <Icon name="plus" />
              </button>
              <button
                type="button"
                className="lsystem-icon-button"
                aria-label={m.reset}
                title={m.reset}
                disabled={!ready}
                onClick={() => sceneRef.current?.resetCamera()}
              >
                <Icon name="reset" />
              </button>
            </div>
          )}
          <span className="lsystem-sr-only" role="status" aria-live="polite">
            {busy ? m.drawing : ready && !failure ? m.ready : ""}
          </span>
        </div>

        {controls === "full" && (
          <div
            className="lsystem-panel"
            role="region"
            aria-label={m.parameters}
            tabIndex={0}
          >
            <form className="lsystem-form" onSubmit={submit} noValidate>
              <div className="lsystem-panel-heading">
                <h2>{m.parameters}</h2>
                <div className="lsystem-help-trigger">
                  <button
                    ref={helpButtonRef}
                    type="button"
                    className="lsystem-icon-button lsystem-info-button"
                    aria-label={m.symbolsHelp}
                    aria-describedby={`${id}-tooltip`}
                    aria-haspopup="dialog"
                    aria-controls={`${id}-help`}
                    onClick={() => setHelpOpen(true)}
                  >
                    i
                  </button>
                  <span
                    id={`${id}-tooltip`}
                    role="tooltip"
                    className="lsystem-tooltip"
                  >
                    {m.symbolsHelp}
                  </span>
                </div>
              </div>
              <label className="lsystem-field" htmlFor={`${id}-preset`}>
                <span>{m.preset}</span>
                <select
                  id={`${id}-preset`}
                  value={preset}
                  onChange={(event) =>
                    changePreset(event.target.value as PresetId)
                  }
                >
                  {PRESETS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name[locale]}
                    </option>
                  ))}
                </select>
              </label>
              <div className="lsystem-number-grid">
                {(
                  [
                    ["generations", m.generations, 0, MAX_GENERATIONS, 1],
                    ["length", m.length, 0.01, 1000, "any"],
                    ["diameter", m.diameter, 0.01, 100, "any"],
                    ["angle", m.angle, -360, 360, "any"],
                  ] as const
                ).map(([field, label, min, max, step]) => (
                  <label
                    className="lsystem-field"
                    key={field}
                    htmlFor={`${id}-${field}`}
                  >
                    <span>{label}</span>
                    <input
                      id={`${id}-${field}`}
                      type="number"
                      min={min}
                      max={max}
                      step={step}
                      required
                      value={Number.isFinite(draft[field]) ? draft[field] : ""}
                      onChange={(event) =>
                        updateNumber(field, event.target.valueAsNumber)
                      }
                    />
                  </label>
                ))}
              </div>
              <details className="lsystem-details">
                <summary>{m.definition}</summary>
                <div className="lsystem-definition-fields">
                  <label className="lsystem-field" htmlFor={`${id}-axiom`}>
                    <span>{m.axiom}</span>
                    <input
                      id={`${id}-axiom`}
                      type="text"
                      maxLength={MAX_INPUT_LENGTH}
                      required
                      spellCheck={false}
                      value={draft.axiom}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          axiom: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <fieldset className="lsystem-rule-fields">
                    <legend>{m.rules}</legend>
                    {draft.rules.map((rule, index) => (
                      <div className="lsystem-rule" key={index}>
                        <input
                          type="text"
                          className="lsystem-rule-symbol"
                          maxLength={1}
                          required
                          spellCheck={false}
                          aria-label={`${m.rule} ${index + 1}: ${m.symbol}`}
                          value={rule.symbol}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              rules: current.rules.map((item, i) =>
                                i === index
                                  ? { ...item, symbol: event.target.value }
                                  : item,
                              ),
                            }))
                          }
                        />
                        <span className="lsystem-rule-arrow" aria-hidden="true">
                          →
                        </span>
                        <textarea
                          rows={2}
                          maxLength={MAX_INPUT_LENGTH}
                          spellCheck={false}
                          aria-label={`${m.rule} ${index + 1}: ${m.replacement}`}
                          value={rule.replacement}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              rules: current.rules.map((item, i) =>
                                i === index
                                  ? { ...item, replacement: event.target.value }
                                  : item,
                              ),
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="lsystem-icon-button"
                          aria-label={`${m.removeRule} ${index + 1}`}
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              rules: current.rules.filter(
                                (_, i) => i !== index,
                              ),
                            }))
                          }
                        >
                          <Icon name="close" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="lsystem-text-button"
                      disabled={draft.rules.length >= MAX_RULES}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          rules: [
                            ...current.rules,
                            { symbol: "", replacement: "" },
                          ],
                        }))
                      }
                    >
                      <Icon name="plus" />
                      {m.addRule}
                    </button>
                  </fieldset>
                  <fieldset className="lsystem-colour-fields">
                    <legend>{m.colours}</legend>
                    <div className="lsystem-colours">
                      {draft.colors.map((color, index) => (
                        <div className="lsystem-colour" key={index}>
                          <input
                            type="color"
                            aria-label={`${m.colour} ${index + 1}`}
                            value={color}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                colors: current.colors.map((item, i) =>
                                  i === index ? event.target.value : item,
                                ),
                              }))
                            }
                          />
                          <button
                            type="button"
                            className="lsystem-colour-remove"
                            aria-label={`${m.removeColour} ${index + 1}`}
                            disabled={draft.colors.length <= 1}
                            onClick={() =>
                              setDraft((current) => ({
                                ...current,
                                colors: current.colors.filter(
                                  (_, i) => i !== index,
                                ),
                              }))
                            }
                          >
                            <Icon name="close" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="lsystem-text-button"
                      disabled={draft.colors.length >= 16}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          colors: [...current.colors, "#e99245"],
                        }))
                      }
                    >
                      <Icon name="plus" />
                      {m.addColour}
                    </button>
                  </fieldset>
                </div>
              </details>
              {failure && failure.kind !== "scene" && errorNotice}
              <button
                type="submit"
                className="lsystem-button lsystem-draw"
                disabled={!ready || busy}
              >
                {busy ? m.drawing : m.draw}
                <span aria-hidden="true">↗</span>
              </button>
            </form>

            <details className="lsystem-details lsystem-options">
              <summary>{m.view}</summary>
              <div className="lsystem-options-fields">
                <label className="lsystem-field" htmlFor={`${id}-primitive`}>
                  <span>{m.primitive}</span>
                  <select
                    id={`${id}-primitive`}
                    value={settings.primitive}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        primitive: event.target
                          .value as SceneSettings["primitive"],
                      }))
                    }
                  >
                    <option value="rods">{m.rods}</option>
                    <option value="lines">{m.lines}</option>
                  </select>
                </label>
                <div className="lsystem-toggle-grid">
                  {(
                    [
                      "lighting",
                      "shadows",
                      "sky",
                      "ground",
                      "autoRotate",
                    ] as const
                  ).map((key) => (
                    <label className="lsystem-toggle" key={key}>
                      <input
                        type="checkbox"
                        checked={settings[key]}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            [key]: event.target.checked,
                          }))
                        }
                      />
                      <span>{m[key]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </details>
            <div className="lsystem-export">
              <select
                aria-label={m.exportFormat}
                value={exportFormat}
                onChange={(event) =>
                  setExportFormat(event.target.value as "obj" | "ply")
                }
              >
                <option value="obj">OBJ</option>
                <option value="ply">PLY</option>
              </select>
              <button
                type="button"
                className="lsystem-text-button"
                onClick={() => void download()}
                disabled={!ready || busy || exporting}
              >
                <Icon name="download" />
                {exporting ? m.exporting : m.export}
              </button>
            </div>
          </div>
        )}
      </div>

      <dialog
        ref={dialogRef}
        id={`${id}-help`}
        className="lsystem-dialog"
        aria-labelledby={`${id}-help-title`}
        aria-describedby={`${id}-help-intro`}
        onCancel={(event) => {
          event.preventDefault()
          setHelpOpen(false)
        }}
        onClose={() => {
          setHelpOpen(false)
          helpButtonRef.current?.focus()
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return
          const rect = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            setHelpOpen(false)
        }}
      >
        <div className="lsystem-dialog-heading">
          <h2 id={`${id}-help-title`}>{m.symbolsHelp}</h2>
          <button
            type="button"
            className="lsystem-icon-button"
            aria-label={m.close}
            onClick={() => setHelpOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <p id={`${id}-help-intro`}>{m.helpIntro}</p>
        <table className="lsystem-command-table">
          <thead>
            <tr>
              <th scope="col">{m.command}</th>
              <th scope="col">{m.action}</th>
            </tr>
          </thead>
          <tbody>
            {commandHelp.map((command) => (
              <tr key={command.message}>
                <th scope="row">
                  <code>{command.symbols}</code>
                </th>
                <td>{m[command.message]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>{m.helpVariables}</p>
        <p className="lsystem-help-note">{m.helpUnsupported}</p>
      </dialog>
    </div>
  )
}
