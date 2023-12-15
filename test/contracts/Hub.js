
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
    it("Nullifier set to 0 can be used 2x", async function() {
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

        const shouldSucc1 = this.contract.sendSBT(
            ...args,
            signer.signMessage(digest)
        );
        const shouldSucc2 = this.contract.sendSBT(
            ...args,
            signer.signMessage(digest)
        );

        expect(await shouldSucc1).to.be.ok;
        expect(await shouldSucc2).to.be.ok;
    });

    it("Another nullifier cannot be used 2x", async function() {
        const [signer, somebody, somebody2] = await ethers.getSigners();

        const args = [
            keccak256(Buffer.from("the circuitID")),
            "",
            somebody2.address, 
            69,
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

        const shouldSucc = this.contract.sendSBT(
            ...args,
            signer.signMessage(digest)
        );
        
        expect(await shouldSucc).to.be.ok;

        const shouldFail= this.contract.sendSBT(
            ...args,
            signer.signMessage(digest)
        );

        await expect(shouldFail).to.be.revertedWith("this is already been proven");
        
    });

});