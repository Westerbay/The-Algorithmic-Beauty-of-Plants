import type { Definition, PresetId } from "../types.ts"

export interface Preset {
  id: PresetId
  name: { en: string; fr: string }
  definition: Definition
}
const rules = (entries: Record<string, string>): Definition["rules"] =>
  Object.entries(entries).map(([symbol, replacement]) => ({
    symbol,
    replacement,
  }))

/** Original four deterministic presets, with their original scales and palettes. */
export const PRESETS: Preset[] = [
  {
    id: "plant",
    name: { en: "Branching plant", fr: "Plante ramifiée" },
    definition: {
      generations: 4,
      length: 6,
      diameter: 20,
      angle: 22.5,
      axiom: "F",
      colors: ["#12BC86"],
      rules: rules({ F: "FF-[-F+F+F]+[+F-F-F]" }),
    },
  },
  {
    id: "hilbert",
    name: { en: "3D Hilbert curve", fr: "Courbe de Hilbert 3D" },
    definition: {
      generations: 4,
      length: 10,
      diameter: 20,
      angle: 90,
      axiom: "A",
      colors: ["#BB2233"],
      rules: rules({
        A: "B-F+CFC+F-D&F^D-F+&&CFC+F+B//",
        B: "A&F^CFB^F^D^^-F-D^|F^B|FC^F^A//",
        C: "|D^|F^B-F+C^F^A&&FA&F^C+F+B^F^D//",
        D: "|CFB-F+B|FA&F^A&&FB-F+B|FC//",
      }),
    },
  },
  {
    id: "flower",
    name: { en: "Flowering plant", fr: "Plante à fleurs" },
    definition: {
      generations: 5,
      length: 7,
      diameter: 20,
      angle: 22.5,
      axiom: "P",
      colors: ["#886622", "#227722", "#DD0000"],
      rules: rules({
        P: "I+[P+r]--//[--l]I[++l]-[Pr]++Pr",
        p: "FF",
        r: "[&&&p'/w////w////w////w////w]",
        s: "sFs",
        w: "['^F][{&&&&-f+f|-f+f}]",
        I: "Fs[//&&l][//^^l]Fs",
        l: "['{+f-ff-f+|+f-ff-f}]",
      }),
    },
  },
  {
    id: "tree",
    name: { en: "Branching tree", fr: "Arbre ramifié" },
    definition: {
      generations: 7,
      length: 7,
      diameter: 35,
      angle: 22.5,
      axiom: "A",
      colors: ["#886622", "#227722"],
      rules: rules({
        A: "[&FL!A]/////[&FL!A]///////[&FL!A]",
        F: "S/////F",
        S: "FL",
        L: "['∧∧{-f+f+f-|-f+f+f}]",
      }),
    },
  },
]

export function getPreset(id: PresetId): Definition {
  const preset = PRESETS.find((entry) => entry.id === id)
  if (!preset) throw new RangeError(`Unknown preset: ${id}`)
  return {
    ...preset.definition,
    colors: [...preset.definition.colors],
    rules: preset.definition.rules.map((rule) => ({ ...rule })),
  }
}
