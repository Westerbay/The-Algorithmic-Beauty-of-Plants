import type { Definition } from "../types.ts"
import { DefinitionError, validateDefinition } from "./definition.ts"
import {
  MAX_SYMBOLS,
  MAX_SEGMENTS,
  MAX_POLYGON_VERTICES,
  MAX_BRANCH_DEPTH,
} from "./limits.ts"

/** Bounded iterative rewriting; no recursive cache and no randomness. */
export function expandValidatedDefinition(definition: Definition): string {
  const rules = new Map(
    definition.rules.map(({ symbol, replacement }) => [symbol, replacement]),
  )
  let word = definition.axiom
  for (let generation = 0; generation < definition.generations; generation++) {
    const parts: string[] = []
    let length = 0
    for (const symbol of word) {
      const replacement = rules.get(symbol) ?? symbol
      length += replacement.length
      if (length > MAX_SYMBOLS)
        throw new DefinitionError(
          "symbol_budget",
          `The word exceeds ${MAX_SYMBOLS} characters.`,
        )
      parts.push(replacement)
    }
    word = parts.join("")
  }
  validateExpandedWord(word)
  return word
}

/** Checks structure and geometry budgets before any mesh allocation. */
export function validateExpandedWord(word: string): void {
  if (word.length > MAX_SYMBOLS)
    throw new DefinitionError(
      "symbol_budget",
      `The word exceeds ${MAX_SYMBOLS} characters.`,
    )
  let branches = 0
  let inPolygon = false
  let polygonSize = 0
  let totalPolygonVertices = 0
  let segments = 0
  for (const symbol of word) {
    if (symbol === "[" || symbol === "]") {
      if (inPolygon)
        throw new DefinitionError(
          "invalid_polygon",
          "Branches cannot begin or end inside a polygon.",
        )
      branches += symbol === "[" ? 1 : -1
      if (branches > MAX_BRANCH_DEPTH)
        throw new DefinitionError(
          "geometry_budget",
          "The branch stack exceeds its depth limit.",
        )
      if (branches < 0)
        throw new DefinitionError(
          "unbalanced_branch",
          "A branch closes without an opening bracket.",
        )
    } else if (symbol === "{") {
      if (inPolygon)
        throw new DefinitionError(
          "invalid_polygon",
          "Nested polygons are not supported.",
        )
      inPolygon = true
      polygonSize = 0
    } else if (symbol === "}") {
      if (!inPolygon || polygonSize < 3)
        throw new DefinitionError(
          "invalid_polygon",
          "A polygon needs an opening brace and at least three forward moves.",
        )
      inPolygon = false
    } else if (symbol === "F") {
      if (inPolygon)
        throw new DefinitionError(
          "invalid_polygon",
          "Use f to record polygon vertices, not F.",
        )
      segments++
    } else if (symbol === "f" && inPolygon) {
      polygonSize++
      totalPolygonVertices++
    }
    if (
      segments > MAX_SEGMENTS ||
      totalPolygonVertices > MAX_POLYGON_VERTICES
    ) {
      throw new DefinitionError(
        "geometry_budget",
        "The generated geometry exceeds its segment or polygon budget.",
      )
    }
  }
  if (branches !== 0)
    throw new DefinitionError(
      "unbalanced_branch",
      "Every branch must have a closing bracket.",
    )
  if (inPolygon)
    throw new DefinitionError(
      "invalid_polygon",
      "Every polygon must have a closing brace.",
    )
}

export function expandDefinition(definition: Definition): string {
  return expandValidatedDefinition(validateDefinition(definition))
}
