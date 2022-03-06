/**
 * @type import('hardhat/config').HardhatUserConfig
 */
// для подтягивания конфигурации process.env......
require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require('@openzeppelin/hardhat-upgrades');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// npx hardhat claim  --contract 0x61b08Db0d2559cFE85fae3bA5C9998Ed066A8e4b  --network rinkeby
// Функция claim() - списывает с контракта стейкинга ревард токены доступные в качестве наград
task("claim", "Claim reward MEGA(ERC20) tokens")
  .addParam("contract", "address of deployed staking contract")
  .setAction(async (taskArgs, hre) => {
    const Staking = await hre.ethers.getContractAt("Staking", taskArgs.contract)
    const tx = await Staking.claim()
    tx.wait()
  })

// npx hardhat stake  --contract 0x61b08Db0d2559cFE85fae3bA5C9998Ed066A8e4b --value 555  --network rinkeby
// Функция stake(uint256 amount) - списывает с пользователя на контракт стейкинга ЛП токены в количестве amount, обновляет в контракте баланс пользователя
task("stake", "stake UniswapV2(UNI-V2) tokens")
  .addParam("contract", "address of deployed staking contract")
  .addParam("value", "amount tokens to stake")
  .setAction(async (taskArgs, hre) => {
    const Staking = await hre.ethers.getContractAt("Staking", taskArgs.contract)
    const tx_stake = await Staking.stake(taskArgs.value)
    tx_stake.wait()
    console.log("You have " + (await Staking.getMyStakeValue()) + " lpTokens in staking")
  })

 // npx hardhat unstake  --contract 0x61b08Db0d2559cFE85fae3bA5C9998Ed066A8e4b  --network rinkeby
 // Функция unstake() - списывает с контракта стейкинга ЛП токены доступные для вывода
task("unstake", "Unstake and get reward MEGA(ERC20) tokens")
  .addParam("contract", "address of deployed staking contract")
  .setAction(async (taskArgs, hre) => {
    const Staking = await hre.ethers.getContractAt("Staking", taskArgs.contract)
    await Staking.unstake()
  })

task("getstakevalue", "Get stake amount")
  .addParam("contract", "address of deployed staking contract")
  .setAction(async (taskArgs, hre) => {
    const Staking = await hre.ethers.getContractAt("Staking", taskArgs.contract)
    const tx = await Staking.getMyStakeValue()
    console.log(tx.toString())
  })






// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.RINKEBY_PRIVATE_KEY]
    }
  },
  etherscan: {
    // Ваш ключ API для Etherscan 
    // Получите его на https://etherscan.io/ 
    apiKey: `${process.env.ETHERSCAN_KEY}`
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};
