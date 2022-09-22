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
      POSEIDONT6_ADDRESS : "0x4D4d8D5b88D66CC370aCB18F2C501C0AFD2861Ce",
      INCREMENTALQUINTREE_ADDRESS : "0x9282bB470D26129001ab8F81e514D6FEFc1a3d4B",
      HUB_ADDRESS : "0xb77Af0558e1eC1Bb37849B102fef8d1DbB98dfb2",
      COUNTRYVERIFIER_ADDRESS : "0x35e827e957fa530b8dA884aeCd5e5f7bf6f25c38",
      RESSTORE_ADDRESS : "0xd49D9EB5B2425472232564159441e1399E606297"
    }
  );

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
