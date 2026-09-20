import type { Definition } from "../types.ts"
import { validateDefinition } from "./definition.ts"
import { expandValidatedDefinition } from "./expand.ts"
import { TurtleMesh } from "./TurtleMesh.ts"
import { add, scale } from "./math.ts"
import type { Vector3 } from "./math.ts"

interface State {
  position: Vector3
  heading: Vector3
  left: Vector3
  up: Vector3
  diameter: number
  color: number
  lastLine: number
}
function copyState(state: State): State {
  return {
    ...state,
    position: [...state.position],
    heading: [...state.heading],
    left: [...state.left],
    up: [...state.up],
  }
}

/** Pure and deterministic. Length is entered in cm; palette indices wrap modulo its size. */
export function generateGeometry(input: Definition): TurtleMesh {
  const definition = validateDefinition(input)
  const word = expandValidatedDefinition(definition)
  const mesh = new TurtleMesh()
  const length = definition.length * 0.01
  const angle = (definition.angle * Math.PI) / 180
  let state: State = {
    position: [0, 0, 0],
    heading: [0, 1, 0],
    left: [-1, 0, 0],
    up: [0, 0, -1],
    diameter: definition.diameter * 0.01,
    color: 0,
    lastLine: 0,
  }
  const stack: State[] = []
  let polygon: number[] | undefined

  const recordLineVertex = (): number => {
    const index = mesh.verticesLine.length / 3
    mesh.addVertexLine(state.position, state.color, state.up, state.left)
    return index
  }
  recordLineVertex()

  const turn = (rotation: number): void => {
    const cosine = Math.cos(rotation)
    const sine = Math.sin(rotation)
    const { heading, left } = state
    state.heading = add(scale(heading, cosine), scale(left, sine))
    state.left = add(scale(heading, -sine), scale(left, cosine))
  }
  const pitch = (rotation: number): void => {
    const cosine = Math.cos(rotation)
    const sine = Math.sin(rotation)
    const { heading, up } = state
    state.heading = add(scale(heading, cosine), scale(up, -sine))
    state.up = add(scale(heading, sine), scale(up, cosine))
  }
  const roll = (rotation: number): void => {
    const cosine = Math.cos(rotation)
    const sine = Math.sin(rotation)
    const { left, up } = state
    state.left = add(scale(left, cosine), scale(up, -sine))
    state.up = add(scale(left, sine), scale(up, cosine))
  }

  for (const symbol of word) {
    switch (symbol) {
      case "F":
      case "f": {
        state.position = add(state.position, scale(state.heading, length))
        if (polygon) {
          polygon.push(mesh.verticesPolygon.length / 3)
          mesh.addVertexPolygon(
            state.position,
            state.color,
            state.up,
            state.left,
          )
        } else {
          const next = recordLineVertex()
          if (symbol === "F") {
            mesh.addLine(state.lastLine, next)
            mesh.addRod(state.lastLine, next, length * state.diameter)
          }
          // Pen-up moves must also advance the start of the next visible segment.
          state.lastLine = next
        }
        break
      }
      case "+":
        turn(angle)
        break
      case "-":
        turn(-angle)
        break
      case "^":
      case "∧":
        pitch(angle)
        break
      case "&":
        pitch(-angle)
        break
      case "\\":
        roll(angle)
        break
      case "/":
        roll(-angle)
        break
      case "|":
        turn(Math.PI)
        break
      case "[":
        stack.push(copyState(state))
        break
      case "]":
        state = stack.pop()!
        break // Structure was checked before allocating the mesh.
      case "{":
        polygon = []
        break
      case "}":
        mesh.addPolygon(polygon!, length)
        polygon = undefined
        state.lastLine = recordLineVertex()
        break
      case "!":
        // Keep a finite positive radius after long sequences of reductions.
        state.diameter = Math.max(state.diameter * 0.6, 1e-6)
        break
      case "'":
      case "’":
      case "‘":
      case "\u0003":
        state.color = (state.color + 1) % definition.colors.length
        if (!polygon) state.lastLine = recordLineVertex()
        break
    }
  }
  return mesh
}
