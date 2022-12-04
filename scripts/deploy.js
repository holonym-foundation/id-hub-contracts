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
      POSEIDONT6_ADDRESS : "0x34b8C2476B8a57071827F48b430F6571c10bdF48",
      INCREMENTALQUINTREE_ADDRESS : "0x4D4d8D5b88D66CC370aCB18F2C501C0AFD2861Ce",
      HUB_ADDRESS : "0x9282bB470D26129001ab8F81e514D6FEFc1a3d4B",
      COUNTRYVERIFIER_ADDRESS : "0x1ecE5Ae0aD8eC8669a2d05cEE776c857703Cf062",
      RESSTORE_ADDRESS : "0xF0Ff2EF6fe5257c0b8C8a420F74ad996202413F1",
      ANTISYBILVERIFIER_ADDRESS : "0xd49D9EB5B2425472232564159441e1399E606297",
      ANTISYBIL_ADDRESS : "0x6D58707dB4D2f0B6094AE5Ea58B59A3C075D2071",
    }
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
