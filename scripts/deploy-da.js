const { ethers } = require("hardhat");

async function main() {
    const da = await (await ethers.getContractFactory("DataAvail")).deploy();
    console.log("DataAvail deployed to:", da.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
