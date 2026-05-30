"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ARB_SEPOLIA_CHAIN_ID: () => ARB_SEPOLIA_CHAIN_ID,
  BASE_RATE_BPS: () => BASE_RATE_BPS,
  BASE_SEPOLIA_CHAIN_ID: () => BASE_SEPOLIA_CHAIN_ID,
  CHAIN_CONFIGS: () => CHAIN_CONFIGS,
  CREDIT_TIERS: () => CREDIT_TIERS,
  CipherCreditClient: () => CipherCreditClient,
  CreditScoreRegistryABI: () => CreditScoreRegistryABI,
  CreditTierNFTABI: () => CreditTierNFTABI,
  LendingPoolABI: () => LendingPoolABI,
  MAX_SCORE: () => MAX_SCORE,
  MIN_CREDIT_THRESHOLD: () => MIN_CREDIT_THRESHOLD,
  MIN_RATE_BPS: () => MIN_RATE_BPS,
  W_BALANCE: () => W_BALANCE,
  W_DEBT: () => W_DEBT,
  W_REPAYMENT: () => W_REPAYMENT,
  W_TX_FREQ: () => W_TX_FREQ,
  bpsToApr: () => bpsToApr,
  fetchWalletSignals: () => fetchWalletSignals,
  formatBps: () => formatBps,
  formatEthShort: () => formatEthShort,
  formatTierMultiplier: () => formatTierMultiplier,
  previewRate: () => previewRate,
  previewScore: () => previewScore
});
module.exports = __toCommonJS(index_exports);

// src/abis/CreditScoreRegistry.ts
var CreditScoreRegistryABI = [
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "got",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "expected",
        "type": "uint8"
      }
    ],
    "name": "InvalidEncryptedInput",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "int32",
        "name": "value",
        "type": "int32"
      }
    ],
    "name": "SecurityZoneOutOfBounds",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "CreditDataSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "lender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "threshold",
        "type": "uint32"
      }
    ],
    "name": "LenderApprovalGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      }
    ],
    "name": "PersonalRateComputed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "rateBps",
        "type": "uint32"
      }
    ],
    "name": "PersonalRateRevealed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      }
    ],
    "name": "ScoreComputed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BASE_RATE_BPS",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "BASE_RATE_SCALED",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "DISCOUNT_NUM",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_SCORE",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_CREDIT_THRESHOLD",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_RATE_BPS",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "RATE_SCALE",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "W_BALANCE",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "W_DEBT",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "W_REPAYMENT",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "W_TX_FREQ",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "lender",
        "type": "address"
      }
    ],
    "name": "allowApprovalPublic",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "allowRatePublic",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "computePersonalRate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "dataUpdatedAt",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "lender",
        "type": "address"
      }
    ],
    "name": "getApprovalThreshold",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      }
    ],
    "name": "getLenderApproval",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMyRateHandle",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMyScore",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "lender",
        "type": "address"
      }
    ],
    "name": "getRevealedApproval",
    "outputs": [
      {
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      }
    ],
    "name": "getRevealedRate",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "lender",
        "type": "address"
      },
      {
        "internalType": "uint32",
        "name": "threshold",
        "type": "uint32"
      }
    ],
    "name": "grantLenderApproval",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "lender",
        "type": "address"
      }
    ],
    "name": "hasApprovalFor",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "hasData",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      }
    ],
    "name": "isRateRevealed",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "lender",
        "type": "address"
      },
      {
        "internalType": "uint32",
        "name": "plaintext",
        "type": "uint32"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "publishApprovalResult",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "rateBps",
        "type": "uint32"
      }
    ],
    "name": "setPersonalRateDirect",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "ctHash",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "securityZone",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "utype",
            "type": "uint8"
          },
          {
            "internalType": "bytes",
            "name": "signature",
            "type": "bytes"
          }
        ],
        "internalType": "struct InEuint32",
        "name": "balance",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "ctHash",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "securityZone",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "utype",
            "type": "uint8"
          },
          {
            "internalType": "bytes",
            "name": "signature",
            "type": "bytes"
          }
        ],
        "internalType": "struct InEuint32",
        "name": "txFreq",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "ctHash",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "securityZone",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "utype",
            "type": "uint8"
          },
          {
            "internalType": "bytes",
            "name": "signature",
            "type": "bytes"
          }
        ],
        "internalType": "struct InEuint32",
        "name": "repayment",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "ctHash",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "securityZone",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "utype",
            "type": "uint8"
          },
          {
            "internalType": "bytes",
            "name": "signature",
            "type": "bytes"
          }
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
    "name": "syncRateFromOracle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// src/abis/LendingPool.ts
var LendingPoolABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_registry",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_nft",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "provider",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Deposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "principal",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "creditApproved",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "collateral",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "interestRateBps",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "dueDate",
        "type": "uint256"
      }
    ],
    "name": "LoanIssued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "liquidator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "collateral",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "deficit",
        "type": "uint256"
      }
    ],
    "name": "LoanLiquidated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "principal",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "interest",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newRepaymentCount",
        "type": "uint256"
      }
    ],
    "name": "LoanRepaid",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "provider",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Withdrawn",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BASE_LIMIT_BPS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "BASE_RATE_BPS",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "CREDIT_RATIO",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "LIQUIDATOR_BOUNTY",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "LOAN_DURATION",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_CREDIT_THRESHOLD",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "STANDARD_RATIO",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "availableLiquidity",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "principal",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "useCredit",
        "type": "bool"
      }
    ],
    "name": "collateralRequired",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "defaultCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      }
    ],
    "name": "getAccruedInterest",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      }
    ],
    "name": "liquidate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "loans",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "principal",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "collateral",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "creditApproved",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "active",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "issuedAt",
        "type": "uint256"
      },
      {
        "internalType": "uint32",
        "name": "interestRateBps",
        "type": "uint32"
      },
      {
        "internalType": "uint256",
        "name": "dueDate",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      }
    ],
    "name": "maxBorrowable",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nft",
    "outputs": [
      {
        "internalType": "contract CreditTierNFT",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "poolBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "providerDeposits",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "registry",
    "outputs": [
      {
        "internalType": "contract CreditScoreRegistry",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "repayLoan",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "repaymentCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "principal",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "useCredit",
        "type": "bool"
      }
    ],
    "name": "requestLoan",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalBorrowed",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalDeposited",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      }
    ],
    "name": "totalRepaymentDue",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

// src/abis/CreditTierNFT.ts
var CreditTierNFTABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_registry",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "holder",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum CreditTierNFT.Tier",
        "name": "tier",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "TierMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "holder",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum CreditTierNFT.Tier",
        "name": "oldTier",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "enum CreditTierNFT.Tier",
        "name": "newTier",
        "type": "uint8"
      }
    ],
    "name": "TierUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BASE_RATE_BPS",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "GOLD_RATE_CEIL",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SILVER_RATE_CEIL",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "holder",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "holder",
        "type": "address"
      }
    ],
    "name": "getTier",
    "outputs": [
      {
        "internalType": "enum CreditTierNFT.Tier",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "holder",
        "type": "address"
      }
    ],
    "name": "getTierName",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasMinted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mintOrUpdateTier",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "registry",
    "outputs": [
      {
        "internalType": "contract CreditScoreRegistry",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "tiers",
    "outputs": [
      {
        "internalType": "enum CreditTierNFT.Tier",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "tokenURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalMinted",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "pure",
    "type": "function"
  }
];

// src/constants.ts
var ARB_SEPOLIA_CHAIN_ID = 421614;
var BASE_SEPOLIA_CHAIN_ID = 84532;
var CHAIN_CONFIGS = {
  [ARB_SEPOLIA_CHAIN_ID]: {
    chainId: ARB_SEPOLIA_CHAIN_ID,
    name: "Arbitrum Sepolia",
    registry: "0x5251f7e0890d02001cFeD2191924922D285579F1",
    pool: "0xD49e2362B08a65C5B8eB77bEdD153E60D8Bceda8",
    nft: "0x02ABEC33b433f8370b24b55f4caA6412E3D4E0B3"
  }
};
var CREDIT_TIERS = {
  0: { index: 0, name: "None", multiplier: 1, rateCeilBps: 0 },
  1: { index: 1, name: "Bronze", multiplier: 1.25, rateCeilBps: 1499 },
  2: { index: 2, name: "Silver", multiplier: 1.5, rateCeilBps: 1383 },
  3: { index: 3, name: "Gold", multiplier: 2, rateCeilBps: 1033 }
};
var MIN_CREDIT_THRESHOLD = 7e3;
var BASE_RATE_BPS = 1500;
var MIN_RATE_BPS = 800;
var MAX_SCORE = 1e4;
var W_BALANCE = 25;
var W_TX_FREQ = 20;
var W_REPAYMENT = 40;
var W_DEBT = 15;

// src/utils/signals.ts
var import_viem = require("viem");
var BALANCE_CEIL_ETH = 5;
var TX_COUNT_CEIL = 200;
var REPAY_CEIL = 5;
function clamp(v, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}
function previewScore(inputs) {
  return inputs.balance * W_BALANCE + inputs.txFreq * W_TX_FREQ + inputs.repayment * W_REPAYMENT + (100 - inputs.debtRatio) * W_DEBT;
}
function previewRate(inputs) {
  const score = previewScore(inputs);
  if (score < MIN_CREDIT_THRESHOLD) return BASE_RATE_BPS;
  const raw = Math.round((45e3 - (score - MIN_CREDIT_THRESHOLD) * 7) / 30);
  return Math.max(MIN_RATE_BPS, Math.min(BASE_RATE_BPS - 1, raw));
}
async function fetchWalletSignals(publicClient, config, borrower) {
  const [balance, txCount, loanRaw, repayCountRaw, defaultCountRaw] = await Promise.all([
    publicClient.getBalance({ address: borrower }),
    publicClient.getTransactionCount({ address: borrower }),
    publicClient.readContract({
      address: config.pool,
      abi: LendingPoolABI,
      functionName: "loans",
      args: [borrower]
    }).catch(() => null),
    publicClient.readContract({
      address: config.pool,
      abi: LendingPoolABI,
      functionName: "repaymentCount",
      args: [borrower]
    }).catch(() => 0n),
    publicClient.readContract({
      address: config.pool,
      abi: LendingPoolABI,
      functionName: "defaultCount",
      args: [borrower]
    }).catch(() => 0n)
  ]);
  const balanceEth = parseFloat((0, import_viem.formatEther)(balance));
  const repayments = Number(repayCountRaw);
  const defaults = Number(defaultCountRaw);
  const hasActiveLoan = loanRaw ? !!loanRaw[3] : false;
  const balanceScore = clamp(Math.round(balanceEth / BALANCE_CEIL_ETH * 100));
  const txScore = clamp(Math.round(txCount / TX_COUNT_CEIL * 100));
  const repayScore = clamp(Math.round(repayments / REPAY_CEIL * 100));
  const debtPenalty = Math.min(defaults * 10, 30);
  const debtRatio = hasActiveLoan ? clamp(50 + Math.round((1 - balanceEth / BALANCE_CEIL_ETH) * 30) + debtPenalty) : clamp(Math.round(Math.max(0, 20 - balanceScore / 10)) + debtPenalty);
  const inputs = {
    balance: balanceScore,
    txFreq: txScore,
    repayment: repayScore,
    debtRatio
  };
  const score = previewScore(inputs);
  return {
    ...inputs,
    balanceEth,
    txCount,
    repayments,
    defaults,
    hasActiveLoan,
    previewScore: score,
    meetsThreshold: score >= MIN_CREDIT_THRESHOLD,
    estimatedRateBps: previewRate(inputs)
  };
}

// src/client.ts
var CipherCreditClient = class {
  // viem PublicClient — typed loosely to avoid hard dep
  constructor({ publicClient, chainId }) {
    this.pub = publicClient;
    const id = chainId ?? publicClient.chain?.id;
    if (!id) throw new Error("[CipherCredit] chainId required \u2014 pass it explicitly or attach it to your PublicClient");
    const cfg = CHAIN_CONFIGS[id];
    if (!cfg) {
      const supported = Object.keys(CHAIN_CONFIGS).join(", ");
      throw new Error(`[CipherCredit] unsupported chain ${id}. Supported chain IDs: ${supported}`);
    }
    this.config = cfg;
  }
  //  Credit verification 
  /** True if `borrower` has submitted credit data to the registry. */
  hasData(borrower) {
    return this.read("registry", CreditScoreRegistryABI, "hasData", [borrower]);
  }
  /** Unix timestamp of the borrower's most recent credit data submission. */
  dataUpdatedAt(borrower) {
    return this.read("registry", CreditScoreRegistryABI, "dataUpdatedAt", [borrower]);
  }
  /** True if the borrower has granted `pool` a credit approval (pass/fail only). */
  isApproved(borrower, pool) {
    return this.read("registry", CreditScoreRegistryABI, "hasApprovalFor", [borrower, pool]);
  }
  /** True if the borrower's personal interest rate has been revealed on-chain. */
  isRateRevealed(borrower) {
    return this.read("registry", CreditScoreRegistryABI, "isRateRevealed", [borrower]);
  }
  /**
   * Returns the borrower's personal rate in basis points (e.g. 1200 = 12.00 % APR),
   * or `null` if the rate has not been revealed yet.
   */
  async getPersonalRate(borrower) {
    const revealed = await this.isRateRevealed(borrower);
    if (!revealed) return null;
    return Number(await this.read("registry", CreditScoreRegistryABI, "getRevealedRate", [borrower]));
  }
  //  Credit tier 
  /** Returns the full tier info for the borrower's soul-bound CreditTierNFT. */
  async getTier(borrower) {
    const idx = Number(
      await this.read("nft", CreditTierNFTABI, "getTier", [borrower])
    );
    return CREDIT_TIERS[idx] ?? CREDIT_TIERS[0];
  }
  /** True if the borrower holds a CreditTierNFT (any tier). */
  hasMinted(borrower) {
    return this.read("nft", CreditTierNFTABI, "hasMinted", [borrower]);
  }
  /**
   * Gate access by minimum credit tier.
   * @example
   *   if (await sdk.hasMinTier(user, 'Silver')) { ... }
   */
  async hasMinTier(borrower, minTier) {
    const TIER_ORDER = { None: 0, Bronze: 1, Silver: 2, Gold: 3 };
    const tier = await this.getTier(borrower);
    return TIER_ORDER[tier.name] >= TIER_ORDER[minTier];
  }
  //  Loan state ─
  /**
   * Returns the active loan for `borrower`, or `null` if none exists.
   * Includes `isOverdue` — true once `dueDate` has passed.
   */
  async getLoan(borrower) {
    const raw = await this.read("pool", LendingPoolABI, "loans", [borrower]);
    if (!raw[3]) return null;
    const dueDate = new Date(Number(raw[6]) * 1e3);
    return {
      principal: raw[0],
      collateral: raw[1],
      creditApproved: raw[2],
      issuedAt: new Date(Number(raw[4]) * 1e3),
      interestRateBps: Number(raw[5]),
      dueDate,
      isOverdue: Date.now() > dueDate.getTime()
    };
  }
  /**
   * Maximum ETH the borrower may borrow right now.
   * Scales with their NFT tier: Gold 2×, Silver 1.5×, Bronze 1.25× the base limit.
   */
  getMaxBorrowable(borrower) {
    return this.read("pool", LendingPoolABI, "maxBorrowable", [borrower]);
  }
  /** Accrued interest on an active loan (wei). */
  getAccruedInterest(borrower) {
    return this.read("pool", LendingPoolABI, "getAccruedInterest", [borrower]);
  }
  /** Total repayment amount due right now (principal + interest, in wei). */
  totalRepaymentDue(borrower) {
    return this.read("pool", LendingPoolABI, "totalRepaymentDue", [borrower]);
  }
  //  Repayment history 
  /**
   * On-chain repayment and default counters for `borrower`.
   * `healthScore` (0–100) is derived from the ratio of repayments to defaults.
   */
  async getRepaymentStats(borrower) {
    const [repaymentCount, defaultCount] = await Promise.all([
      this.read("pool", LendingPoolABI, "repaymentCount", [borrower]),
      this.read("pool", LendingPoolABI, "defaultCount", [borrower])
    ]);
    const rc = Number(repaymentCount);
    const dc = Number(defaultCount);
    return { repaymentCount: rc, defaultCount: dc, healthScore: healthScore(rc, dc) };
  }
  //  Pool stats ─
  async getPoolStats() {
    const [liquidity, totalBorrowed, totalDeposited] = await Promise.all([
      this.read("pool", LendingPoolABI, "availableLiquidity", []),
      this.read("pool", LendingPoolABI, "totalBorrowed", []),
      this.read("pool", LendingPoolABI, "totalDeposited", [])
    ]);
    return { liquidity, totalBorrowed, totalDeposited };
  }
  //  Signals & score preview 
  /**
   * Fetch normalised credit signals from the chain for `borrower`.
   * Returns raw wallet metrics alongside the FHE score preview and estimated rate.
   * No CoFHE dependency — pure on-chain reads.
   */
  fetchSignals(borrower) {
    return fetchWalletSignals(this.pub, this.config, borrower);
  }
  /** Preview credit score from normalised inputs (0–10 000). No RPC call. */
  previewScore(inputs) {
    return previewScore(inputs);
  }
  /** Preview interest rate (bps) from normalised inputs. No RPC call. */
  previewRate(inputs) {
    return previewRate(inputs);
  }
  //  Full borrower profile 
  /**
   * Single call that aggregates all on-chain data for a borrower.
   * Pass `pool` to also check approval status for that pool.
   */
  async getBorrowerProfile(borrower, pool) {
    const [tier, stats, loan, maxBorrowable, rate, data] = await Promise.all([
      this.getTier(borrower),
      this.getRepaymentStats(borrower),
      this.getLoan(borrower),
      this.getMaxBorrowable(borrower),
      this.getPersonalRate(borrower),
      this.hasData(borrower)
    ]);
    const profile = {
      address: borrower,
      tier,
      repaymentStats: stats,
      activeLoan: loan,
      maxBorrowable,
      personalRateBps: rate,
      hasData: data
    };
    if (pool) {
      profile.isApproved = await this.isApproved(borrower, pool);
    }
    return profile;
  }
  //  Private helpers 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  read(contract, abi, functionName, args) {
    return this.pub.readContract({
      address: this.config[contract],
      abi,
      functionName,
      args
    });
  }
};
function healthScore(repayments, defaults) {
  if (repayments === 0 && defaults === 0) return 50;
  const bonus = Math.min(repayments * 10, 70);
  const penalty = Math.min(defaults * 20, 60);
  return Math.max(0, Math.min(100, 50 + bonus - penalty));
}

// src/utils/format.ts
function formatBps(bps) {
  return `${(bps / 100).toFixed(2)}%`;
}
function bpsToApr(bps) {
  return bps / 100;
}
function formatEthShort(wei, decimals = 6) {
  const eth = Number(wei) / 1e18;
  const str = eth.toFixed(decimals).replace(/\.?0+$/, "");
  return `${str} ETH`;
}
function formatTierMultiplier(multiplier) {
  return `${multiplier}\xD7`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ARB_SEPOLIA_CHAIN_ID,
  BASE_RATE_BPS,
  BASE_SEPOLIA_CHAIN_ID,
  CHAIN_CONFIGS,
  CREDIT_TIERS,
  CipherCreditClient,
  CreditScoreRegistryABI,
  CreditTierNFTABI,
  LendingPoolABI,
  MAX_SCORE,
  MIN_CREDIT_THRESHOLD,
  MIN_RATE_BPS,
  W_BALANCE,
  W_DEBT,
  W_REPAYMENT,
  W_TX_FREQ,
  bpsToApr,
  fetchWalletSignals,
  formatBps,
  formatEthShort,
  formatTierMultiplier,
  previewRate,
  previewScore
});
