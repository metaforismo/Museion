# Museion Course Architect MCP

Museion exposes one secondary authoring capability: turn authorized material supplied by a user into a reviewable course. YouTube videos, playlists, books, course pages, transcripts, notes, excerpts, and uploaded text are material shapes inside one **Source Pack**. They are not separate products, and they do not replace Museion Originals.

Endpoint: `https://YOUR_MUSEION_HOST/api/mcp`

Transport: stateless Streamable HTTP JSON-RPC. Protocol version: `2025-03-26`.

## Tools

- `museion.prepare_source_pack` normalizes and hashes up to eight authorized materials. It returns metadata, warnings, provenance, and hashes without echoing raw source content.
- `museion.create_course` runs the same bounded Course Architect pipeline used by Creator Studio. It returns an asynchronous run id. GPT-5.6 proposes the course; deterministic validators decide whether it can be published.
- `museion.list_originals` lists the Museion-authored catalog and labels it separately from generated work.

The server never fetches protected YouTube captions, downloads video, bypasses paywalls, or treats a URL as evidence. A video or book reference must be paired with an authorized transcript, excerpt, or user-authored notes.

## Authentication and spend boundary

Set a long random `MUSEION_MCP_TOKEN` on the Museion server. Clients send:

```text
Authorization: Bearer <MUSEION_MCP_TOKEN>
```

Discovery, initialization, Source Pack preparation, and the authored-course catalog are available without this token. `museion.create_course` fails closed without it, so a connected client cannot silently consume model quota.

Do not commit the token or put it in a URL. Use each client's encrypted MCP/connector secret field. The deployed endpoint must use HTTPS.

## Client configuration

Use the same endpoint and Bearer token in ChatGPT custom connectors, Codex MCP configuration, Claude Code remote MCP, or Cursor MCP. Exact UI labels change across client releases, but the transport contract is the same:

```json
{
  "mcpServers": {
    "museion": {
      "url": "https://YOUR_MUSEION_HOST/api/mcp",
      "headers": {
        "Authorization": "Bearer ${MUSEION_MCP_TOKEN}"
      }
    }
  }
}
```

For local development, use the locally reachable `/api/mcp` URL supported by the client. ChatGPT-hosted connectors generally require a publicly reachable HTTPS deployment.

## Safety and data boundary

- Rights confirmation and a rights basis are mandatory.
- Raw material is normalized for compilation but omitted from Source Pack tool summaries.
- Every accepted course run stores a sanitized Source Pack manifest bound to the compiled document hash. Creator review reports per-material extracted-span and learning-block citation coverage without echoing raw material.
- Source references are provenance only; claims need exact supplied text spans.
- Course generation is bounded by the existing compiler stages, typed schemas, critic, one repair, citation gates, and private/public artifact split.
- Generated courses must be shown as `Generated from your sources`, never as `Museion Original`.
