// scripts/integrationTestSepolia.js
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔹 Running Sepolia Integration Test...");

  // Load addresses from your latest deployment
  const stableAddr = process.env.STABLE_ADDR;    // e.g. 0x123...
  const mockETHAddr = process.env.MOCKETH_ADDR;  // e.g. 0x456...
  const exchangeAddr = process.env.EXCHANGE_ADDR; // e.g. 0x789...

  if (!stableAddr || !mockETHAddr || !exchangeAddr) {
    throw new Error("❌ Please define STABLE_ADDR, MOCKETH_ADDR, and EXCHANGE_ADDR in .env");
  }

  const [deployer] = await ethers.getSigners();
  console.log("👤 Tester Address:", deployer.address);

  // Attach to existing contracts
  const Stable = await ethers.getContractFactory("MockERC20");
  const MockETH = await ethers.getContractFactory("MockERC20");
  const Exchange = await ethers.getContractFactory("CurrencyExchange");

  const stable = Stable.attach(stableAddr);
  const mockETH = MockETH.attach(mockETHAddr);
  const exchange = Exchange.attach(exchangeAddr);

  console.log("✅ Contracts Attached:");
  console.log("  StableCoin:", stable.address);
  console.log("  MockETH:", mockETH.address);
  console.log("  Exchange:", exchange.address);

  // --- Fetch live Chainlink price ---
  const oracleAddr = "0x694AA1769357215DE4FAC081bf1f309aDC325306"; // Sepolia ETH/USD
  const oracle = await ethers.getContractAt("AggregatorV3Interface", oracleAddr);
  const roundData = await oracle.latestRoundData();
  const ethPrice = Number(roundData.answer) / 1e8;

  console.log(`💹 Live Chainlink ETH/USD Price: ${ethPrice.toFixed(2)} USD`);

  // --- Print current balances ---
  const balStableUser = await stable.balanceOf(deployer.address);
  const balETHUser = await mockETH.balanceOf(deployer.address);
  const balStableEx = await stable.balanceOf(exchange.address);
  const balETHEx = await mockETH.balanceOf(exchange.address);

  console.log("\n===== Current Balances =====");
  console.log("User Stable (LMC):", ethers.utils.formatEther(balStableUser));
  console.log("User ETH:", ethers.utils.formatEther(balETHUser));
  console.log("Exchange Stable (LMC):", ethers.utils.formatEther(balStableEx));
  console.log("Exchange ETH:", ethers.utils.formatEther(balETHEx));
  console.log("============================\n");

  // --- Perform Swap: 1 ETH -> LMC ---
  const amountIn = ethers.utils.parseEther("1");
  console.log("🔓 Approving 1 ETH for swap...");
  await (await mockETH.approve(exchange.address, amountIn)).wait();

  // Compute expected output from oracle
  const decimals = 8; // Chainlink ETH/USD has 8 decimals
  const expectedLMC = amountIn.mul(roundData.answer).div(ethers.BigNumber.from("10").pow(decimals));

  console.log(`💰 Expected LMC for 1 ETH: ${ethers.utils.formatEther(expectedLMC)} (from oracle @ $${ethPrice.toFixed(2)})`);

  console.log("🔄 Swapping 1 ETH → LMC...");
  const tx = await exchange.swapCurrencyToStable("ETH", amountIn, { gasLimit: 300000 });
  const receipt = await tx.wait();
  console.log(`✅ Swap Complete (Gas used: ${receipt.gasUsed.toString()})`);

  // --- Print balances after swap ---
  const newStableUser = await stable.balanceOf(deployer.address);
  const newETHUser = await mockETH.balanceOf(deployer.address);

  const deltaStable = newStableUser.sub(balStableUser);
  const deltaETH = balETHUser.sub(newETHUser);

  console.log("\n===== After Swap =====");
  console.log("User Stable (LMC):", ethers.utils.formatEther(newStableUser));
  console.log("User ETH:", ethers.utils.formatEther(newETHUser));
  console.log("Δ Stable gained:", ethers.utils.formatEther(deltaStable));
  console.log("Δ ETH spent:", ethers.utils.formatEther(deltaETH));

  // Compare theoretical vs actual
  const diff = deltaStable.sub(expectedLMC);
  const pctError = diff.mul(10000).div(expectedLMC).toNumber() / 100; // in %
  console.log(`📊 Comparison: expected ${ethers.utils.formatEther(expectedLMC)} LMC, got ${ethers.utils.formatEther(deltaStable)} LMC`);
  console.log(`🔍 Difference: ${pctError}%`);
  console.log("\n🎯 Sepolia Integration Test Completed Successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Integration Test Failed:", error.message);
    process.exit(1);
  });