// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract CurrencyExchange {
    IERC20 public stableCoin; // e.g. LMC

    // State variables
    mapping(string => IERC20) public currencies;
    mapping(string => AggregatorV3Interface) public oracles;
    mapping(string => uint256) public liquidity; // Track liquidity for each currency

    // Events
    event Swap(address user, string pair, uint256 inAmt, uint256 outAmt);
    event LiquidityAdded(address user, string symbol, uint256 amount);
    event Debug(string msg, uint256 val);

    constructor(address _stableCoin) {
        stableCoin = IERC20(_stableCoin);
    }

    // Register currency + oracle
    function addCurrency(string memory symbol, address token, address oracle) external {
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(token != address(0), "Invalid token address");
        require(oracle != address(0), "Invalid oracle address");
        
        currencies[symbol] = IERC20(token);
        oracles[symbol] = AggregatorV3Interface(oracle);
    }

    // View balances
    function balanceOf(string memory symbol) external view returns (uint256) {
        require(address(currencies[symbol]) != address(0), "Currency not registered");
        return currencies[symbol].balanceOf(address(this));
    }

    function stableBalance() external view returns (uint256) {
        return stableCoin.balanceOf(address(this));
    }

    // Add liquidity in stable
    function addLiquidityStable(uint256 amount) external {
        require(stableCoin.transferFrom(msg.sender, address(this), amount), "Stable transfer failed");
        liquidity["LMC"] += amount;
        emit LiquidityAdded(msg.sender, "LMC", amount);
    }

    // Add liquidity in any token
    function addLiquidity(string memory symbol, uint256 amount) external {
        require(address(currencies[symbol]) != address(0), "Currency not registered");
        require(currencies[symbol].transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        liquidity[symbol] += amount;
        emit LiquidityAdded(msg.sender, symbol, amount);
    }

    // Swap LMC -> Token
    function swapStableToCurrency(string memory symbol, uint256 amount) external {
        require(address(currencies[symbol]) != address(0), "Currency not registered");
        require(stableCoin.transferFrom(msg.sender, address(this), amount), "Stable transfer failed");
        
        // Fetch oracle price
        AggregatorV3Interface oracle = oracles[symbol];
        (, int256 price, , , ) = oracle.latestRoundData();
        require(price > 0, "Invalid price");
        
        uint8 oracleDecimals = oracle.decimals();
        uint256 outputAmount = (amount * (10 ** oracleDecimals)) / uint256(price);
        
        uint256 availableBalance = currencies[symbol].balanceOf(address(this));
        require(availableBalance >= outputAmount, "Not enough liquidity");
        
        require(currencies[symbol].transfer(msg.sender, outputAmount), "Token transfer failed");
        
        string memory pair = string(abi.encodePacked("LMC->", symbol));
        emit Swap(msg.sender, pair, amount, outputAmount);
    }

    // Swap Token -> LMC
    function swapCurrencyToStable(string memory symbol, uint256 amount) external {
        require(address(currencies[symbol]) != address(0), "Currency not registered");
        require(currencies[symbol].transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        
        // Fetch oracle price
        AggregatorV3Interface oracle = oracles[symbol];
        (, int256 price, , , ) = oracle.latestRoundData();
        require(price > 0, "Invalid price");
        
        uint8 oracleDecimals = oracle.decimals();
        uint256 outputAmount = (amount * uint256(price)) / (10 ** oracleDecimals);
        
        uint256 availableStable = stableCoin.balanceOf(address(this));
        require(availableStable >= outputAmount, "Not enough liquidity");
        
        require(stableCoin.transfer(msg.sender, outputAmount), "Stable transfer failed");
        
        string memory pair = string(abi.encodePacked(symbol, "->LMC"));
        emit Swap(msg.sender, pair, amount, outputAmount);
    }
}
