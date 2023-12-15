
const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { keccak256, solidityPack, solidityKeccak256 } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

describe.only("Hub", function() { 
    before(async function () {
        // Deploy
        const [signer, somebody] = await ethers.getSigners();
        this.contract = await (await ethers.getContractFactory("Hub")).deploy(signer.address);
    });
    it("Only the verifier can add the SBT ", async function() {
        const [signer, somebody, somebody2] = await ethers.getSigners();

        const args = [
            keccak256(Buffer.from("the circuitID")),
            "",
            somebody2.address, 
            0,
            [0n, 1n, 2n, 3n],
        ];

        const argTypes = [
            "bytes32", 
            "string", 
            "address", 
            "uint", 
            "uint[]"
        ];
        const digest = ethers.utils.arrayify(solidityKeccak256(argTypes, args));
        
        let shouldFail = this.contract.sendSBT(
            ...args,
            somebody.signMessage(digest)
        );
        await expect(shouldFail).to.be.revertedWith("unapproved verifier");

        let shouldSucc = this.contract.sendSBT(
            ...args,
            signer.signMessage(digest)
        );
        expect(await shouldSucc).to.be.ok;
    });
    // it("Nullifier cannot be again", async function() {
    //     console.error("not yet implemented")
    //     process.exit(-1);
    // });

});