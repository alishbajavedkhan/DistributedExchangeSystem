// SPDX-License-Identifier: MIT
// File: scripts/testSwaps.js

/**
 * @title testSwaps.js
 * @notice Script to interact with deployed contracts on Sepolia.
 * It performs the following:
 *  1. Reads existing contract addresses from .env
 *  2. Fetches and prints initial balances
 *  3. Adds more stablecoin liquidity
 *  4. Executes a small swap (ETH → LMC)
 *  5. Prints updated balances
 *
 * Students must implement all steps marked with TODO.
 */

const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  // ==========================================================
  // 1. Setup and Contract Connections
  // ==========================================================
  const [deployer] = await ethers.getSigners();
  console.log("👤 Active Signer:", deployer.address);

  // TODO:
  // - Load contract addresses from your .env file:
  //   STABLE_ADDR, MOCKETH_ADDR, EXCHANGE_ADDR, ETH_USD_ORACLE
  // - Connect to deployed contracts using ethers.getContractAt():
  //   MockERC20 for stable and ETH tokens, CurrencyExchange for exchange.
  // - Print all contract addresses for confirmation.


  // ==========================================================
  // 2. Fetch Initial Balances
  // ==========================================================
  // TODO:
  // - Retrieve user and exchange balances for both StableCoin (LMC) and MockETH.
  // - Use ethers.utils.formatEther() to print values in readable format.
  // - Display them in a neat “Before Swap” section.


  // ==========================================================
  // 3. Add Additional StableCoin Liquidity
  // ==========================================================
  // TODO:
  // - Define a liquidity amount (e.g., 300,000 LMC)
  // - Approve the exchange contract to spend that amount
  // - Call exchange.addLiquidityStable(amount)
  // - Wait for the transaction to confirm
  // - Log a success message


  // ==========================================================
  // 4. Perform a Small Swap (ETH → LMC)
  // ==========================================================
  // TODO:
  // - Define a small ETH amount for swap (e.g., 0.01)
  // - Approve the exchange contract to spend ETH
  // - Call exchange.swapCurrencyToStable("ETH", amount)
  // - Wait for the transaction
  // - Print a success confirmation message


  // ==========================================================
  // 5. Fetch and Print Balances After Swaps
  // ==========================================================
  // TODO:
  // - Retrieve and print updated user and exchange balances
  // - Compare values before and after to verify swap impact
  // - Use ethers.utils.formatEther() for formatting
  // - Display them in an “After Swap” summary table


  console.log("✅ Swap Test Completed Successfully!");
}

// ==========================================================
// Error Handling
// ==========================================================
main().catch((error) => {
  console.error("❌ Test Swaps Script Failed:", error);
  process.exitCode = 1;
});