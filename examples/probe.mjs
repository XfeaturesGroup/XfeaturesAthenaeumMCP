#!/usr/bin/env node
/**
 * Connection probe for the Xfeatures Athenaeum MCP endpoint.
 *
 * Runs the three calls every MCP client makes -- initialize, tools/list and one
 * tools/call -- with plain fetch and no dependencies, so a failure points at the
 * connection rather than at a client library.
 *
 *   ATHENAEUM_TOKEN=... node examples/probe.mjs
 *   ATHENAEUM_TOKEN=... node examples/probe.mjs --url https://athenaeum.example.net/mcp
 *
 * This is a client. It contains no server logic and makes no access decisions:
 * whatever it can reach is exactly what the token's Athenaeum principal is
 * allowed to reach.
 */

const args = process.argv.slice(2);
const urlFlag = args.indexOf("--url");
const ENDPOINT = urlFlag !== -1 ? args[urlFlag + 1] : (process.env.ATHENAEUM_MCP_URL ?? "https://athenaeum.xfeatures.net/mcp");
const TOKEN = process.env.ATHENAEUM_TOKEN;

if (!TOKEN) {
  console.error("Set ATHENAEUM_TOKEN. Get one with `athenaeum login` (CLI) or the client_credentials grant.");
  process.exit(2);
}

let id = 0;

async function rpc(method, params) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${TOKEN}`,
      "content-type": "application/json",
      // Streamable HTTP servers may answer with either, so ask for both.
      accept: "application/json, text/event-stream"
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, ...(params ? { params } : {}) })
  });

  const text = await response.text();

  if (response.status === 401) {
    // RFC 9728: the challenge names where to discover the authorization server.
    const challenge = response.headers.get("www-authenticate");
    throw new Error(`401 Unauthorized.${challenge ? ` ${challenge}` : ""}`);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`);

  // Streamable HTTP may frame the reply as SSE; take the last data: line.
  const payload = text.startsWith("event:") || text.startsWith("data:")
    ? text.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).at(-1)
    : text;

  const body = JSON.parse(payload);
  if (body.error) throw new Error(`${method} failed: ${body.error.message ?? JSON.stringify(body.error)}`);
  return body.result;
}

async function main() {
  console.log(`endpoint: ${ENDPOINT}\n`);

  const init = await rpc("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "athenaeum-probe", version: "1.0.0" }
  });
  console.log(`initialize   ok -- ${init.serverInfo?.name} ${init.serverInfo?.version}`);

  const { tools } = await rpc("tools/list");
  console.log(`tools/list   ok -- ${tools.length} tools`);
  for (const tool of tools) console.log(`               ${tool.name}`);

  // Nothing here can publish, approve, delete or administer: no such tool is
  // exposed. Confirm that rather than trusting the documentation.
  const forbidden = tools.filter((tool) => /publish|approve|admin|delete|purge|trash|restore|rollback|role|grant/i.test(tool.name));
  console.log(`\nprivileged tools exposed: ${forbidden.length === 0 ? "none" : forbidden.map((t) => t.name).join(", ")}`);

  const result = await rpc("tools/call", {
    name: "knowledge_search",
    arguments: { query: process.env.ATHENAEUM_QUERY ?? "refund policy", limit: 3 }
  });
  const payload = JSON.parse(result.content?.[0]?.text ?? "{}");
  if (payload.error) {
    console.log(`tools/call   returned ${payload.error.code}: ${payload.error.message}`);
  } else {
    const hits = payload.data?.results ?? [];
    console.log(`tools/call   ok -- ${hits.length} result(s)${hits.length === 0 ? ` (${payload.data?.reason ?? "no reason given"})` : ""}`);
    console.log(`             notice present: ${Boolean(payload.notice)}`);
  }
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
