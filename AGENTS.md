# Agent instructions

Keep the custom L-system and WebGL implementation; do not replace it with a different engine as part of UI work. The React component is the maintained interface, and the standalone site consumes the same component.

Keep each scene scoped to its canvas. Clean up listeners, animation frames, pending work and GPU resources on disposal. Imports must be safe during server rendering. Bound user-authored grammars before allocating geometry.

Component styles must remain scoped. Maintain French and English interface text, accessible symbol help and keyboard controls. Documentation and commits are in English. Preserve the existing license and asset provenance.

Run type checks, core tests, library/demo builds and relevant browser checks. Verify the packed library in a separate consumer before publishing. Do not reintroduce shared portfolio header/footer assets or global DOM controllers.
