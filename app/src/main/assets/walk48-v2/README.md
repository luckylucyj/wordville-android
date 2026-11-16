# Resident walking artwork v2

The game loads these twelve RGBA PNG atlases through `walk48-loader.js`.

- Each sheet: **384 × 384 pixels**, eight 48 × 48 frames per direction.
- Rows: down, down-right, right, up-right, up, up-left, left, down-left.
- Down/front and up/back: eight full-body walk poses per resident.
- Right/side: eight full-body walk poses with fixed near/far leg depth and opposite arm swing.
- Left: right-side frames mirrored horizontally.
- **Diagonal directions are provisional side-profile stand-ins**, not separately drawn diagonal perspectives.
- Source frames use a stable horizontal center and foot-anchor y = 43.

The original `../walk48/` assets and its generator remain unchanged for comparison and rollback. This is intentionally a separate versioned path so that the existing audit/build step cannot overwrite the approved artwork.
