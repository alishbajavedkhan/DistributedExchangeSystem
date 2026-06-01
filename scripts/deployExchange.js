// SPDX-License-Identifier: MIT
// File: scripts/deployExchange.js

/**
 * @title Deployment Script - CurrencyExchange System
 * @notice This script deploys all core contracts for the CS3812 Stablecoin assignment.
 * 
 * Students must implement each deployment step marked with a TODO.
 * The order of operations is critical: deploy tokens → deploy exchange → register oracle → add liquidity.
 */

const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  // ==========================================================
  // 1. Setup
  // ==========================================================
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer Address:", deployer.address);

  // ==========================================================
  // 2. Deploy StableCoin (LUMSCoin)
  // ==========================================================
  const initialSupply = ethers.utils.parseEther("1000000"); // 1 million tokens
  
  const StableCoinFactory = await ethers.getContractFactory("StableCoin");
  const stableCoin = await StableCoinFactory.deploy(initialSupply);
  await stableCoin.deployed();
  console.log("StableCoin deployed at:", stableCoin.address);


  // ==========================================================
  // 3. Deploy MockETH
  // ==========================================================
  const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  const mockETH = await MockERC20Factory.deploy("Mock ETH", "ETH", initialSupply);
  await mockETH.deployed();
  console.log("MockETH deployed at:", mockETH.address);


  // ==========================================================
  // 4. Deploy CurrencyExchange
  // ==========================================================
  const CurrencyExchangeFactory = await ethers.getContractFactory("CurrencyExchange");
  const exchange = await CurrencyExchangeFactory.deploy(stableCoin.address);
  await exchange.deployed();
  console.log("CurrencyExchange deployed at:", exchange.address);


  // ==========================================================
  // 5. Register ETH with Chainlink Oracle
  // ==========================================================
  const ETH_USD_ORACLE = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
  const addCurrencyTx = await exchange.addCurrency("ETH", mockETH.address, ETH_USD_ORACLE);
  await addCurrencyTx.wait();
  console.log("Registered ETH with oracle:", ETH_USD_ORACLE);


  // ==========================================================
  // 6. Mint Additional Tokens for Deployer
  // ==========================================================
  const additionalSupply = ethers.utils.parseEther("1000000"); // 1 million tokens
  
  const mintStableTx = await stableCoin.mint(deployer.address, additionalSupply);
  await mintStableTx.wait();
  
  const mintETHTx = await mockETH.mint(deployer.address, additionalSupply);
  await mintETHTx.wait();
  
  console.log("Minted additional tokens for deployer");


  // ==========================================================
  // 7. Approve and Add Liquidity
  // ==========================================================
  const liquidityAmount = ethers.utils.parseEther("500000"); // 500,000 tokens
  
  // Approve StableCoin
  const approveStableTx = await stableCoin.approve(exchange.address, liquidityAmount);
  await approveStableTx.wait();
  
  // Approve MockETH
  const approveETHTx = await mockETH.approve(exchange.address, liquidityAmount);
  await approveETHTx.wait();
  
  // Add StableCoin liquidity
  const addStableLiquidityTx = await exchange.addLiquidityStable(liquidityAmount);
  await addStableLiquidityTx.wait();
  
  // Add MockETH liquidity
  const addETHLiquidityTx = await exchange.addLiquidity("ETH", liquidityAmount);
  await addETHLiquidityTx.wait();
  
  console.log("Liquidity added successfully");


  // ==========================================================
  // 8. Print Final Balances
  // ==========================================================
  const exchangeStableBalance = await exchange.stableBalance();
  const exchangeETHBalance = await exchange.balanceOf("ETH");
  
  console.log("Exchange Stable:", ethers.utils.formatEther(exchangeStableBalance));
  console.log("Exchange ETH:", ethers.utils.formatEther(exchangeETHBalance));

  console.log("✅ Deployment Completed Successfully!");
}

main().catch((error) => {
  console.error("❌ Deployment Failed:", error);
  process.exitCode = 1;
});

