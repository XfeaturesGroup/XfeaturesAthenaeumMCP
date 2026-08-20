# Claude Code

```bash
claude mcp add athenaeum --transport http https://athenaeum.xfeatures.net/mcp \
  --header "Authorization: Bearer $ATHENAEUM_TOKEN"
```

Get `$ATHENAEUM_TOKEN` either from the
[CLI](https://github.com/XfeaturesGroup/XfeaturesAthenaeumCLI) (`athenaeum login`,
which performs the PKCE flow and stores the token) or from the
`client_credentials` grant for an unattended agent.

Verify the connection:

```
/mcp
```

You should see `athenaeum` connected with nine tools. If it reports an auth
failure, the 401 carries a `WWW-Authenticate` header pointing at the
protected-resource metadata — see [../../docs/MCP.md](../../docs/MCP.md#errors).
