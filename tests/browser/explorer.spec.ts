import { test, expect } from "@playwright/test"

const ready = async (page: import("@playwright/test").Page) => {
  await expect(page.locator(".lsystem-viewport")).toHaveAttribute(
    "aria-busy",
    "false",
  )
  await expect(page.getByRole("status")).toHaveText("Drawing updated")
  await expect(page.getByRole("alert")).toHaveCount(0)
}

test("the WebGL editor renders, changes presets and exports meshes", async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("./")
  await ready(page)
  await expect(page.locator("canvas")).toBeVisible()
  await expect(
    page.locator("header, footer, a[href*='Home-Page']"),
  ).toHaveCount(0)
  await page.screenshot({
    path: info.outputPath("explorer.png"),
    fullPage: true,
  })
  for (const preset of ["plant", "hilbert", "flower", "tree"]) {
    await page
      .getByRole("combobox", { name: "Preset", exact: true })
      .selectOption(preset)
    await page.getByRole("button", { name: "Draw", exact: true }).click()
    await ready(page)
  }
  await page.getByLabel("Generations", { exact: true }).fill("3")
  await page.getByRole("button", { name: "Draw", exact: true }).click()
  await ready(page)
  await expect(page.locator(".lsystem-scene-label")).toContainText(
    "Generations 3",
  )
  await page.locator(".lsystem-options summary").click()
  await page.getByLabel("Ground", { exact: true }).check()
  await page.getByLabel("Sky", { exact: true }).check()
  await page
    .getByRole("combobox", { name: "Geometry", exact: true })
    .selectOption("lines")
  await page.getByRole("button", { name: "Zoom in", exact: true }).click()
  await page.getByRole("button", { name: "Reset camera", exact: true }).click()
  for (const [format, extension] of [
    ["ply", ".ply"],
    ["obj", ".zip"],
  ]) {
    await page.getByLabel("Export format").selectOption(format)
    const downloadPromise = page.waitForEvent("download")
    await page.getByRole("button", { name: "Export", exact: true }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(
      new RegExp(extension.replace(".", "\\.") + "$"),
    )
    expect(await download.failure()).toBeNull()
    await download.saveAs(info.outputPath(download.suggestedFilename()))
  }
  expect(errors).toEqual([])
})

test("the symbol guide is a localized keyboard-accessible modal", async ({
  page,
}) => {
  await page.goto("./")
  await ready(page)
  const help = page.getByRole("button", { name: "Symbol guide", exact: true })
  await help.focus()
  await expect(page.getByRole("tooltip")).toBeVisible()
  await page.keyboard.press("Enter")
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole("table")).toBeVisible()
  await expect(dialog.getByText("F(10)", { exact: false })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(dialog).not.toBeVisible()
  await expect(help).toBeFocused()
  await page.getByRole("button", { name: "FR" }).click()
  await page
    .getByRole("button", { name: "Guide des symboles", exact: true })
    .click()
  await expect(dialog.getByRole("heading")).toHaveText("Guide des symboles")
  await page
    .getByRole("button", { name: "Fermer le guide des symboles" })
    .click()
  await expect(dialog).not.toBeVisible()
})

test("invalid and excessive definitions preserve the scene and allow recovery", async ({
  page,
}) => {
  await page.goto("./")
  await ready(page)
  await page.getByLabel("Generations", { exact: true }).fill("16")
  await page.getByRole("button", { name: "Draw", exact: true }).click()
  await expect(page.getByRole("alert")).toBeVisible()
  await page.getByLabel("Generations", { exact: true }).fill("3")
  await page.getByRole("button", { name: "Draw", exact: true }).click()
  await ready(page)
  await page.getByText("Axiom, rules and colours", { exact: true }).click()
  await page.getByLabel("Axiom", { exact: true }).fill("F]")
  await page.getByRole("button", { name: "Draw", exact: true }).click()
  await expect(page.getByRole("alert")).toBeVisible()
  await page.getByLabel("Axiom", { exact: true }).fill("F")
  await page.getByRole("button", { name: "Draw", exact: true }).click()
  await ready(page)
})

test("WebGL unavailability is explained without crashing the page", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith("webgl") || type === "experimental-webgl") return null
      return original.apply(this, [type, ...args] as never)
    } as typeof original
  })
  await page.goto("./")
  await expect(page.getByRole("alert")).toContainText("WebGL")
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible()
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
})

for (const width of [320, 768, 1440, 2560]) {
  test("responsive editor at " + width, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto("./")
    await ready(page)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await page
      .getByRole("button", { name: "Symbol guide", exact: true })
      .click()
    await expect(page.getByRole("dialog")).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await page.screenshot({ path: info.outputPath("help.png"), fullPage: true })
  })
}

for (const width of [390, 1440]) {
  test(
    "parameter sections scroll without resizing the scene at " + width,
    async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto("./")
      await ready(page)
      const size = () =>
        page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => ({
          width: canvas.clientWidth,
          height: canvas.clientHeight,
          pixelsWide: canvas.width,
          pixelsHigh: canvas.height,
          editorHeight: canvas.closest(".lsystem-layout")!.clientHeight,
        }))
      const before = await size()
      const panel = page.getByRole("region", {
        name: "Parameters",
        exact: true,
      })
      await panel.getByText("Axiom, rules and colours", { exact: true }).click()
      await panel.locator(".lsystem-options summary").click()
      await panel
        .getByRole("button", { name: "Add a rule", exact: true })
        .click()
      await expect.poll(size).toEqual(before)
      expect(
        await panel.evaluate(
          (element) => element.scrollHeight > element.clientHeight,
        ),
      ).toBe(true)
      await panel.evaluate((element) => {
        element.scrollTop = 0
      })
      await panel.hover()
      const documentScroll = await page.evaluate(() => window.scrollY)
      await page.mouse.wheel(0, 500)
      await expect
        .poll(() => panel.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0)
      expect(await page.evaluate(() => window.scrollY)).toBe(documentScroll)
      expect(await size()).toEqual(before)
      await panel
        .getByRole("button", { name: "Symbol guide", exact: true })
        .click()
      await expect(page.getByRole("dialog")).toBeVisible()
      await page.keyboard.press("Escape")
      await expect(
        page.getByRole("button", { name: "Symbol guide", exact: true }),
      ).toBeFocused()
    },
  )
}

test("generation count stays legible over the scene in both themes", async ({
  page,
}) => {
  await page.goto("./")
  await ready(page)
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme })
    await expect(page.locator(".lsystem")).toHaveAttribute("data-theme", theme)
    const appearance = await page
      .locator(".lsystem-scene-label > :last-child")
      .evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          color: style.color,
          background: style.backgroundColor,
          size: Number.parseFloat(style.fontSize),
        }
      })
    const luminance = (css: string) => {
      const channels = css
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number)
        .map((value) => value / 255)
        .map((value) =>
          value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
        )
      return (
        channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
      )
    }
    const foreground = luminance(appearance.color),
      background = luminance(appearance.background)
    expect(
      (Math.max(foreground, background) + 0.05) /
        (Math.min(foreground, background) + 0.05),
    ).toBeGreaterThanOrEqual(4.5)
    expect(appearance.background).not.toContain("rgba")
    expect(appearance.size).toBeGreaterThanOrEqual(13)
  }
})
