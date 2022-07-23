const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { assertHardhatInvariant } = require("hardhat/internal/core/errors");

describe("CredentialAdder", function () {
  describe("Deployment", function () {
    
  });

  describe("Integration Test: Verification", function () {
    before(async function() {
      this.verifier = await (await ethers.getContractFactory("AssertLeafFromAddressVerifier")).deploy();
      this.ca = await (await ethers.getContractFactory("CredentialAdder")).deploy(this.verifier.address);
      this.proofData = {"scheme":"g16","curve":"bn128","proof":{"a":["0x2ce3173d6ac9ed566f5ea1616dccf56d81326791e3dbda98f186cc01026b3d0c","0x05d27e2a8b43a3a09a911db48d9bd1d0c7b418b73b7c42f22308c076a984d683"],"b":[["0x1d0ab122866755114e534274e7a968889620ddb2b70553a0496ce09cb0c17673","0x2d3f6b07a2dbf9364bb3f816776b323c51e25f03b7cc74363e65755584ae3adb"],["0x0c7ba1962bd01c1d8147fccf29d9f481f3e58ff6fc2322e7049fcbbd8e6f9ab6","0x20a9cf9a498d7393c4291cf17e3a400710a1461406bff7978d433b760e3e23a9"]],"c":["0x0aebaa33367a802d7659ea25b8d87c6b9471a3be157248a3f62a5cac054a7dbc","0x232ef269a6cad873a36ad0f32b681a6b3bd4ab197e060a062c410cf79d75838b"]},"inputs":["0x000000000000000000000000000000000000000000000000000000000a3f6bc8","0x00000000000000000000000000000000000000000000000000000000e3c5f0c9","0x00000000000000000000000000000000000000000000000000000000d4b1b69d","0x0000000000000000000000000000000000000000000000000000000043f060ac","0x000000000000000000000000000000000000000000000000000000003c976c78","0x0000000000000000000000000000000000000000000000000000000074f2e5fd","0x00000000000000000000000000000000000000000000000000000000c4a00592","0x00000000000000000000000000000000000000000000000000000000b332a9f1","0x00000000000000000000000000000000000000000000000000000000c8834c1f","0x00000000000000000000000000000000000000000000000000000000cf0df662","0x000000000000000000000000000000000000000000000000000000003fc8c8ed","0x0000000000000000000000000000000000000000000000000000000025064a41","0x0000000000000000000000000000000000000000000000000000000048d99388"]};
      this.leaf = Buffer.from("0a3f6bc8e3c5f0c9d4b1b69d43f060ac3c976c7874f2e5fdc4a00592b332a9f1", "hex");
      this.issuerAddress = "0xC8834C1FcF0Df6623Fc8C8eD25064A4148D99388";
      this.creds = Buffer.from("abcde");
      this.paddedCreds = paddedCreds = Buffer.concat([this.creds], 28);
      // assert(issuerAddress == this.account.address, "credential issuer needs to sign the transaction for the tests (and production code) to work");
      [this.account] = await ethers.getSigners();
      const sig_ = await this.account.signMessage(this.leaf);
      this.sig = ethers.utils.splitSignature(sig_);

    })
    it("Does not revert when inputs are valid", async function (){
      let tx = await this.ca.addLeaf(this.leaf, this.issuerAddress, this.sig.v, this.sig.r, this.sig.s, this.proofData.proof, this.proofData.inputs)
      await tx.wait();
      expect(tx).to.not.be.reverted;
      const leaves = await this.ca.getLeaves();
      expect(leaves[leaves.length - 1]).to.equal("0x" + this.leaf.toString("hex"));

    })

    it("Reverts when leaf is invalid", async function (){
      await expect(
        this.ca.addLeaf(Buffer.from("69".repeat(32), "hex"), this.issuerAddress, this.sig.v, this.sig.r, this.sig.s, this.proofData.proof, this.proofData.inputs)
      ).to.be.reverted;
    })

    it("Reverts when issuer address is invalid", async function (){
      await expect(
        this.ca.addLeaf(this.leaf, "0x483293fCB4C2EE29A02D74Ff98C976f9d85b1AAd", this.sig.v, this.sig.r, this.sig.s, this.proofData.proof, this.proofData.inputs)
      ).to.be.reverted;
    })

    it("Reverts when v is invalid", async function (){
      await expect(
        this.ca.addLeaf(this.leaf, this.issuerAddress, 69, this.sig.r, this.sig.s, this.proofData.proof, this.proofData.inputs)
      ).to.be.reverted;
    })

    it("Reverts when r is invalid", async function (){
      await expect(
        this.ca.addLeaf(this.leaf, this.issuerAddress, this.sig.v, Buffer.from("69".repeat(32), "hex"), this.sig.s, this.proofData.proof, this.proofData.inputs)
      ).to.be.reverted;
    })

    it("Reverts when s is invalid", async function (){
      await expect(
        this.ca.addLeaf(this.leaf, this.issuerAddress, this.sig.v, this.sig.r,Buffer.from("69".repeat(32), "hex"), this.proofData.proof, this.proofData.inputs)
      ).to.be.reverted;
    })

    it("Reverts when proof is invalid", async function (){
      // Deepcopy proof and all of its arrays:
      let badProof = JSON.parse(JSON.stringify(this.proofData.proof)); 
      badProof.a[0] = "0x"+"69".repeat(32);
      await expect(
        this.ca.addLeaf(this.leaf, this.issuerAddress, this.sig.v, this.sig.r, this.sig.s, badProof, this.proofData.inputs)
      ).to.be.reverted;
    })

  });

  describe("Signature", function () {
    before(async function() {
      this.verifier = await (await ethers.getContractFactory("AssertLeafFromAddressVerifier")).deploy();
      this.ca = await (await ethers.getContractFactory("CredentialAdder")).deploy(this.verifier.address);
      this.tbs = "To Be Signed";
    })
      it("Should accept fom the right address", async function () {
        const [account] = await ethers.getSigners();
        const sig_ = await account.signMessage(this.tbs)
        const sig = ethers.utils.splitSignature(sig_)
        expect(
          await this.ca.isFromIssuer(Buffer.from(this.tbs), sig.v, sig.r, sig.s, account.address)
        ).to.equal(true)
        
      });

      it("Should deny from the wrong address", async function () {
        const [account, wrongAccount] = await ethers.getSigners();
        const sig_ = await account.signMessage("Wrong Message")
        const sig = ethers.utils.splitSignature(sig_)
        expect(
          await this.ca.isFromIssuer(Buffer.from(this.tbs), sig.v, sig.r, sig.s, wrongAccount.address)
        ).to.equal(false)
      });

      it("Should deny an incorrect signature", async function () {
        const [account] = await ethers.getSigners();
        const sig_ = await account.signMessage("Wrong Message")
        const sig = ethers.utils.splitSignature(sig_)
        expect(
          await this.ca.isFromIssuer(Buffer.from(this.tbs), sig.v, sig.r, sig.s, account.address)
        ).to.equal(false)
      });
    });
});
