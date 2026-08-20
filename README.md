# Xfeatures Athenaeum — MCP

**Connect an AI agent to your organisation's knowledge over the Model Context Protocol.**

[![CI](https://github.com/XfeaturesGroup/XfeaturesAthenaeumMCP/actions/workflows/ci.yml/badge.svg)](https://github.com/XfeaturesGroup/XfeaturesAthenaeumMCP/actions/workflows/ci.yml)
[![MCP](https://img.shields.io/badge/MCP-Streamable_HTTP-6E56CF)](docs/MCP.md)
[![Stateless](https://img.shields.io/badge/session-stateless-brightgreen)](docs/MCP.md#transport-and-protocol)
[![Licence](https://img.shields.io/badge/licence-proprietary-lightgrey)](LICENSE)

```
Endpoint   https://athenaeum.xfeatures.net/mcp
Transport  Streamable HTTP (stateless)
Auth       Authorization: Bearer <token>
Discovery  GET /.well-known/oauth-protected-resource
```

## Connect now

**Claude Code:**

```bash
claude mcp add athenaeum --transport http https://athenaeum.xfeatures.net/mcp \
  --header "Authorization: Bearer $ATHENAEUM_TOKEN"
```

**Any MCP client:**

```json
{
  "mcpServers": {
    "athenaeum": {
      "type": "http",
      "url": "https://athenaeum.xfeatures.net/mcp",
      "headers": { "Authorization": "Bearer ${ATHENAEUM_TOKEN}" }
    }
  }
}
```

**Get a token** — interactively, with the
[CLI](https://github.com/XfeaturesGroup/XfeaturesAthenaeumCLI):

```bash
npx @xfeatures/athenaeum-cli login      # Authorization Code + PKCE, no secret
```

or for an unattended agent, with the `client_credentials` grant:

```bash
curl -s https://auth.xfeatures.net/oauth/token \
  -d grant_type=client_credentials \
  -d "client_id=$CLIENT_ID" -d "client_secret=$CLIENT_SECRET"
```

**Check it works:**

```bash
ATHENAEUM_TOKEN=... node examples/probe.mjs
```

```
endpoint: https://athenaeum.xfeatures.net/mcp

initialize   ok -- athenaeum 0.2.0
tools/list   ok -- 9 tools
               knowledge_search
               knowledge_get_fact
               ...
privileged tools exposed: none
tools/call   ok -- 3 result(s)
             notice present: true
```

## The nine tools

Seven read, two that create a draft.

| Tool | Does |
|---|---|
| `knowledge_search` | Semantic search, returns evidence chunks with citations |
| `knowledge_get_fact` | One exact fact by namespace and key |
| `knowledge_get_document` | One published document, full text |
| `knowledge_get_product` / `_plan` / `_policy` / `_incident` | Catalog lookups by code |
| `knowledge_propose_document` | Creates a **draft** — never publishes |
| `knowledge_submit_document_for_review` | Hands a draft to a human |

Per-tool permissions, rate buckets and quotas are in [docs/MCP.md](docs/MCP.md#tool-inventory).

## What an agent cannot do here

No tool publishes, approves, archives, deprecates, trashes, restores, purges,
rolls back, administers agents or grants a role. There is no raw database or
object-storage access.

That is enforced in the server, not by this repository's documentation: a
source-inspection test pins the exact tool list, rejects any tool name carrying a
destructive or administrative verb, and asserts the MCP module never touches a
storage binding, the ingestion queue or the publish workflow. Adding a tenth tool
that breaks any of it fails the build.

## Retrieved content is evidence, not instruction

Anything stored can contain text shaped like an instruction. Athenaeum treats all
of it as inert data — it never calls an LLM, and there is no path from retrieved
content into a prompt, a tool choice or a permission decision.

Every tool result is wrapped as `{ notice, data }`, so the warning travels *with
the payload* into whatever context window consumes it rather than sitting only in
a tool description the model saw once at connect time.

Your agent has to hold up the other end: keep retrieved passages out of your
system prompt, do not let them select tools, and treat a citation as something to
show a person rather than something to obey.

## Where the server lives

**The MCP server itself is in
[XfeaturesAthenaeum](https://github.com/XfeaturesGroup/XfeaturesAthenaeum)**, not
here, and deliberately so. It runs inside the Worker and shares one
authenticate → authorize → audit pipeline with REST and Workers RPC; extracting
it would either relocate security-critical code or fork it. Anything MCP can do,
the same credential could already do over REST. Anything REST refuses, MCP
refuses identically.

This repository is the client-facing half: how to connect, how to authenticate,
what the tools do, what the trust model is, and runnable examples.

## Documentation

| | |
|---|---|
| [docs/MCP.md](docs/MCP.md) | The full guide: transport, both OAuth flows, every tool with its required permission, worked `initialize`/`tools/list`/`tools/call`, errors, trust model, human-in-the-loop publishing |
| [docs/QUICKSTART.md](docs/QUICKSTART.md) | The five-minute version |
| [examples/](examples) | Connection probe and client configurations |

## Related repositories

| | |
|---|---|
| [XfeaturesAthenaeum](https://github.com/XfeaturesGroup/XfeaturesAthenaeum) | The core service, including the MCP server implementation |
| [XfeaturesAthenaeumSDK](https://github.com/XfeaturesGroup/XfeaturesAthenaeumSDK) | Typed REST client for programmatic use |
| [XfeaturesAthenaeumCLI](https://github.com/XfeaturesGroup/XfeaturesAthenaeumCLI) | Terminal client, and the easiest way to get a token |

## Licence

Source-available for reading, not open source. See [LICENSE](LICENSE).
