# The Algorithmic Beauty of Plants

An L-system editor and 3D renderer, built while studying _The Algorithmic Beauty of Plants_. The custom turtle geometry and WebGL renderer are now available as a reusable React component, with an optional custom-element adapter.

[Open the explorer](https://westerbay.github.io/The-Algorithmic-Beauty-of-Plants/) · [Portfolio](https://westerbay.github.io/Home-Page/projects/plants/)

## What it does

- Four editable presets: plant, Hilbert curve, flower and tree.
- Axiom, rewriting rules, generations, length, diameter, angle and colour palette.
- Interactive camera, lighting, shadows, optional textured ground and sky.
- OBJ/MTL ZIP and PLY mesh exports.
- French and English interfaces, light/dark themes, keyboard controls.
- Symbol reference in a modal, opened from the information button beside Parameters.

The standalone explorer contains only the scene and its controls. It has no backend, tracking, shared portfolio banner or footer.

## Install

The package is distributed as a versioned GitHub release asset. It is not published to the npm registry.

```sh
pnpm add https://github.com/Westerbay/The-Algorithmic-Beauty-of-Plants/releases/download/v0.1.1/westerbay-lsystem-react-0.1.1.tgz
```

React and React DOM 18.3 or 19 are peer dependencies. Use a bundler that supports ES modules and CSS imports.

## React

```tsx
import { LSystem } from "@westerbay/lsystem-react"
import "@westerbay/lsystem-react/styles.css"

export function PlantExplorer() {
  return <LSystem initialPreset="tree" locale="en" controls="full" />
}
```

| Prop               | Default           | Purpose                                                            |
| ------------------ | ----------------- | ------------------------------------------------------------------ |
| initialPreset      | plant             | plant, hilbert, flower or tree                                     |
| initialDefinition  | preset definition | Provide an axiom, rules and drawing parameters                     |
| locale             | en                | en or fr                                                           |
| theme              | system            | system, light or dark                                              |
| controls           | full              | full editor, compact camera/preset controls, or none               |
| autoRotate         | false             | Continuous camera rotation; reduced-motion preference is respected |
| className          | none              | Class added to the component root                                  |
| onDefinitionChange | none              | Receives the definition after successful rendering                 |
| onError            | none              | Receives scene, validation or export errors                        |

A compact scene fits its parent height:

```tsx
<div style={{ height: 440 }}>
  <LSystem initialPreset="tree" controls="compact" theme="light" />
</div>
```

For full mode, set the CSS custom property `--lsystem-height` on a parent to size the viewport. The form adapts to the component width and scrolls independently, so opening sections does not resize the canvas. On narrow layouts the panel sits below the scene; its bounded height can be adjusted with the --lsystem-panel-height CSS custom property. Styles are scoped to the component; there is no global CSS reset.

```tsx
import { getPreset, type LSystemDefinition } from "@westerbay/lsystem-react"

const definition: LSystemDefinition = {
  ...getPreset("plant"),
  generations: 3,
  angle: 25,
}

<LSystem initialDefinition={definition} onDefinitionChange={console.log} />
```

Definitions use centimetres for length, degrees for angle and a percentage of length for branch diameter. Changing initialPreset or initialDefinition resets the editor to that source; choosing a preset renders it immediately, while manual form edits stay local until Draw is pressed. The callbacks do not make this a controlled input.

## Custom element

The optional adapter uses a shadow root to isolate its styles. It still uses React internally. Register it once in an application entrypoint:

```ts
import { defineLSystemElement } from "@westerbay/lsystem-react/element"
defineLSystemElement()
```

```html
<lsystem-viewer
  preset="tree"
  controls="full"
  locale="en"
  theme="system"
  auto-rotate="false"
></lsystem-viewer>
```

Supported attributes are preset, controls, locale, theme and auto-rotate. A custom definition can be assigned through the element's `definition` property. Listen for `definitionchange` (detail: definition) and `sceneerror` (detail: message object). The adapter bundles its CSS, so a separate stylesheet import is not needed.

## Behaviour and limits

Drag the canvas to rotate. Zoom with the buttons, with the wheel after focusing the canvas, or with Ctrl + wheel. A focused canvas also accepts arrow keys, +/− and 0 to reset the camera. The surrounding page keeps normal wheel scrolling until the canvas is focused. Open the symbol guide for supported commands and their interpretation.

Each mounted component owns its canvas, camera, listeners and GPU resources. Unmounting disposes them. Imports are safe during server rendering; WebGL starts after mounting. Rendering pauses off screen and in hidden tabs. Sky/ground textures and the OBJ ZIP exporter are loaded on demand.

This implementation supports deterministic, non-parametric grammars. It rejects invalid or unsupported commands and bounds expansion before allocating geometry: at most 16 generations, 250,000 expanded symbols, 20,000 segments, 30,000 polygon vertices and 256 branch levels. These safeguards keep accidental exponential definitions from exhausting the browser. Larger research scenes are outside the interactive editor's scope.

## Development

Node 24 and pnpm 12.4.1:

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
```

- `src/core`: grammar validation, expansion and turtle geometry.
- `src/engine`: WebGL rendering, camera, texture loading and exports.
- `src/react`: React lifecycle, editor and symbol dialog.
- `src/element.tsx`: optional custom-element adapter.
- `demo`: standalone explorer using the same component.
- `dist/library`: ES modules, declarations and stylesheet.
- `dist/site`: static demo ready for any subpath.

`pnpm build` builds both outputs. `pnpm pack` packages the built library. Check that tarball in a separate consumer before creating a release. Publish the demo through the manual **Publish explorer** GitHub Actions workflow, with GitHub Pages configured to use Actions.

## Reference and license

The original academic project followed _The Algorithmic Beauty of Plants_ by Przemyslaw Prusinkiewicz and Aristid Lindenmayer. The historical reference PDF remains in this repository as `abop.pdf`.

The project keeps its existing [GPL-3.0-only license](LICENSE). The renderer retains the original shaders and texture assets; the refactor does not establish new rights for those assets or the reference publication. The library uses gl-matrix (MIT) and JSZip (MIT or GPL-3.0); their license notices accompany dependencies. This is a refactor of the original custom renderer, without a replacement 3D engine.
