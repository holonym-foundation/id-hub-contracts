const { groth16 } = require("snarkjs");
// const { encryptAndProve } = require("../../utils/packages/zk-escrow/lib/main");
const { readFileSync } = require("fs");
const { encryptAndProve } = require("zk-escrow");
const { Proofs } = require("../../utils/proofs");
const { ethers } = require("hardhat");
const { expect } = require("chai");
// const { expect } = require("chai");
// const { Proofs } = require("../../utils/proofs");
// const { Utils } = require("threshold-eg-babyjub");
// // const { Tree } = require("holo-merkle-utils");
// const { AuditLayerSimulator } = require("../../utils/threshold");
// const { randomBytes } = require("crypto");
// const { rejects } = require("assert");


describe.only("DataAvail contract", function (){
    before(async function (){
        this.da = await (await ethers.getContractFactory("DataAvail")).deploy();
    });
    it("Proving works", async function () {
        const [provableEncryption, commitmentData] = await encryptAndProve("1234", ["99999999999999999999999999999987654321"]);
        const calldata = await groth16.exportSolidityCallData(provableEncryption.proof.proof, provableEncryption.proof.publicSignals);
        expect(
            await this.da.storeData(...JSON.parse(`[${calldata}]`))
        ).to.not.be.reverted;
    });
    it("Invalid proof fails (not comprehensive test of circuit, more comprehensive are in utils/packages/zk-escrow/test. this just tests a bad proof fails the contract, not that all constraints exist)", async function () {
        const [provableEncryption, commitmentData] = await encryptAndProve("1234", ["99999999999999999999999999999987654321"]);
        provableEncryption.proof.publicSignals[0] = "1093487109487103984571304972038710348108718479182374619284761829374132413778" // Some random number which it definitely is not
        const calldata = await groth16.exportSolidityCallData(provableEncryption.proof.proof, provableEncryption.proof.publicSignals);
        await expect(
            this.da.storeData(...JSON.parse(`[${calldata}]`))
        ).to.be.revertedWith("failed to verify proof of correct encryption");
    });
});