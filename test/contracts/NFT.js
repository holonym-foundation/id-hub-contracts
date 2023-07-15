
const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

describe.only("GovIDUniqueness", function() { 
    before(async function () {
        // Deploy the contract and get the signers
        this.contract = await (await ethers.getContractFactory("HolonymUniqueGovIDNFT")).deploy();
    });
    it("Should return correct URI", async function() {
        // console.log(this.contract)
        const [signer] = await ethers.getSigners();
        await this.contract.safeMint(signer.address, "0x69");
        expect(await this.contract.tokenURI("0x69")).to.equal("https://nft.holonym.io/nft-metadata/105");
    });

    it("Is nontransferrable", async function() {
        // console.log(this.contract)
        const [signer, somebody] = await ethers.getSigners();
        // await this.contract.safeMint(signer.address, "0x69");
        await this.contract.approve(somebody.address, "0x69");
        await expect(this.contract.transferFrom(signer.address, somebody.address, "0x69")).to.be.revertedWith("Cannot transfer this type of token");
    });
});