const { ethers } = require("hardhat");

async function main() {
    // const da = await (await ethers.getContractFactory("DataAvail")).deploy();
    const sac = await (await ethers.getContractFactory("SimpleAccessControl")).deploy();
    // console.log("DataAvail deployed to:", da.address);
    console.log("SimpleAccessControl deployed to:", sac.address);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
