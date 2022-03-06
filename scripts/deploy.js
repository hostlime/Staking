// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const UniswapV2Pair = '0x597974e59862fc896d1b66c5c478ad4161fb0fb4'; // Uniswap V2 (UNI-V2) https://rinkeby.etherscan.io/address/0x597974e59862fc896d1b66c5c478ad4161fb0fb4
  const myToken       = '0xefdb0b230c136b567bd7b4a5448875b3a68f47aa'; // MegaToken (MEGA) https://rinkeby.etherscan.io/address/0xefdb0b230c136b567bd7b4a5448875b3a68f47aa
  
  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(
    UniswapV2Pair, 
    myToken);

  await staking.deployed();

  console.log(" deployed to:", staking.address);

 // await hre.run("verify", {
 //   address: staking.address,
 //   constructorArgs: [UniswapV2Pair, myToken]
 // })
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
