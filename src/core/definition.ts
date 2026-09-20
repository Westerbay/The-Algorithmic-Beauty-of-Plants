import type { Definition } from "../types.ts"
import { MAX_GENERATIONS, MAX_INPUT_LENGTH, MAX_RULES } from "./limits.ts"

export type DefinitionErrorCode =
  | "invalid_definition"
  | "invalid_number"
  | "invalid_rule"
  | "invalid_palette"
  | "unsupported_symbol"
  | "symbol_budget"
  | "geometry_budget"
  | "unbalanced_branch"
  | "invalid_polygon"

export class DefinitionError extends Error {
  readonly code: DefinitionErrorCode
  constructor(code: DefinitionErrorCode, message: string) {
    super(message)
    this.name = "DefinitionError"
    this.code = code
  }
}

function numberInRange(
  value: unknown,
  min: number,
  max: number,
  name: string,
  integer = false,
): asserts value is number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  ) {
    throw new DefinitionError(
      "invalid_number",
      `${name} must be ${integer ? "an integer" : "a number"} between ${min} and ${max}.`,
    )
  }
}

const unsupportedSymbols = new Set(["$", "G", ".", "~", "∼", "%"])
export function checkSupportedSymbols(word: string): void {
  for (const symbol of word) {
    if (unsupportedSymbols.has(symbol)) {
      throw new DefinitionError(
        "unsupported_symbol",
        `The command ${symbol} is not implemented.`,
      )
    }
  }
}

/** Validates input fields and returns an independent copy. Final-word structure is checked by expandDefinition. */
export function validateDefinition(input: Definition): Definition {
  if (!input || typeof input !== "object")
    throw new DefinitionError("invalid_definition", "A definition is required.")
  numberInRange(input.generations, 0, MAX_GENERATIONS, "Generations", true)
  numberInRange(input.length, 0.01, 1_000, "Length")
  numberInRange(input.diameter, 0.01, 100, "Diameter")
  numberInRange(input.angle, -360, 360, "Angle")
  if (
    typeof input.axiom !== "string" ||
    input.axiom.length === 0 ||
    input.axiom.length > MAX_INPUT_LENGTH
  ) {
    throw new DefinitionError(
      "invalid_definition",
      `The axiom must contain 1 to ${MAX_INPUT_LENGTH} characters.`,
    )
  }
  checkSupportedSymbols(input.axiom)
  if (!Array.isArray(input.rules) || input.rules.length > MAX_RULES) {
    throw new DefinitionError(
      "invalid_rule",
      `At most ${MAX_RULES} rules are supported.`,
    )
  }
  const symbols = new Set<string>()
  const rules = Array.from(input.rules).map((rule) => {
    if (
      !rule ||
      typeof rule.symbol !== "string" ||
      [...rule.symbol].length !== 1 ||
      !rule.symbol.trim() ||
      typeof rule.replacement !== "string" ||
      rule.replacement.length > MAX_INPUT_LENGTH
    ) {
      throw new DefinitionError(
        "invalid_rule",
        "Each rule needs one symbol and a replacement of at most 4096 characters.",
      )
    }
    if (symbols.has(rule.symbol))
      throw new DefinitionError(
        "invalid_rule",
        `Duplicate rule for ${rule.symbol}.`,
      )
    symbols.add(rule.symbol)
    checkSupportedSymbols(rule.symbol)
    checkSupportedSymbols(rule.replacement)
    return { symbol: rule.symbol, replacement: rule.replacement }
  })
  if (
    !Array.isArray(input.colors) ||
    input.colors.length < 1 ||
    input.colors.length > 16 ||
    Array.from(input.colors).some(
      (color) => typeof color !== "string" || !/^#[0-9a-f]{6}$/i.test(color),
    )
  ) {
    throw new DefinitionError(
      "invalid_palette",
      "The palette must contain 1 to 16 hexadecimal colors.",
    )
  }
  return {
    axiom: input.axiom,
    rules,
    generations: input.generations,
    length: input.length,
    diameter: input.diameter,
    angle: input.angle,
    colors: [...input.colors],
  }
}
