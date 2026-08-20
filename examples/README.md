# Examples

| | |
|---|---|
| [`probe.mjs`](probe.mjs) | Runs `initialize`, `tools/list` and one `tools/call` with plain fetch and no dependencies. Use it when a client will not connect and you need to know whether the problem is the connection or the client. |
| [`clients/claude-code.md`](clients/claude-code.md) | Adding the server to Claude Code |
| [`clients/generic-http.json`](clients/generic-http.json) | Streamable HTTP configuration for any MCP client |

Every example reads its token from `ATHENAEUM_TOKEN`. None contains a
credential, and CI fails if one ever does.

```bash
ATHENAEUM_TOKEN=$(athenaeum whoami --print-token 2>/dev/null || echo "$ATHENAEUM_TOKEN") \
  node probe.mjs
```

The probe also reports whether any privileged tool is exposed. The expected
answer is `none` — see [../docs/MCP.md](../docs/MCP.md#what-is-deliberately-absent).
