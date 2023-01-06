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
    // optimism goerli
    {
      // POSEIDONT6_ADDRESS : "0x79e0Eae268eE28C38d9E2cfd58bd5F0a17043b3c",
      // INCREMENTALQUINTREE_ADDRESS : "0x8F0ee45c78E658526dD19bBAdEC2602f56ff26E6",
      // HUB_ADDRESS : "0x3De3A402E7dD76A03158312115d78a7174443d54",
      // COUNTRYVERIFIER_ADDRESS : "0x1E7F1F44B73C5dF613C44ac32A64DB1fED7f2341",
      // RESSTORE_ADDRESS : "0x1A5f8D110Fa053543184aF404e344a85f5BC6335",
      // ANTISYBILVERIFIER_ADDRESS : "0xe4D027CA76c23b9C298b8c47710bFF62C8992b9D",
      // ANTISYBIL_ADDRESS : "0xBA8a4C5c1f36Dc802d51FEEfF3aa4ef97Dae4B10",
    }
    // optimism mainnet
    // {
    //   POSEIDONT6_ADDRESS : "0xdF10310d2C72F5358b19bF6A7C817Ec4570b270f",
    //   INCREMENTALQUINTREE_ADDRESS : "0x56A14Abe1DF94aF0dE78AEF3BD96ae9928D3b415",
    //   HUB_ADDRESS : "0x87b6e03b0D57771940D7cC9E92531B6217364B3E",
    //   COUNTRYVERIFIER_ADDRESS : "0x78A0c21F9a24284c90AC7eba63c7396DB846A1df",
    //   RESSTORE_ADDRESS : "0x6A78dF871291627C5470F7a768745C3ff05741F2",
    //   ANTISYBILVERIFIER_ADDRESS : "0x01ff075517DC7dB43798751f22fEBDDa6EE75b9f",
    //   ANTISYBIL_ADDRESS : "0x3497556f7D0bF602D4237Ecb8ae92840D09E4f63",
    // }
    // BSC (mainnet)
    // {
    //   POSEIDONT6_ADDRESS : "0xdF10310d2C72F5358b19bF6A7C817Ec4570b270f",
    //   INCREMENTALQUINTREE_ADDRESS : "0x56A14Abe1DF94aF0dE78AEF3BD96ae9928D3b415",
    //   HUB_ADDRESS : "0x04A80a3d5F9fdBb8C31596630640C47E77c25FAc",
    //   COUNTRYVERIFIER_ADDRESS : "0x17d2e5606d2B420e44F05AFE2C7a0216aa23376a",
    //   RESSTORE_ADDRESS : "0x78A0c21F9a24284c90AC7eba63c7396DB846A1df",
    //   ANTISYBILVERIFIER_ADDRESS : "0x87b6e03b0D57771940D7cC9E92531B6217364B3E",
    //   ANTISYBIL_ADDRESS : "0x01ff075517DC7dB43798751f22fEBDDa6EE75b9f",
    // }
    
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
