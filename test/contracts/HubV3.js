
const { expect } = require("chai");
const { keccak256, solidityKeccak256, solidityPack } = require("ethers/lib/utils");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");


/// Utility function for an offhcain verifier to sign the arguments for the contract call
/// `signer` is an ethers signer, e.g. one that is returned by calling `ethers.getSigners()`
/// `args` are the types in the smart contract's ABI except the signature. I.e.: the args of of type argTypes
const signArgsWithChainId = (signer, args, chainId) => {
    const argTypes = [
        "bytes32",
        // "string",
        "uint",
        "uint",
        "uint",
        "uint",
        "uint[]",
        "uint"
    ];
    const digest = ethers.utils.arrayify(solidityKeccak256(argTypes, [...args, chainId]));
    return signer.signMessage(digest);
}
const CIRCUIT_ID = "V3SybilResistance";
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
            keccak256(Buffer.from(CIRCUIT_ID)),
            // "",
            somebody2.address, 
            yearFromNow(),
            0,
            0,
            [0n, 1n, 2n, 3n],
        ];

        
        let shouldFail = this.contract.setSBT(
            ...args,
            signArgsWithChainId(somebody, args, 31337)
        );
        await expect(shouldFail).to.be.revertedWith("The Verifier did not sign the provided arguments in the provided order");

        let shouldSucc = this.contract.setSBT(
            ...args,
            signArgsWithChainId(signer, args, 31337)
        );
        expect(await shouldSucc).to.be.ok;
    });
    it("Nullifier set to 0 can be used 2x", async function() {
        const [signer, somebody, somebody2] = await ethers.getSigners();

        const args = [
            keccak256(Buffer.from(CIRCUIT_ID)),
            // "",
            somebody2.address, 
            yearFromNow(),
            0,
            0,
            [0n, 1n, 2n, 3n],
        ];




        const shouldSucc1 = this.contract.setSBT(
            ...args,
            signArgsWithChainId(signer, args, 31337)
        );
        const shouldSucc2 = this.contract.setSBT(
            ...args,
            signArgsWithChainId(signer, args, 31337)
        );

        expect(await shouldSucc1).to.be.ok;
        expect(await shouldSucc2).to.be.ok;
    });

    it("Another nullifier cannot be used 2x", async function() {
        const [signer, somebody, somebody2] = await ethers.getSigners();

        const args = [
            keccak256(Buffer.from(CIRCUIT_ID)),
            // "",
            somebody2.address, 
            yearFromNow(),
            0,
            69,
            [0n, 1n, 2n, 3n],
        ];

        

        const shouldSucc = this.contract.setSBT(
            ...args,
            signArgsWithChainId(signer, args, 31337)
        );
        
        expect(await shouldSucc).to.be.ok;

        const shouldFail = this.contract.setSBT(
            ...args,
            signArgsWithChainId(signer, args, 31337)
        );

        await expect(shouldFail).to.be.revertedWith("this is already been proven");
    });

    it("Mappings have correct state", async function() {
        const [signer, somebody, somebody2] = await ethers.getSigners();
        
        const args = [
            keccak256(Buffer.from(CIRCUIT_ID)),
            // "",
            somebody.address, 
            yearFromNow(),
            0,
            12345n,
            [0n, 1n, 2n, 3n],
        ];

        await expect(this.contract.getSBT(somebody.address, keccak256(Buffer.from(CIRCUIT_ID)))).to.be.revertedWith("SBT is expired or does not exist");
        await expect(this.contract.getSBTByNullifier(12345n)).to.be.revertedWith("SBT is expired or does not exist");

        expect(await this.contract.nullifiersToIdentifiers(12345n)).to.equal(`0x${"00".repeat(32)}`);

        await this.contract.setSBT(
            ...args,
            signArgsWithChainId(signer, args, 31337)
        );
        await expect(this.contract.getSBT(somebody.address, keccak256(Buffer.from(CIRCUIT_ID)))).to.not.be.reverted;
        await expect(this.contract.getSBTByNullifier(12345n)).to.not.be.reverted;
        expect(await this.contract.nullifiersToIdentifiers(12345n)).to.not.equal(`0x${"00".repeat(32)}`);

    });


    it("Replay by modifiying chainId", async function() {
        const [signer, somebody, somebody2] = await ethers.getSigners();

        const args = [
            keccak256(Buffer.from(CIRCUIT_ID)),
            // "",
            somebody2.address, 
            yearFromNow(),
            0,
            0,
            [0n, 1n, 2n, 3n],
        ];

        const shouldFail = this.contract.setSBT(
            ...args,
            signArgsWithChainId(signer, args, 69)
        );

        await expect(shouldFail).to.be.revertedWith("The Verifier did not sign the provided arguments in the provided order");

    });


    it("Payments for specific circuits", async function() {
        const [signer, somebody, somebody2] = await ethers.getSigners();

        const args = [
            keccak256(Buffer.from(CIRCUIT_ID)),
            // "",
            somebody2.address, 
            yearFromNow(),
            0,
            0,
            [0n, 1n, 2n, 3n],
        ];

        const argsWithFee = [
            keccak256(Buffer.from(CIRCUIT_ID)),
            // "",
            somebody2.address, 
            yearFromNow(),
            69,
            0,
            [0n, 1n, 2n, 3n],
        ];

        
        const shouldSucc = this.contract.setSBT(
            ...args,
            signArgsWithChainId(signer, args, 31337)
        );
        
        
        expect(await shouldSucc).to.be.ok;
        // await this.contract.setFee(keccak256(Buffer.from(CIRCUIT_ID)), 69);

        const shouldFailFee = this.contract.setSBT(
            ...argsWithFee,
            signArgsWithChainId(signer, argsWithFee, 31337)
        );
        const shouldFailSig = this.contract.setSBT(
            ...args,
            signArgsWithChainId(signer, argsWithFee, 31337)
        );

        await expect(shouldFailSig).to.be.revertedWith("The Verifier did not sign the provided arguments in the provided order");
        await expect(shouldFailFee).to.be.revertedWith("Missing Fee");

        // Test that with the correct payment amount, it succeeds
        const shouldSucc2 = this.contract.setSBT(
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

        // const shouldSucc3 = this.contract.setSBT(
        //     args2,
        //     signArgsWithChainId(signer, args2, 31337)
        // );
        // await expect(shouldSucc3).to.be.ok;
    });

    it("SBT Reading and Revocation", async function() {
        const [signer, somebody, somebody2] = await ethers.getSigners();

        const args = [
            keccak256(Buffer.from(CIRCUIT_ID)),
            // "",
            somebody2.address, 
            yearFromNow(),
            0,
            1234n,
            [0n, 1n, 2n, 3n],
        ];

        await this.contract.setSBT(
            ...args,
            signArgsWithChainId(signer, args, 31337)
        );
        
        expect(await this.contract.getSBT(somebody2.address, keccak256(Buffer.from(CIRCUIT_ID)))).to.not.be.reverted;
        await this.contract.revokeSBT(somebody2.address, keccak256(Buffer.from(CIRCUIT_ID)));
        await expect(this.contract.getSBT(somebody2.address, keccak256(Buffer.from(CIRCUIT_ID)))).to.be.revertedWith("SBT has been revoked");
        
    });

    it("SBT Reading and Expiration", async function() {
        const [signer, somebody, somebody2] = await ethers.getSigners();

        const args = [
            keccak256(Buffer.from(CIRCUIT_ID)),
            // "",
            somebody2.address, 
            yearFromNow(),
            0,
            0,
            [0n, 1n, 2n, 3n],
        ];

        await this.contract.setSBT(
            ...args,
            signArgsWithChainId(signer, args, 31337)
        );
        
        let sbt = await this.contract.getSBT(somebody2.address, keccak256(Buffer.from(CIRCUIT_ID)));
        expect(sbt.expiry).to.approximately(await time.latest() + YEAR_IN_SECS, 100);
        await time.increase(YEAR_IN_SECS + 10);
        await expect(this.contract.getSBT(somebody2.address, keccak256(Buffer.from(CIRCUIT_ID)))).to.be.revertedWith("SBT is expired or does not exist");        
    });

    it("Test integration with verifier server", async function() {
        const jsonFromServer = JSON.parse("{\"values\":{\"circuit_id\":\"0x246573d89cb5c7092555e196ea706dd8c9dcc0cfda6f7529f6305ac2ed4d77da\",\"sbt_reciever\":\"0x70997970c51812dc3a010c7d01b50e0d17dc79c8\",\"expiration\":\"0xeaf6293a\",\"custom_fee\":\"0x123469\",\"nullifier\":\"0x10618764ddaf4a294979b4987e1236eeb5b279a798810ce53b4acedb1e1c0d79\",\"public_values\":[\"0xeaf6293a\",\"0x70997970c51812dc3a010c7d01b50e0d17dc79c8\",\"0x25f7bd02f163928099df325ec1cb1\",\"0x10618764ddaf4a294979b4987e1236eeb5b279a798810ce53b4acedb1e1c0d79\",\"0x24ab80541e32746ce3d3d2e6497d85f036ddacedc0e6a2ac22b40762e3bc9f57\"],\"chain_id\":\"0x7a69\"},\"sig\":\"0x2ed9a0011d84b54c69524be6ad0e0e7776d12583f4bddd8162f8696aa5f4885c75d25fc0d328dca35063a043f52a3d2562835394306787b556ae0078ad4ec5431b\"}")
        const contract2 = await (await ethers.getContractFactory("Hub")).deploy("0xc38cdaae95b817a1bc135700f971c86de75d05fb");
        expect(await contract2.setSBT(
            jsonFromServer.values.circuit_id,
            jsonFromServer.values.sbt_reciever,
            jsonFromServer.values.expiration,
            jsonFromServer.values.custom_fee,
            jsonFromServer.values.nullifier,
            jsonFromServer.values.public_values,
            jsonFromServer.sig,
            {value: 0x123469}
        )).to.be.ok;
    });

    it("NFT mint works", async function() {
        const [signer, somebody, somebody2] = await ethers.getSigners();
        
        const args = [
            keccak256(Buffer.from(CIRCUIT_ID)),
            // "",
            somebody2.address, 
            yearFromNow(),
            0,
            0,
            [0n, 1n, 2n, 3n],
        ];

        await this.contract.setSBT(
            ...args,
            signArgsWithChainId(signer, args, 31337)
        );

        expect(
            await this.contract.balanceOf(somebody2.address)
        ).to.not.equal(0)
    });
});