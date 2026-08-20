# MCP quick start

Athenaeum speaks the Model Context Protocol over Streamable HTTP at `/mcp`. It is
stateless — no session to establish, no Durable Object behind it — so any MCP
client that can send a bearer token can connect.

The important part: **MCP is not a side door.** Every tool below runs the same
authenticate → authorize → audit pipeline as REST and RPC. A tool call from a model
has exactly the permissions of the credential it was invoked with.

## Connecting

```
Endpoint:  https://athenaeum.xfeatures.net/mcp
Transport: Streamable HTTP
Auth:      Authorization: Bearer <token>
```

For Claude Code:

```bash
claude mcp add athenaeum --transport http https://athenaeum.xfeatures.net/mcp \
  --header "Authorization: Bearer $TOKEN"
```

Clients that support RFC 9728 can discover the authorization server themselves from
`/.well-known/oauth-protected-resource`.

## Tools

| Tool | What it does |
|---|---|
| `knowledge_search` | Semantic search across everything the caller is cleared for |
| `knowledge_get_fact` | One structured fact by namespace and key |
| `knowledge_get_document` | One document by id |
| `knowledge_get_product` / `_plan` / `_policy` / `_incident` | Catalog reads |
| `knowledge_propose_document` | Draft a document — creates it, does not publish it |
| `knowledge_submit_document_for_review` | Hand a draft to a human |

There is no publish tool, no delete tool, and no agent-administration tool. That is
deliberate: the destructive and the irreversible are not reachable from a model's
tool loop at all.

## Every result carries a warning

Tool results are wrapped as `{notice, data}`, where `notice` says that the payload
is retrieved evidence rather than instruction. The warning travels *with the
payload* into whatever context window consumes it, instead of sitting only in a
tool description the model saw once at connect time.

That matters because documents are untrusted input. Anything stored can contain
text shaped like an instruction. Athenaeum never concatenates retrieved content
into a prompt, never evaluates it, and never lets it influence a permission
decision — it does not call an LLM at all. The calling agent must hold up the same
end: keep retrieved passages out of anywhere they could be read as a system-level
directive.

## Trying it without a client

```bash
curl -s https://athenaeum.xfeatures.net/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
