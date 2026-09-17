const RPC_ENDPOINTS = {
  testnet: "https://rpc.testnet.nimiqwatch.com/",
  mainnet: "https://rpc.nimiqwatch.com/",
} as const;

type NetworkName = keyof typeof RPC_ENDPOINTS;

type TransactionInfo = {
  hash?: unknown;
  blockNumber?: unknown;
  confirmations?: unknown;
  to?: unknown;
  value?: unknown;
  recipientData?: unknown;
  networkId?: unknown;
  executionResult?: unknown;
};

type RpcResponse = {
  result?: { data?: TransactionInfo | null } | TransactionInfo | null;
  error?: unknown;
};

export type VerifiedTransaction = {
  network: NetworkName;
  networkId: number | null;
  confirmations: number;
};

export class TransactionPendingError extends Error {}

function normalizeAddress(address: string) {
  return address.replace(/\s+/g, "").toUpperCase();
}

function decodeHex(value: string) {
  if (!/^(?:[a-f0-9]{2})*$/i.test(value)) return "";
  const bytes = new Uint8Array(value.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) || []);
  return new TextDecoder().decode(bytes);
}

function transactionFromResponse(response: RpcResponse): TransactionInfo | null {
  const result = response.result;
  if (!result || typeof result !== "object") return null;
  if ("data" in result) return result.data && typeof result.data === "object" ? result.data : null;
  return result;
}

async function fetchTransaction(endpoint: string, txHash: string) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "getTransactionByHash",
      params: [txHash],
      id: 1,
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) throw new Error("The Nimiq network could not be reached.");
  return transactionFromResponse((await response.json()) as RpcResponse);
}

export async function verifyNimiqTransaction(input: {
  txHash: string;
  recipientAddress: string;
  amountLuna: number;
  memo: string;
  networkHint?: unknown;
}): Promise<VerifiedTransaction> {
  const hinted = input.networkHint === "mainnet" || input.networkHint === "testnet"
    ? input.networkHint
    : null;
  const networks: NetworkName[] = hinted
    ? [hinted, hinted === "testnet" ? "mainnet" : "testnet"]
    : ["testnet", "mainnet"];

  let transaction: TransactionInfo | null = null;
  let network: NetworkName | null = null;
  let anyEndpointReached = false;

  for (const candidate of networks) {
    try {
      transaction = await fetchTransaction(RPC_ENDPOINTS[candidate], input.txHash);
      anyEndpointReached = true;
      if (transaction) {
        network = candidate;
        break;
      }
    } catch {
      // Try the other network before reporting a temporary outage.
    }
  }

  if (!transaction || !network) {
    if (!anyEndpointReached) throw new Error("The Nimiq network is temporarily unavailable.");
    throw new TransactionPendingError("Payment is still waiting for blockchain confirmation.");
  }

  if (String(transaction.hash || "").toLowerCase() !== input.txHash) {
    throw new Error("The blockchain returned a different transaction hash.");
  }
  if (transaction.executionResult === false) {
    throw new Error("This transaction did not execute successfully.");
  }
  const blockNumber = Number(transaction.blockNumber);
  if (!Number.isInteger(blockNumber) || blockNumber <= 0) {
    throw new TransactionPendingError("Payment is still waiting for blockchain confirmation.");
  }
  if (normalizeAddress(String(transaction.to || "")) !== normalizeAddress(input.recipientAddress)) {
    throw new Error("The transaction was sent to a different receiving address.");
  }
  if (Number(transaction.value) !== input.amountLuna) {
    throw new Error("The transaction amount does not match this share.");
  }
  if (decodeHex(String(transaction.recipientData || "")) !== input.memo) {
    throw new Error("The transaction reference does not match this payment link.");
  }

  return {
    network,
    networkId: Number.isInteger(Number(transaction.networkId)) ? Number(transaction.networkId) : null,
    confirmations: Math.max(1, Number(transaction.confirmations) || 1),
  };
}
