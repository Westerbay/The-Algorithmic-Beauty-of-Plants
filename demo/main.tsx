import { StrictMode, useState } from "react"
import { createRoot } from "react-dom/client"
import { LSystem } from "../src/index"
import "./style.css"
function App() {
  const [locale, setLocale] = useState<"en" | "fr">("en")
  return (
    <main className="demo-shell">
      <div className="demo-topline">
        <h1>L-system explorer</h1>
        <button
          type="button"
          onClick={() => {
            const next = locale === "en" ? "fr" : "en"
            setLocale(next)
            document.documentElement.lang = next
          }}
        >
          {locale === "en" ? "FR" : "EN"}
        </button>
      </div>
      <LSystem initialPreset="tree" locale={locale} controls="full" />
    </main>
  )
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
