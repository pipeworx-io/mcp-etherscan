# mcp-etherscan

Etherscan MCP — multichain block-explorer API (Etherscan V2)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 673+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_token_balance` | ERC-20 token balance for an address against a specific token contract. |
| `get_contract_abi` | Verified contract ABI as JSON (if the contract is verified on Etherscan). |
| `get_contract_source` | Verified contract source code, compiler version, optimization settings, and license. |

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

Or connect to the full Pipeworx gateway for access to all 673+ data sources:

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

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
