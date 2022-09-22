// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
// const hre = require("hardhat");


const { ethers } = require("hardhat");
const { createLeaf, createLeafAdditionProof, deployPoseidon, attachPoseidon } = require("../utils/utils");


// Initialize all smart contracts and return their addresses
// Can pass addresses like such:
// init({
//   POSEIDONT6_ADDRESS : "",
//   INCREMENTALQUINTREE_ADDRESS : "",
//   COUNTRYVERIFIER_ADDRESS : "",
//   RESSTORE_ADDRESS : "",
// })
async function init(addresses) {
  const {
      POSEIDONT6_ADDRESS,
      INCREMENTALQUINTREE_ADDRESS ,
      COUNTRYVERIFIER_ADDRESS,
      RESSTORE_ADDRESS,
  } = 
  {
      POSEIDONT6_ADDRESS : "",
      INCREMENTALQUINTREE_ADDRESS : "",
      COUNTRYVERIFIER_ADDRESS : "",
      RESSTORE_ADDRESS : "",
      ...addresses
  }
  

  const [admin] = await ethers.getSigners();
  const pt6 = POSEIDONT6_ADDRESS ? await attachPoseidon(POSEIDONT6_ADDRESS) : await deployPoseidon();
  
  const iqtFactory = await ethers.getContractFactory("IncrementalQuinTree", 
  {
      libraries : {
      PoseidonT6 : pt6.address
      }
  });

  const iqt = INCREMENTALQUINTREE_ADDRESS ? await iqtFactory.attach(INCREMENTALQUINTREE_ADDRESS) : await iqtFactory.deploy();
  const hub = await (await ethers.getContractFactory("Hub", {
    libraries : {
        IncrementalQuinTree : iqt.address
        } 
    })).deploy(admin.address);

  // await hub.deployed();

  const router = await (await ethers.getContractFactory("ProofRouter")).attach(await hub.router());

  const verifierFactory = await ethers.getContractFactory("ProofOfCountry");
  const verifier = COUNTRYVERIFIER_ADDRESS ? await verifierFactory.attach(COUNTRYVERIFIER_ADDRESS) : await verifierFactory.deploy();
  
  await router.addRoute("USResident", verifier.address);

  const resStoreFactory = await ethers.getContractFactory("ResidencyStore"); 
  const resStore = RESSTORE_ADDRESS ? await resStoreFactory.attach(RESSTORE_ADDRESS) : await (resStoreFactory).deploy(hub.address);
  
  const result = {
    pt6 : pt6, 
    iqt : iqt, 
    hub : hub, 
    router : router, 
    verifier : verifier, 
    resStore : resStore
  }
  // Log all contract addresses
  console.log("------------Contract addresses:------------");
  Object.keys(result).forEach((key) => console.log(key, result[key].address));
  console.log("-------------------------------------------");
  return result;
  
}

async function main() {
  await init();
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
