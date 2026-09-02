# Google Antigravity

Antigravity is the one MCP client here that needs its own folder instead of a
single config snippet, for two reasons that are easy to lose an hour to:

1. Its `mcp_config.json` accepts **literal header values only** -- `${VAR}`
   substitution, which every other client example in this repo relies on, is
   silently not supported for `headers`. The token has to be written into the
   file.
2. `athenaeum login` tokens expire in about an hour with no refresh (see the
   [CLI's "Known limitations"](https://github.com/XfeaturesGroup/XfeaturesAthenaeumCLI#known-limitations)).
   A one-time paste goes stale before most work sessions end.

[`setup.mjs`](setup.mjs) exists to make that not your problem: it installs the
CLI if it is missing, and once you are signed in, writes a fresh token into
Antigravity's config without disturbing any other MCP servers already
configured there.

## Setup

```bash
node setup.mjs
```

The first run installs `@xfeaturesgroup/athenaeum-cli` (from npm if a release
exists, otherwise it clones and builds
[XfeaturesAthenaeumCLI](https://github.com/XfeaturesGroup/XfeaturesAthenaeumCLI)
from source and `npm link`s it) and then tells you to sign in:

```bash
athenaeum login
```

This opens a browser against your Xfeatures Account -- nothing but a human can
complete this step, on purpose (see [docs/MCP.md](../../../docs/MCP.md#a-person-authorization-code--pkce)).
**Windows note:** if the auto-opened tab shows `Authorization Error: Missing
required OAuth parameters`, the OS's URL-open step truncated the link at an
`&`. The CLI also prints the full URL to the terminal (`If it doesn't open
automatically, visit: ...`) -- copy that one instead.

Once signed in, run the same command again to finish:

```bash
node setup.mjs
```

Then reconnect the `athenaeum` server in Antigravity's MCP panel (or restart
Antigravity). When the token expires, repeat `athenaeum login` +
`node setup.mjs`.

## What ends up in `mcp_config.json`

Located at `~/.gemini/config/mcp_config.json` on every platform:

```json
{
  "mcpServers": {
    "athenaeum": {
      "serverUrl": "https://athenaeum.xfeatures.net/mcp",
      "headers": {
        "Authorization": "Bearer <your token, written by setup.mjs>"
      }
    }
  }
}
```

`serverUrl` is Antigravity's own field name for a remote Streamable HTTP
server -- the `url`/`type: "http"` shape in
[`../generic-http.json`](../generic-http.json) is not recognized here.

## Verifying it worked

Ask Antigravity's assistant something that requires a tool call, e.g. "search
Athenaeum for X". You should see it call `knowledge_search`. If you get
`Unauthorized`, your token is stale or `mcp_config.json` still has a
placeholder -- re-run `athenaeum login` and `node setup.mjs`. If you get
"Failed to load MCP servers", the file most likely picked up a UTF-8 BOM --
`setup.mjs` avoids this by construction, but if you hand-edited the file with
a tool that adds one (PowerShell's `Set-Content -Encoding utf8` does), rewrite
it without a BOM.

If a driving AI agent is doing this setup rather than a person, see
[PROMPT.md](PROMPT.md).
