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
      // POSEIDONT6_ADDRESS : "0x79e0Eae268eE28C38d9E2cfd58bd5F0a17043b3c",
      // INCREMENTALQUINTREE_ADDRESS : "0x8F0ee45c78E658526dD19bBAdEC2602f56ff26E6",
      // HUB_ADDRESS : "0x3De3A402E7dD76A03158312115d78a7174443d54",
      // COUNTRYVERIFIER_ADDRESS : "0x1E7F1F44B73C5dF613C44ac32A64DB1fED7f2341",
      // RESSTORE_ADDRESS : "0x1A5f8D110Fa053543184aF404e344a85f5BC6335",
      // ANTISYBILVERIFIER_ADDRESS : "0xe4D027CA76c23b9C298b8c47710bFF62C8992b9D",
      // ANTISYBIL_ADDRESS : "0xBA8a4C5c1f36Dc802d51FEEfF3aa4ef97Dae4B10",
    }
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
