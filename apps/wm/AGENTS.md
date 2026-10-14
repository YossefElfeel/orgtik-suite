<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Page approval: Website Manager Admin, Super admin, and Owner roles may approve their own page changes. Keep the normal approval permission and draft-validation checks. Other roles and other content types retain the separate-reviewer requirement. Determine administrative roles from authenticated membership, never request fields.

Media details: raster images support uploading a replacement while retaining their media ID, metadata, existing references, and original file bytes in version history. Require media:edit and a current media version. Preserve stored content revisions and resolve retained image references when reading current content.
