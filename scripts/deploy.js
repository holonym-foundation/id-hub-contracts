// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
// const hre = require("hardhat");


const { ethers } = require("hardhat");
const { initContracts } = require("../utils/utils");

async function main() {
  // Leave these address blank if you want to redeploy them.
  const contracts = await initContracts(
    {
      POSEIDONT6_ADDRESS : "0xdF10310d2C72F5358b19bF6A7C817Ec4570b270f",
      INCREMENTALQUINTREE_ADDRESS : "0x56A14Abe1DF94aF0dE78AEF3BD96ae9928D3b415",
      HUB_ADDRESS : "0x6A78dF871291627C5470F7a768745C3ff05741F2",
      COUNTRYVERIFIER_ADDRESS : "0x3497556f7D0bF602D4237Ecb8ae92840D09E4f63",
      RESSTORE_ADDRESS : "0x42D6007317CED2281a64aCc052cE57e3d92bf912",
      ANTISYBILVERIFIER_ADDRESS : "0xabcdef",
      ANTISYBIL_ADDRESS : "",
    }
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
