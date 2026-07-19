# Multimodal Evidence Design

IncidentLens converts uploaded operational artifacts into citation-aware evidence without fabricating content when extraction fails.

## Supported Inputs

| Input | Formats | Provider |
| --- | --- | --- |
| Images and dashboards | PNG, JPEG, WebP | configured vision model |
| Audio notes | MP3, WAV, M4A | configured transcription model |
| Documents | PDF, Markdown, text | `pypdf` or direct text extraction |

## Processing Contract

1. Validate extension, size, and normalized filename.
2. Store the uploaded artifact in the configured evidence directory.
3. Extract text through the appropriate provider.
4. Reject unreadable or empty evidence instead of inserting placeholder text.
5. Normalize and chunk extracted content.
6. Generate embeddings through the configured sentence-transformer model.
7. Persist stable citation identifiers and metadata.
8. Expose extraction, processing, and embedding failures to the workspace.

## Provider Security

- model credentials are read only by the API and worker processes
- browser uploads pass through the authenticated Next.js backend proxy
- stored paths are resolved beneath the configured evidence root
- file size and supported extensions are enforced before extraction
- provider errors remain explicit and do not become successful evidence

## Retrieval

All extracted content enters the same evidence and chunk contracts as connected operational sources. Reports can therefore cite images, audio, PDFs, logs, provider events, and runbooks through stable `EVID-*` identifiers.
