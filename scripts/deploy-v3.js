// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
// const hre = require("hardhat");

// const { initContracts, deployPoseidon } = require("../utils/utils");
const { ethers } = require("hardhat");

// const constants = {
//   ISSUER_ADDRESSES : ["0xC8834C1FcF0Df6623Fc8C8eD25064A4148D99388", "0x03fae82f38bf01d9799d57fdda64fad4ac44e4c2c2f16c5bf8e1873d0a3e1993"],
//   MEDICAL_CREDENTIALS_ISSUER_ADDRESS: '0x198c8c83f3e3dfab87ce363bcc2e5587dcda7dfcf56d24fc0bfa5c82454812ba',
//   LEGACY_USRESIDENCY_CONTRACT : "0x6A78dF871291627C5470F7a768745C3ff05741F2", // OPTIMISM MAINNET
//   LEGACY_SYBILRESISTANCE_CONTRACT : "0x3497556f7D0bF602D4237Ecb8ae92840D09E4f63", // OPTIMISM MAINNET
  
// }


async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Signer address", signer.address);
  const hub = await (await ethers.getContractFactory("Hub")).deploy("0x656d1dfb96dbd7620de0e73fb16d2b169bb8da01");
  await hub.transferOwnership("0xbe20d0A27B79BA2E53c9DF150BadAa21D4783D42");
  console.log("Hub is deployed: " + hub.address);
  console.log("Contract owner: " + await hub.owner());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
