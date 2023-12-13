
const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

describe.only("Hub", function() { 
    before(async function () {
        // Deploy the contract and get the signers
        this.contract = await (await ethers.getContractFactory("Hub")).deploy();
    });
    it("Only the verifier can add the SBT ", async function() {
        console.error("not yet implemented")
        process.exit(-1);
        // const [signer, somebody] = await ethers.getSigners();
        // await this.contract.approve(somebody.address, "0x69");
        // await expect(this.contract.transferFrom(signer.address, somebody.address, "0x69")).to.be.revertedWith("Cannot transfer this type of token");
    });
    it("Nullifier cannot be again", async function() {
        console.error("not yet implemented")
        process.exit(-1);
    });

});