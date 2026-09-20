import { createRoot, type Root } from "react-dom/client"
import { LSystem, type LSystemProps } from "./react/LSystem"
import css from "./styles.css?inline"
import type { PresetId } from "./types"

export function defineLSystemElement(tagName = "lsystem-viewer") {
  if (typeof window === "undefined" || customElements.get(tagName)) return
  class LSystemElement extends HTMLElement {
    static observedAttributes = [
      "preset",
      "locale",
      "theme",
      "controls",
      "auto-rotate",
    ]
    private root?: Root
    private container?: HTMLDivElement
    private initialDefinition?: LSystemProps["initialDefinition"]
    private revision = 0
    get definition() {
      return this.initialDefinition
    }
    set definition(value: LSystemProps["initialDefinition"]) {
      this.initialDefinition = value
      this.revision++
      this.render()
    }
    connectedCallback() {
      if (!this.shadowRoot) {
        const shadow = this.attachShadow({ mode: "open" })
        const style = document.createElement("style")
        style.textContent = ":host{display:block;min-width:0}" + css
        this.container = document.createElement("div")
        shadow.append(style, this.container)
      }
      this.root = createRoot(this.container!)
      this.render()
    }
    disconnectedCallback() {
      this.root?.unmount()
      this.root = undefined
    }
    attributeChangedCallback(
      name: string,
      previous: string | null,
      next: string | null,
    ) {
      if (name === "preset" && previous !== next) this.revision++
      this.render()
    }
    private render() {
      if (!this.root) return
      const preset = this.getAttribute("preset")
      const theme = this.getAttribute("theme")
      const controls = this.getAttribute("controls")
      this.root.render(
        <LSystem
          key={this.revision}
          initialPreset={
            (["plant", "hilbert", "flower", "tree"].includes(preset ?? "")
              ? preset
              : "tree") as PresetId
          }
          initialDefinition={this.initialDefinition}
          locale={this.getAttribute("locale") === "fr" ? "fr" : "en"}
          theme={theme === "dark" || theme === "light" ? theme : "system"}
          controls={
            controls === "none" || controls === "compact" ? controls : "full"
          }
          autoRotate={this.getAttribute("auto-rotate") === "true"}
          onDefinitionChange={(definition) =>
            this.dispatchEvent(
              new CustomEvent("definitionchange", {
                detail: definition,
                bubbles: true,
                composed: true,
              }),
            )
          }
          onError={(error) =>
            this.dispatchEvent(
              new CustomEvent("sceneerror", {
                detail: { message: error.message },
                bubbles: true,
                composed: true,
              }),
            )
          }
        />,
      )
    }
  }
  customElements.define(tagName, LSystemElement)
}
