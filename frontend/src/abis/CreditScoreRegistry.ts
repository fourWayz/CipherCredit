// Auto-generate by running: npx hardhat compile && cat artifacts/contracts/CreditScoreRegistry.sol/CreditScoreRegistry.json | jq .abi
// Replace the placeholder below with the compiled ABI after `pnpm compile`
export const CreditScoreRegistryABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "borrower",  "type": "address" },
      { "indexed": false, "internalType": "uint256",  "name": "timestamp","type": "uint256" }
    ],
    "name": "CreditDataSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "borrower", "type": "address" }
    ],
    "name": "ScoreComputed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "borrower",  "type": "address" },
      { "indexed": true,  "internalType": "address", "name": "lender",    "type": "address" },
      { "indexed": false, "internalType": "uint32",   "name": "threshold", "type": "uint32" }
    ],
    "name": "LenderApprovalGranted",
    "type": "event"
  },
  {
    "inputs": [
      { "components": [
          { "internalType": "uint256", "name": "ctHash",     "type": "uint256" },
          { "internalType": "bytes",   "name": "signature",  "type": "bytes" }
        ],
        "internalType": "struct InEuint32",
        "name": "balance",
        "type": "tuple"
      },
      {
        "components": [
          { "internalType": "uint256", "name": "ctHash",    "type": "uint256" },
          { "internalType": "bytes",   "name": "signature", "type": "bytes" }
        ],
        "internalType": "struct InEuint32",
        "name": "txFreq",
        "type": "tuple"
      },
      {
        "components": [
          { "internalType": "uint256", "name": "ctHash",    "type": "uint256" },
          { "internalType": "bytes",   "name": "signature", "type": "bytes" }
        ],
        "internalType": "struct InEuint32",
        "name": "repayment",
        "type": "tuple"
      },
      {
        "components": [
          { "internalType": "uint256", "name": "ctHash",    "type": "uint256" },
          { "internalType": "bytes",   "name": "signature", "type": "bytes" }
        ],
        "internalType": "struct InEuint32",
        "name": "debtRatio",
        "type": "tuple"
      }
    ],
    "name": "submitCreditData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMyScore",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "lender",    "type": "address" },
      { "internalType": "uint32",  "name": "threshold", "type": "uint32" }
    ],
    "name": "grantLenderApproval",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "lender", "type": "address" }],
    "name": "allowApprovalPublic",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "borrower",  "type": "address" },
      { "internalType": "address", "name": "lender",    "type": "address" },
      { "internalType": "uint32",  "name": "plaintext", "type": "uint32" },
      { "internalType": "bytes",   "name": "signature", "type": "bytes" }
    ],
    "name": "publishApprovalResult",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "borrower", "type": "address" }],
    "name": "getLenderApproval",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "borrower", "type": "address" },
      { "internalType": "address", "name": "lender",   "type": "address" }
    ],
    "name": "getRevealedApproval",
    "outputs": [{ "internalType": "bool", "name": "approved", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "hasData",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "dataUpdatedAt",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "borrower", "type": "address" },
      { "internalType": "address", "name": "lender",   "type": "address" }
    ],
    "name": "hasApprovalFor",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "borrower", "type": "address" },
      { "internalType": "address", "name": "lender",   "type": "address" }
    ],
    "name": "getApprovalThreshold",
    "outputs": [{ "internalType": "uint32", "name": "", "type": "uint32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "W_BALANCE",
    "outputs": [{ "internalType": "uint32", "name": "", "type": "uint32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "W_TX_FREQ",
    "outputs": [{ "internalType": "uint32", "name": "", "type": "uint32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "W_REPAYMENT",
    "outputs": [{ "internalType": "uint32", "name": "", "type": "uint32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "W_DEBT",
    "outputs": [{ "internalType": "uint32", "name": "", "type": "uint32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_SCORE",
    "outputs": [{ "internalType": "uint32", "name": "", "type": "uint32" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const
