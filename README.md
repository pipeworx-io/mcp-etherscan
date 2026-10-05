# @pipeworx/etherscan

Etherscan V2 MCP — multichain (50+ EVM chains) block-explorer access.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1689+ live data sources. This is an independent, unofficial integration — not affiliated with, endorsed by, or published by the upstream provider.

## Tools

- `get_balance(address, chain?)` — native-token balance.
- `get_token_balance(address, contract_address, chain?)` — ERC-20 balance.
- `list_transactions(address, type?, chain?, ...)` — normal / internal / erc20 / erc721 / erc1155.
- `get_contract_abi(address, chain?)` — verified ABI.
- `get_contract_source(address, chain?)` — verified source + metadata.

## Auth

- **Platform key:** gateway env `PLATFORM_ETHERSCAN_KEY`.
- **BYO:** `?_apiKey=<key>` after registering at https://etherscan.io/apis (free 100k/day, 5 req/sec).

## Data source

`https://api.etherscan.io/v2/api` — single key works across all supported chains via `chainid` param.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "etherscan": {
      "url": "https://gateway.pipeworx.io/etherscan/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/etherscan/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1689+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/etherscan_get_balance \
  -H 'Content-Type: application/json' \
  -d '{"address":"0x1234567890123456789012345678901234567890"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/etherscan_get_balance`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

```json
{
  "mcpServers": {
    "etherscan": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-etherscan"]
    }
  }
}
```

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-etherscan
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Etherscan data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
