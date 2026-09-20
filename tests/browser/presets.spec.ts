import { test, expect } from "@playwright/test"
import type { Page } from "@playwright/test"
import { build } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "node:path"
import { getPreset } from "../../src/core/presets"
import type { LSystemDefinition, PresetId } from "../../src/types"

interface FixtureEvents {
  success: LSystemDefinition[]
  errors: string[]
}

const fixturePath = "/__preset-test/"
const assets = new Map<
  string,
  { body: string | Uint8Array; contentType: string }
>()

// Bundle a small consumer in memory so these checks exercise the public React
// callbacks and both control modes without adding test controls to the demo.
test.beforeAll(async () => {
  const entry = resolve("tests/browser/__preset_fixture__.tsx").replaceAll(
    "\\",
    "/",
  )
  const component = resolve("src/react/LSystem.tsx").replaceAll("\\", "/")
  const result = await build({
    configFile: false,
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    logLevel: "error",
    base: fixturePath,
    plugins: [
      react(),
      {
        name: "lsystem-preset-test",
        resolveId: (id) => (id === entry ? "\0" + entry : undefined),
        load: (id) =>
          id === "\0" + entry
            ? `
          import { createElement } from 'react';
          import { createRoot } from 'react-dom/client';
          import { LSystem } from ${JSON.stringify(component)};
          const events = { success: [], errors: [] };
          window.__lsystemPresetEvents = events;
          const controls = new URLSearchParams(location.search).get('controls') || 'full';
          createRoot(document.getElementById('fixture')).render(createElement(LSystem, {
            initialPreset: 'tree', controls, theme: 'light', locale: 'en',
            onDefinitionChange(definition) { events.success.push(structuredClone(definition)); },
            onError(error) { events.errors.push(error.message); }
          }));
        `
            : undefined,
      },
    ],
    build: {
      write: false,
      emptyOutDir: false,
      target: "es2022",
      minify: false,
      lib: { entry, formats: ["es"], fileName: () => "fixture.js" },
    },
  })
  const bundles = Array.isArray(result) ? result : [result]
  for (const bundle of bundles) {
    if (!("output" in bundle)) throw new Error("Expected an in-memory build")
    for (const output of bundle.output) {
      assets.set(output.fileName, {
        body: output.type === "chunk" ? output.code : output.source,
        contentType: output.fileName.endsWith(".css")
          ? "text/css"
          : "text/javascript",
      })
    }
  }
})

async function openFixture(page: Page, controls: "full" | "compact") {
  await page.route("**/__preset-test/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname
    const name = pathname.slice(fixturePath.length)
    if (!name) {
      const styles = [...assets.keys()]
        .filter((file) => file.endsWith(".css"))
        .map((file) => `<link rel="stylesheet" href="${fixturePath + file}">`)
        .join("")
      await route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><html lang="en"><head><meta charset="utf-8">${styles}<style>body{margin:20px;font:14px Arial,sans-serif}#fixture{max-width:1100px;${controls === "compact" ? "height:460px" : ""}}</style></head><body><div id="fixture"></div><script type="module" src="${fixturePath}fixture.js"></script></body></html>`,
      })
      return
    }
    const asset = assets.get(name)
    if (!asset) throw new Error(`Missing fixture asset: ${name}`)
    await route.fulfill({
      ...asset,
      body:
        typeof asset.body === "string" ? asset.body : Buffer.from(asset.body),
    })
  })
  await page.goto(`${fixturePath}?controls=${controls}`)
  await expect
    .poll(async () => (await events(page))?.success.length ?? 0)
    .toBe(1)
  await drawingReady(page)
}

function events(page: Page): Promise<FixtureEvents> {
  return page.evaluate(
    () =>
      (window as typeof window & { __lsystemPresetEvents: FixtureEvents })
        .__lsystemPresetEvents,
  )
}

async function drawingReady(page: Page) {
  await expect(page.locator(".lsystem-viewport")).toHaveAttribute(
    "aria-busy",
    "false",
  )
  await expect(page.getByRole("status")).toHaveText("Drawing updated")
  await expect(page.getByRole("alert")).toHaveCount(0)
}

test("selecting any full-mode preset immediately draws it and fills its parameters", async ({
  page,
}) => {
  const crashes: string[] = []
  page.on("pageerror", (error) => crashes.push(error.message))
  await openFixture(page, "full")
  let completed = 1
  for (const preset of ["plant", "hilbert", "flower", "tree"] as PresetId[]) {
    await page
      .getByRole("combobox", { name: "Preset", exact: true })
      .selectOption(preset)
    await expect
      .poll(async () => (await events(page)).success.length)
      .toBe(++completed)
    await drawingReady(page)
    const expected = getPreset(preset)
    expect((await events(page)).success.at(-1)).toEqual(expected)
    for (const [label, value] of [
      ["Generations", expected.generations],
      ["Length (cm)", expected.length],
      ["Diameter (% of length)", expected.diameter],
      ["Angle (°)", expected.angle],
    ] as const) {
      await expect(page.getByLabel(label, { exact: true })).toHaveValue(
        String(value),
      )
    }
    await expect(page.getByLabel("Axiom", { exact: true })).toHaveValue(
      expected.axiom,
    )
  }
  expect((await events(page)).errors).toEqual([])
  expect(crashes).toEqual([])
})

test("manual edits still require Draw and choosing a preset recovers from an error", async ({
  page,
}) => {
  await openFixture(page, "full")
  await page.getByLabel("Angle (°)", { exact: true }).fill("30")
  await page.evaluate(
    () =>
      new Promise<void>((resolveFrame) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolveFrame()),
        ),
      ),
  )
  expect((await events(page)).success).toHaveLength(1)
  expect((await events(page)).success[0]!.angle).toBe(22.5)

  await page.getByRole("button", { name: "Draw", exact: true }).click()
  await expect.poll(async () => (await events(page)).success.length).toBe(2)
  expect((await events(page)).success.at(-1)!.angle).toBe(30)

  await page.getByLabel("Angle (°)", { exact: true }).fill("999")
  await page.getByRole("button", { name: "Draw", exact: true }).click()
  await expect(page.getByRole("alert")).toBeVisible()
  expect((await events(page)).errors).toHaveLength(1)
  expect((await events(page)).success).toHaveLength(2)

  await page
    .getByRole("combobox", { name: "Preset", exact: true })
    .selectOption("hilbert")
  await expect.poll(async () => (await events(page)).success.length).toBe(3)
  await drawingReady(page)
  expect((await events(page)).success.at(-1)).toEqual(getPreset("hilbert"))
  expect((await events(page)).errors).toHaveLength(1)
})

test("the compact next-preset control keeps cycling and drawing immediately", async ({
  page,
}) => {
  await openFixture(page, "compact")
  await expect(page.locator(".lsystem-panel")).toHaveCount(0)
  let completed = 1
  for (const preset of ["plant", "hilbert", "flower", "tree"] as PresetId[]) {
    await page
      .getByRole("button", { name: "Try another preset", exact: true })
      .click()
    await expect
      .poll(async () => (await events(page)).success.length)
      .toBe(++completed)
    await drawingReady(page)
    expect((await events(page)).success.at(-1)).toEqual(getPreset(preset))
  }
  expect((await events(page)).errors).toEqual([])
})
