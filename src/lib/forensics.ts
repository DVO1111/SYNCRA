import { createHelius } from "helius-sdk";
import { Connection, PublicKey } from "@solana/web3.js";

const SOLANA_MAINNET = "https://api.mainnet-beta.solana.com";

const HeliusAPIKey = import.meta.env.VITE_HELIUS_API_KEY;

let heliusClient: ReturnType<typeof createHelius> | null = null;
let heliusRpcUrl: string | undefined = undefined;

if (HeliusAPIKey) {
  heliusClient = createHelius({ apiKey: HeliusAPIKey });
  heliusRpcUrl = `https://mainnet.helius-rpc.com/?api-key=${HeliusAPIKey}`;
}

const connection = new Connection(heliusRpcUrl ?? SOLANA_MAINNET, "confirmed");


// Known labeled wallets (you can expand this list later)
const ENTITY_LABELS: Record<string, string> = {
  // Exchanges
  "BinanceWalletPubkeyHere": "exchange",
  "KucoinWalletPubkeyHere": "exchange",
  "OKXWalletPubkeyHere": "exchange",

  // Employers (if you register them)
  "CompanyA_EmployeePayrollWallet": "employer",
  "CompanyB_Operations": "employer",

  // Stablecoin processors
  "PajCashWalletHere": "merchant_processor",
};

export async function analyzeWalletActivity(address: string) {
  const pubKey = new PublicKey(address);

  const signatures = await connection.getSignaturesForAddress(pubKey, {
    limit: 30,
  });

  const transactions = await Promise.all(
    signatures.map((sig) =>
      connection.getParsedTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
      })
    )
  );

  let salaryLike = 0;
  let tradingLike = 0;
  let businessIncome = 0;
  let defiIncome = 0;
  let unknownIncome = 0;

  for (const tx of transactions) {
    if (!tx) continue;

    const amount = tx.meta?.postBalances?.[0] - tx.meta?.preBalances?.[0];

    // Skip zero changes
    if (Math.abs(amount) === 0) continue;

    // Identify the other party
    const accounts = tx.transaction.message.accountKeys.map((a) => a.pubkey);
    const counterparty = accounts.find((k) => k.toBase58() !== address);

    let label = "unknown";

    if (counterparty) {
      label = ENTITY_LABELS[counterparty.toBase58()] || "unknown";
    }

    // Salary-like classification: recurring amount, similar interval
    if (label === "employer") {
      salaryLike++;
    }

    // Exchange inflow → investment or trading gains
    if (label === "exchange") {
      tradingLike++;
    }

    // If money comes from many small addresses → sales or business income
    if (accounts.length > 8) {
      businessIncome++;
    }

    // If the tx references DeFi programs
    if (
      tx.transaction.message.accountKeys.some((k) =>
        k.pubkey.toBase58().includes("orca") ||
        k.pubkey.toBase58().includes("raydium") ||
        k.pubkey.toBase58().includes("jup")
      )
    ) {
      defiIncome++;
    }
  }

  return {
    salaryLike,
    tradingLike,
    businessIncome,
    defiIncome,
    unknownIncome,
    flags: {
      hasSalaryPattern: salaryLike >= 1,
      heavyTradingActivity: tradingLike >= 3,
      looksLikeFreelanceIncome: businessIncome >= 2,
    },
  };
}
