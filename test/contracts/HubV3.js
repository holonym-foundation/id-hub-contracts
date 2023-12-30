
const { expect } = require("chai");
const { keccak256, solidityKeccak256 } = require("ethers/lib/utils");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");


/// Utility function for an offhcain verifier to sign the arguments for the contract call
/// `signer` is an ethers signer, e.g. one that is returned by calling `ethers.getSigners()`
/// `args` are the types in the smart contract's ABI except the signature. I.e.: the args of of type argTypes
const signArgsWithChainId = (signer, args, chainId) => {
    const argTypes = [
        "bytes32",
        // "string",
        "address",
        "uint",
        "uint",
        "uint",
        "uint[]",
        "uint"
    ];
    const digest = ethers.utils.arrayify(solidityKeccak256(argTypes, [...args, chainId]));
    return signer.signMessage(digest);
}
const YEAR_IN_SECS = 365 * 24 * 60 * 60;
const yearFromNow = () => Math.floor(Date.now() / 1000) + YEAR_IN_SECS;

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
            // "",
            somebody2.address, 
            yearFromNow(),
            0,
            0,
            [0n, 1n, 2n, 3n],
        ];

        
        let shouldFail = this.contract.sendSBT(
            ...args,
            signArgsWithChainId(somebody, args, 31337)
        );
        await expect(shouldFail).to.be.revertedWith("The Verifier did not sign the provided arguments in the provided order");

        let shouldSucc = this.contract.sendSBT(
            ...args,
            signArgsWithChainId(signer, args, 31337)
        );
        expect(await shouldSucc).to.be.ok;
    });
    it("Nullifier set to 0 can be used 2x", async function() {
        const [signer, somebody, somebody2] = await ethers.getSigners();

        const args = [
            keccak256(Buffer.from("the circuitID")),
            // "",
            somebody2.address, 
            yearFromNow(),
            0,
            0,
            [0n, 1n, 2n, 3n],
        ];




        const shouldSucc1 = this.contract.sendSBT(
            ...args,
            signArgsWithChainId(signer, args, 31337)
        );
        const shouldSucc2 = this.contract.sendSBT(
            ...args,
            signArgsWithChainId(signer, args, 31337)
        );

        expect(await shouldSucc1).to.be.ok;
        expect(await shouldSucc2).to.be.ok;
    });

    it("Another nullifier cannot be used 2x", async function() {
        const [signer, somebody, somebody2] = await ethers.getSigners();

        const args = [
            keccak256(Buffer.from("the circuitID")),
            // "",
            somebody2.address, 
            yearFromNow(),
            0,
            69,
            [0n, 1n, 2n, 3n],
        ];

        

        const shouldSucc = this.contract.sendSBT(
            ...args,
            signArgsWithChainId(signer, args, 31337)
        );
        
        expect(await shouldSucc).to.be.ok;

        const shouldFail = this.contract.sendSBT(
            ...args,
            signArgsWithChainId(signer, args, 31337)
        );

        await expect(shouldFail).to.be.revertedWith("this is already been proven");
    });

    it("Replay by modifiying chainId", async function() {
        const [signer, somebody, somebody2] = await ethers.getSigners();

        const args = [
            keccak256(Buffer.from("the circuitID")),
            // "",
            somebody2.address, 
            yearFromNow(),
            0,
            0,
            [0n, 1n, 2n, 3n],
        ];

        const shouldFail = this.contract.sendSBT(
            ...args,
            signArgsWithChainId(signer, args, 69)
        );

        await expect(shouldFail).to.be.revertedWith("The Verifier did not sign the provided arguments in the provided order");

    });


    it("Payments for specific circuits", async function() {
        const [signer, somebody, somebody2] = await ethers.getSigners();

        const args = [
            keccak256(Buffer.from("the circuitID")),
            // "",
            somebody2.address, 
            yearFromNow(),
            0,
            0,
            [0n, 1n, 2n, 3n],
        ];

        const argsWithFee = [
            keccak256(Buffer.from("the circuitID")),
            // "",
            somebody2.address, 
            yearFromNow(),
            69,
            0,
            [0n, 1n, 2n, 3n],
        ];

        
        const shouldSucc = this.contract.sendSBT(
            ...args,
            signArgsWithChainId(signer, args, 31337)
        );
        
        
        expect(await shouldSucc).to.be.ok;
        // await this.contract.setFee(keccak256(Buffer.from("the circuitID")), 69);

        const shouldFailFee = this.contract.sendSBT(
            ...argsWithFee,
            signArgsWithChainId(signer, argsWithFee, 31337)
        );
        const shouldFailSig = this.contract.sendSBT(
            ...args,
            signArgsWithChainId(signer, argsWithFee, 31337)
        );

        await expect(shouldFailSig).to.be.revertedWith("The Verifier did not sign the provided arguments in the provided order");
        await expect(shouldFailFee).to.be.revertedWith("Missing Fee");

        // Test that with the correct payment amount, it succeeds
        const shouldSucc2 = this.contract.sendSBT(
            ...argsWithFee,
            signArgsWithChainId(signer, argsWithFee, 31337),
            {value: 69}
        );

        await expect(shouldSucc2).to.be.ok;


        // // Test that a different circuit is still free
        // const args2 = [
        //     keccak256(Buffer.from("another circuitID")),
        //     // "",
        //     somebody2.address, 
        //     yearFromNow(),
        //     0,
        //     0,
        //     [0n, 1n, 2n, 3n],
        // ];

        // const shouldSucc3 = this.contract.sendSBT(
        //     args2,
        //     signArgsWithChainId(signer, args2, 31337)
        // );
        // await expect(shouldSucc3).to.be.ok;
    });

    it("SBT Reading and Expiration", async function() {
        const [signer, somebody, somebody2] = await ethers.getSigners();

        const args = [
            keccak256(Buffer.from("the circuitID")),
            // "",
            somebody2.address, 
            yearFromNow(),
            0,
            0,
            [0n, 1n, 2n, 3n],
        ];

        await this.contract.sendSBT(
            ...args,
            signArgsWithChainId(signer, args, 31337)
        );
        
        let sbt = await this.contract.getSBT(somebody2.address, keccak256(Buffer.from("the circuitID")));
        expect(sbt.expiry).to.approximately(await time.latest() + YEAR_IN_SECS, 100);
        await time.increase(YEAR_IN_SECS + 1);
        await expect(this.contract.getSBT(somebody2.address, keccak256(Buffer.from("the circuitID")))).to.be.revertedWith("SBT is expired");
        
    });

});