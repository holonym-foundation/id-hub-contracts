const { groth16 } = require("snarkjs");
const { encryptAndProve } = require("zk-escrow");
const { ethers } = require("hardhat");
const { expect } = require("chai");



describe.only("DataAvail contract", function (){
    before(async function (){
        this.da = await (await ethers.getContractFactory("DataAvail")).deploy();
    });
    it("Proving works", async function () {
        const [provableEncryption, commitmentData] = await encryptAndProve("1234", ["99999999999999999999999999999987654321"]);
        const calldata = await groth16.exportSolidityCallData(provableEncryption.proof.proof, provableEncryption.proof.publicSignals);
        await expect(
            this.da.storeData(...JSON.parse(`[${calldata}]`))
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
    
    it("Emits the correct event", async function () {
        const [provableEncryption, commitmentData] = await encryptAndProve("1234", ["99999999999999999999999999999987654321"]);
        const calldata = await groth16.exportSolidityCallData(provableEncryption.proof.proof, provableEncryption.proof.publicSignals);
        await expect(
            this.da.storeData(...JSON.parse(`[${calldata}]`))
        ).to.emit(this.da, "TagAdded");
        // const tx = await this.da.storeData(...JSON.parse(`[${calldata}]`));
        // for (const event of (await tx.wait()).events) {
        //     console.log(event)
        // }
    });

    // TODO: check commitment actually works
    
});