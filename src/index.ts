interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Etherscan MCP — multichain block-explorer API (Etherscan V2)
 *
 * Etherscan's V2 endpoint covers 50+ EVM chains (Ethereum, Polygon, BSC, Base,
 * Arbitrum, Optimism, Avalanche, etc.) under a single API key. Free tier:
 * 5 calls/sec, 100k/day.
 *
 * API: https://docs.etherscan.io/etherscan-v2
 * Tools:
 * - get_balance:         native-token balance for an address
 * - get_token_balance:   ERC-20 balance for an address
 * - list_transactions:   normal / internal / token / nft transfers
 * - get_contract_abi:    verified contract ABI
 * - get_contract_source: verified contract source + compiler metadata
 */


const BASE_URL = 'https://api.etherscan.io/v2/api';

// Common chains. Etherscan V2 supports 50+; this is a labeled subset for hints.
const CHAINS: Record<string, { id: number; name: string; symbol: string; decimals: number }> = {
  ethereum: { id: 1, name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  polygon: { id: 137, name: 'Polygon', symbol: 'MATIC', decimals: 18 },
  bsc: { id: 56, name: 'BNB Smart Chain', symbol: 'BNB', decimals: 18 },
  base: { id: 8453, name: 'Base', symbol: 'ETH', decimals: 18 },
  arbitrum: { id: 42161, name: 'Arbitrum One', symbol: 'ETH', decimals: 18 },
  optimism: { id: 10, name: 'OP Mainnet', symbol: 'ETH', decimals: 18 },
  avalanche: { id: 43114, name: 'Avalanche C-Chain', symbol: 'AVAX', decimals: 18 },
  fantom: { id: 250, name: 'Fantom', symbol: 'FTM', decimals: 18 },
  gnosis: { id: 100, name: 'Gnosis Chain', symbol: 'xDAI', decimals: 18 },
  linea: { id: 59144, name: 'Linea', symbol: 'ETH', decimals: 18 },
  scroll: { id: 534352, name: 'Scroll', symbol: 'ETH', decimals: 18 },
  zksync: { id: 324, name: 'zkSync Era', symbol: 'ETH', decimals: 18 },
  blast: { id: 81457, name: 'Blast', symbol: 'ETH', decimals: 18 },
  mantle: { id: 5000, name: 'Mantle', symbol: 'MNT', decimals: 18 },
};

const tools: McpToolExport['tools'] = [
  {
    name: 'get_balance',
    description:
      'Native-token balance for an address on a supported EVM chain. Defaults to Ethereum mainnet. Accepts chain by slug (ethereum, polygon, bsc, base, arbitrum, optimism, avalanche, fantom, gnosis, linea, scroll, zksync, blast, mantle) or numeric chain ID.',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: '0x address' },
        chain: { type: 'string', description: 'Chain slug or numeric chain ID (default ethereum)' },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_token_balance',
    description: 'ERC-20 token balance for an address against a specific token contract.',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Holder address' },
        contract_address: { type: 'string', description: 'ERC-20 contract address' },
        chain: { type: 'string', description: 'Chain slug or numeric chain ID (default ethereum)' },
      },
      required: ['address', 'contract_address'],
    },
  },
  {
    name: 'list_transactions',
    description:
      'List transactions for an address. type controls which list: "normal" (regular EOA txs), "internal" (contract-internal value transfers), "erc20" (ERC-20 transfers), "erc721" (NFT transfers), "erc1155" (multi-token transfers).',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Address to inspect' },
        type: {
          type: 'string',
          description: 'normal | internal | erc20 | erc721 | erc1155 (default normal)',
          enum: ['normal', 'internal', 'erc20', 'erc721', 'erc1155'],
        },
        chain: { type: 'string', description: 'Chain slug or chain ID (default ethereum)' },
        startblock: { type: 'number', description: 'Start block (default 0)' },
        endblock: { type: 'number', description: 'End block (default latest = 99999999)' },
        sort: { type: 'string', description: 'asc | desc (default desc)', enum: ['asc', 'desc'] },
        offset: { type: 'number', description: 'Results per page (default 25, max 10000)' },
        page: { type: 'number', description: 'Page number (default 1)' },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_contract_abi',
    description: 'Verified contract ABI as JSON (if the contract is verified on Etherscan).',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Contract address' },
        chain: { type: 'string', description: 'Chain slug or chain ID (default ethereum)' },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_contract_source',
    description: 'Verified contract source code, compiler version, optimization settings, and license.',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Contract address' },
        chain: { type: 'string', description: 'Chain slug or chain ID (default ethereum)' },
      },
      required: ['address'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = (args._apiKey as string | undefined)?.trim();
  if (!apiKey) {
    throw new Error(
      'Etherscan requires an API key (free 100k/day at https://etherscan.io/apis). Contact the operator about platform credentials, or BYO via ?_apiKey=<key>.',
    );
  }
  const chainId = resolveChainId(args.chain as string | number | undefined);
  switch (name) {
    case 'get_balance':
      return getBalance(apiKey, chainId, String(args.address));
    case 'get_token_balance':
      return getTokenBalance(apiKey, chainId, String(args.address), String(args.contract_address));
    case 'list_transactions':
      return listTransactions(apiKey, chainId, args);
    case 'get_contract_abi':
      return getAbi(apiKey, chainId, String(args.address));
    case 'get_contract_source':
      return getSource(apiKey, chainId, String(args.address));
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function resolveChainId(chain: string | number | undefined): number {
  if (chain == null) return 1;
  if (typeof chain === 'number') return chain;
  const trimmed = chain.trim().toLowerCase();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const entry = CHAINS[trimmed];
  if (!entry) throw new Error(`Unknown chain "${chain}". Pass a numeric chain ID or one of: ${Object.keys(CHAINS).join(', ')}`);
  return entry.id;
}

function chainMeta(id: number) {
  return Object.values(CHAINS).find((c) => c.id === id) ?? null;
}

async function esFetch<T>(apiKey: string, chainId: number, params: Record<string, string>): Promise<T> {
  const search = new URLSearchParams({ chainid: String(chainId), apikey: apiKey, ...params });
  const res = await fetch(`${BASE_URL}?${search}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Etherscan error: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { status?: string; message?: string; result?: unknown };
  // Etherscan responses use status: "1" for success, "0" for "No transactions found" (which is fine)
  if (data.status === '0' && data.message && data.message !== 'No transactions found' && data.message !== 'No records found') {
    throw new Error(`Etherscan: ${data.message} (${typeof data.result === 'string' ? data.result : ''})`.trim());
  }
  return data as T;
}

function formatBalance(raw: string, decimals: number): { wei: string; formatted: string } {
  // Avoid number-precision loss for big balances; format with BigInt + manual decimal.
  let s = raw.replace(/^0+/, '') || '0';
  if (decimals === 0) return { wei: raw, formatted: s };
  while (s.length <= decimals) s = '0' + s;
  const whole = s.slice(0, -decimals);
  const frac = s.slice(-decimals).replace(/0+$/, '');
  return { wei: raw, formatted: frac ? `${whole}.${frac}` : whole };
}

async function getBalance(apiKey: string, chainId: number, address: string) {
  const data = await esFetch<{ result?: string }>(apiKey, chainId, {
    module: 'account',
    action: 'balance',
    address,
    tag: 'latest',
  });
  const meta = chainMeta(chainId);
  const { wei, formatted } = formatBalance(String(data.result ?? '0'), meta?.decimals ?? 18);
  return {
    chain_id: chainId,
    chain_name: meta?.name ?? null,
    address,
    wei,
    balance: formatted,
    symbol: meta?.symbol ?? null,
  };
}

async function getTokenBalance(apiKey: string, chainId: number, address: string, contract: string) {
  const data = await esFetch<{ result?: string }>(apiKey, chainId, {
    module: 'account',
    action: 'tokenbalance',
    contractaddress: contract,
    address,
    tag: 'latest',
  });
  // Token decimals unknown without an additional call — return raw balance only
  return {
    chain_id: chainId,
    chain_name: chainMeta(chainId)?.name ?? null,
    address,
    contract_address: contract,
    raw_balance: String(data.result ?? '0'),
    note: 'Use the token\'s decimals (from getsourcecode or the contract\'s decimals()) to convert to human units.',
  };
}

const TX_ACTIONS: Record<string, string> = {
  normal: 'txlist',
  internal: 'txlistinternal',
  erc20: 'tokentx',
  erc721: 'tokennfttx',
  erc1155: 'token1155tx',
};

async function listTransactions(apiKey: string, chainId: number, args: Record<string, unknown>) {
  const type = (args.type as string) ?? 'normal';
  const action = TX_ACTIONS[type];
  if (!action) throw new Error(`Unknown transaction type "${type}"`);

  const data = await esFetch<{ result?: unknown }>(apiKey, chainId, {
    module: 'account',
    action,
    address: String(args.address),
    startblock: String((args.startblock as number) ?? 0),
    endblock: String((args.endblock as number) ?? 99999999),
    sort: (args.sort as string) ?? 'desc',
    page: String((args.page as number) ?? 1),
    offset: String(Math.min(10000, Math.max(1, (args.offset as number) ?? 25))),
  });

  return {
    chain_id: chainId,
    chain_name: chainMeta(chainId)?.name ?? null,
    address: args.address,
    type,
    count: Array.isArray(data.result) ? data.result.length : 0,
    transactions: Array.isArray(data.result) ? data.result : [],
  };
}

async function getAbi(apiKey: string, chainId: number, address: string) {
  const data = await esFetch<{ result?: string }>(apiKey, chainId, {
    module: 'contract',
    action: 'getabi',
    address,
  });
  const raw = String(data.result ?? '');
  if (raw.startsWith('Contract source code not verified')) {
    return { chain_id: chainId, address, verified: false, abi: null };
  }
  let abi: unknown = raw;
  try {
    abi = JSON.parse(raw);
  } catch {
    // leave as string
  }
  return { chain_id: chainId, address, verified: true, abi };
}

async function getSource(apiKey: string, chainId: number, address: string) {
  const data = await esFetch<{ result?: SourceRow[] }>(apiKey, chainId, {
    module: 'contract',
    action: 'getsourcecode',
    address,
  });
  const row = data.result?.[0];
  if (!row || !row.ContractName) {
    return { chain_id: chainId, address, verified: false };
  }
  return {
    chain_id: chainId,
    chain_name: chainMeta(chainId)?.name ?? null,
    address,
    verified: true,
    contract_name: row.ContractName,
    compiler_version: row.CompilerVersion,
    optimization_used: row.OptimizationUsed === '1',
    runs: row.Runs ? Number(row.Runs) : null,
    license_type: row.LicenseType ?? null,
    constructor_arguments: row.ConstructorArguments ?? null,
    proxy: row.Proxy === '1',
    implementation: row.Implementation || null,
    source_code: row.SourceCode ?? null,
    abi: row.ABI ?? null,
  };
}

interface SourceRow {
  ContractName?: string;
  CompilerVersion?: string;
  OptimizationUsed?: string;
  Runs?: string;
  LicenseType?: string;
  ConstructorArguments?: string;
  Proxy?: string;
  Implementation?: string;
  SourceCode?: string;
  ABI?: string;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
