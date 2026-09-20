import test from "node:test"
import assert from "node:assert/strict"
import {
  DefinitionError,
  expandDefinition,
  generateGeometry,
  getPreset,
  PRESETS,
  validateDefinition,
} from "../src/core/index.ts"

import type { Definition } from "../src/types.ts"
import type { DefinitionErrorCode } from "../src/core/index.ts"

const definition = (changes: Partial<Definition> = {}): Definition => ({
  axiom: "F",
  rules: [],
  generations: 0,
  length: 100,
  diameter: 20,
  angle: 90,
  colors: ["#123456", "#abcdef"],
  ...changes,
})
const hasCode = (code: DefinitionErrorCode) => (error: unknown) =>
  error instanceof DefinitionError && error.code === code
const close = (actual: number[], expected: number[]) => {
  assert.equal(actual.length, expected.length)
  actual.forEach((value, index) =>
    assert.ok(
      Math.abs(value - expected[index]) < 1e-9,
      `${value} differs from ${expected[index]}`,
    ),
  )
}

test("rewriting is simultaneous, stable across calls, and preserves unknown symbols", () => {
  const input = definition({
    axiom: "A?",
    generations: 3,
    rules: [
      { symbol: "A", replacement: "AB" },
      { symbol: "B", replacement: "A" },
    ],
  })
  assert.equal(expandDefinition(input), "ABAAB?")
  assert.equal(expandDefinition(input), "ABAAB?")
  assert.equal(expandDefinition({ ...input, generations: 0 }), "A?")
})

test("empty productions erase symbols and duplicate rules are rejected", () => {
  assert.equal(
    expandDefinition(
      definition({ generations: 1, rules: [{ symbol: "F", replacement: "" }] }),
    ),
    "",
  )
  assert.throws(
    () =>
      validateDefinition(
        definition({
          rules: [
            { symbol: "F", replacement: "FF" },
            { symbol: "F", replacement: "F" },
          ],
        }),
      ),
    hasCode("invalid_rule"),
  )
})

test("presets and validated definitions are independent editable copies", () => {
  const first = getPreset("plant")
  const copied = validateDefinition(first)
  copied.rules[0].replacement = "changed"
  copied.colors[0] = "#ffffff"
  first.rules[0].replacement = "changed again"
  assert.equal(getPreset("plant").rules[0].replacement, "FF-[-F+F+F]+[+F-F-F]")
  assert.equal(getPreset("plant").colors[0], "#12BC86")
})

for (const [index, preset] of PRESETS.entries()) {
  test(`original ${preset.id} preset produces finite, indexed geometry`, () => {
    const input = getPreset(preset.id)
    const word = expandDefinition(input)
    assert.equal(word.length, [11116, 17331, 15325, 72645][index])
    const mesh = generateGeometry(input)
    assert.equal(mesh.elementsLine.length / 2, [4096, 4095, 533, 3891][index])
    for (const kind of ["Line", "Rod", "Leaf"] as const) {
      const vertices = mesh[`vertices${kind}`]
      const indices = mesh[`elements${kind}`]
      assert.ok(vertices.every(Number.isFinite))
      assert.ok(mesh[`normals${kind}`].every(Number.isFinite))
      assert.ok(mesh[`tangents${kind}`].every(Number.isFinite))
      assert.ok(
        indices.every(
          (value) =>
            Number.isInteger(value) &&
            value >= 0 &&
            value < vertices.length / 3,
        ),
      )
      assert.ok(
        mesh[`colorIndices${kind}`].every(
          (value) => value >= 0 && value < input.colors.length,
        ),
      )
    }
    assert.ok(
      [mesh.centerX(), mesh.centerY(), mesh.centerZ(), mesh.maxDepth()].every(
        Number.isFinite,
      ),
    )
  })
}

test("branch restoration connects the trunk instead of the branch endpoint", () => {
  const mesh = generateGeometry(definition({ axiom: "F[+F]F" }))
  close(mesh.verticesLine, [0, 0, 0, 0, 1, 0, -1, 1, 0, 0, 2, 0])
  assert.deepEqual(mesh.elementsLine, [0, 1, 1, 2, 1, 3])
})

test("pen-up fF draws only the final step", () => {
  const mesh = generateGeometry(definition({ axiom: "fF" }))
  close(mesh.verticesLine, [0, 0, 0, 0, 1, 0, 0, 2, 0])
  assert.deepEqual(mesh.elementsLine, [1, 2])
})

test("diameter reduction and colors are scoped to branches; colors wrap", () => {
  const mesh = generateGeometry(definition({ axiom: "F[!'F]F''F" }))
  assert.deepEqual(
    mesh.colorIndicesRod.filter((_, index) => index % 8 === 0),
    [0, 1, 0, 0],
  )
  const radius = (segment: number) =>
    Math.hypot(
      mesh.verticesRod[segment * 24],
      mesh.verticesRod[segment * 24 + 2],
    )
  assert.ok(Math.abs(radius(1) / radius(0) - 0.6) < 1e-9)
  assert.ok(Math.abs(radius(2) / radius(0) - 1) < 1e-9)
})

test("polygon completion leaves the next segment at the current position", () => {
  const mesh = generateGeometry(definition({ axiom: "{f+f+f}F" }))
  assert.equal(mesh.verticesLeaf.length / 3, 6)
  assert.equal(mesh.elementsLeaf.length, 24)
  const [start, end] = mesh.elementsLine
  const distance = Math.hypot(
    ...[0, 1, 2].map(
      (axis) =>
        mesh.verticesLine[end * 3 + axis] - mesh.verticesLine[start * 3 + axis],
    ),
  )
  assert.ok(Math.abs(distance - 1) < 1e-9)
})

test("malformed branches and unsupported polygon structures are rejected", () => {
  for (const axiom of ["]F", "[F", "F][F"])
    assert.throws(
      () => generateGeometry(definition({ axiom })),
      hasCode("unbalanced_branch"),
    )
  for (const axiom of ["{ff}", "{{fff}}", "{Fff}", "{f[ff]}", "{fff", "}"])
    assert.throws(
      () => generateGeometry(definition({ axiom })),
      hasCode("invalid_polygon"),
    )
})

test("unimplemented commands are reported rather than silently advertised", () => {
  for (const symbol of ["$", "G", ".", "~", "∼", "%"])
    assert.throws(
      () => generateGeometry(definition({ axiom: symbol })),
      hasCode("unsupported_symbol"),
    )
})

test("invalid numeric parameters and palettes fail before generation", () => {
  for (const changes of [
    { generations: NaN },
    { generations: Infinity },
    { generations: -1 },
    { generations: 1.5 },
    { generations: 17 },
    { length: 0 },
    { length: -1 },
    { diameter: 0 },
    { angle: Infinity },
  ]) {
    assert.throws(
      () => generateGeometry(definition(changes)),
      hasCode("invalid_number"),
    )
  }
  for (const colors of [[], Array(17).fill("#000000"), ["red"], ["#gg0000"]])
    assert.throws(
      () => generateGeometry(definition({ colors })),
      hasCode("invalid_palette"),
    )
})

test("word and geometry limits stop growth before mesh allocation", () => {
  assert.throws(
    () =>
      generateGeometry(
        definition({
          generations: 3,
          rules: [{ symbol: "F", replacement: "F".repeat(100) }],
        }),
      ),
    hasCode("symbol_budget"),
  )
  assert.throws(
    () =>
      generateGeometry(
        definition({
          generations: 4,
          rules: [{ symbol: "F", replacement: "F".repeat(20) }],
        }),
      ),
    hasCode("geometry_budget"),
  )
  assert.throws(
    () =>
      generateGeometry(
        definition({
          axiom: "{fff}",
          generations: 3,
          rules: [{ symbol: "f", replacement: "f".repeat(32) }],
        }),
      ),
    hasCode("geometry_budget"),
  )
})

test("branch depth is bounded before state copies are allocated", () => {
  assert.throws(
    () =>
      generateGeometry(
        definition({ axiom: "[".repeat(257) + "F" + "]".repeat(257) }),
      ),
    hasCode("geometry_budget"),
  )
})

test("3D rotations retain the original local axes and pitch aliases", () => {
  for (const [axiom, endpoint] of [
    ["^F", [0, 0, 1]],
    ["∧F", [0, 0, 1]],
    ["&F", [0, 0, -1]],
    ["\\+F", [0, 0, 1]],
    ["/+F", [0, 0, -1]],
    ["|F", [0, -1, 0]],
  ] as [string, number[]][]) {
    close(
      generateGeometry(definition({ axiom })).verticesLine.slice(-3),
      endpoint,
    )
  }
})

test("sparse external input is rejected and repeated diameter reductions remain finite", () => {
  assert.throws(
    () => validateDefinition(definition({ colors: Array(1) })),
    hasCode("invalid_palette"),
  )
  assert.throws(
    () => validateDefinition(definition({ rules: Array(1) })),
    hasCode("invalid_rule"),
  )
  const mesh = generateGeometry(definition({ axiom: "!".repeat(1000) + "F" }))
  assert.ok(mesh.verticesRod.every(Number.isFinite))
  assert.ok(mesh.normalsRod.every(Number.isFinite))
})
