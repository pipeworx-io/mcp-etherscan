# @pipeworx/etherscan

Etherscan V2 MCP — multichain (50+ EVM chains) block-explorer access.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Etherscan data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
