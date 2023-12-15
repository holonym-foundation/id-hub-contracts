
const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { keccak256, solidityPack, solidityKeccak256 } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
/// Utility function for an offhcain verifier to sign the arguments for the contract call
/// `signer` is an ethers signer, e.g. one that is returned by calling `ethers.getSigners()`
/// `args` are the types in the smart contract's ABI except the signature. I.e.: the args of of type argTypes
const signArgs = (signer, args) => {
    const argTypes = [
        "bytes32", 
        "string", 
        "address", 
        "uint", 
        "uint[]"
    ];
    const digest = ethers.utils.arrayify(solidityKeccak256(argTypes, args));
    return signer.signMessage(digest);
}

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

        
    
        
        let shouldFail = this.contract.sendSBT(
            ...args,
            signArgs(somebody, args)
        );
        await expect(shouldFail).to.be.revertedWith("unapproved verifier");

        let shouldSucc = this.contract.sendSBT(
            ...args,
            signArgs(signer, args)
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




        const shouldSucc1 = this.contract.sendSBT(
            ...args,
            signArgs(signer, args)
        );
        const shouldSucc2 = this.contract.sendSBT(
            ...args,
            signArgs(signer, args)
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

        

        const shouldSucc = this.contract.sendSBT(
            ...args,
            signArgs(signer, args)
        );
        
        expect(await shouldSucc).to.be.ok;

        const shouldFail= this.contract.sendSBT(
            ...args,
            signArgs(signer, args)
        );

        await expect(shouldFail).to.be.revertedWith("this is already been proven");
    });

    it("Payments for specific circuits", async function() {
        const [signer, somebody, somebody2] = await ethers.getSigners();

        const args = [
            keccak256(Buffer.from("the circuitID")),
            "",
            somebody2.address, 
            0,
            [0n, 1n, 2n, 3n],
        ];

        
        const shouldSucc = this.contract.sendSBT(
            ...args,
            signArgs(signer, args)
        );
        
        
        expect(await shouldSucc).to.be.ok;
        await this.contract.setFee(keccak256(Buffer.from("the circuitID")), 69);

        const shouldFail = this.contract.sendSBT(
            ...args,
            signArgs(signer, args)
        );

        await expect(shouldFail).to.be.revertedWith("Missing payment");

        // Test that with the correct payment amount, it succeeds
        const shouldSucc2 = this.contract.sendSBT(
            ...args,
            signArgs(signer, args),
            {value: 69}
        );

        await expect(shouldSucc2).to.be.ok;
        

        // Test that a different circuit is still free
        const args2 = [
            keccak256(Buffer.from("another circuitID")),
            "",
            somebody2.address, 
            0,
            [0n, 1n, 2n, 3n],
        ];

        const shouldSucc3 = this.contract.sendSBT(
            args2,
            signArgs(signer, args2)
        );
        await expect(shouldSucc3).to.be.ok;
    });

});