
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Hub", function () {
  describe("Signature", function () {
    before(async function() {
      this.alfa = await (await ethers.getContractFactory("AssertLeafFromAddressVerifier")).deploy();
      this.alcc = await (await ethers.getContractFactory("AssertLeafContainsCredsVerifier")).deploy();
      this.hub = await (await ethers.getContractFactory("Hub")).deploy(this.alfa.address, this.alcc.address);
      this.tbs = "To Be Signed";
    })
      it("Should accept fom the right address", async function () {
        const [account] = await ethers.getSigners();
        const sig_ = await account.signMessage(this.tbs)
        const sig = ethers.utils.splitSignature(sig_)
        expect(
          await this.hub.isFromIssuer(Buffer.from(this.tbs), sig.v, sig.r, sig.s, account.address)
        ).to.equal(true)
        
      });

      it("Should deny from the wrong address", async function () {
        const [account, wrongAccount] = await ethers.getSigners();
        const sig_ = await account.signMessage("Wrong Message")
        const sig = ethers.utils.splitSignature(sig_)
        expect(
          await this.hub.isFromIssuer(Buffer.from(this.tbs), sig.v, sig.r, sig.s, wrongAccount.address)
        ).to.equal(false)
      });

      it("Should deny an incorrect signature", async function () {
        const [account] = await ethers.getSigners();
        const sig_ = await account.signMessage("Wrong Message")
        const sig = ethers.utils.splitSignature(sig_)
        expect(
          await this.hub.isFromIssuer(Buffer.from(this.tbs), sig.v, sig.r, sig.s, account.address)
        ).to.equal(false)
      });
    });

    describe("addLeafSmall", function () {
      before(async function() {
        this.alb = await (await ethers.getContractFactory("AddLeafBig")).deploy();
        this.als = await (await ethers.getContractFactory("AddLeafSmall")).deploy();
        this.hub = await (await ethers.getContractFactory("Hub")).deploy(this.alb.address, this.als.address);
        this.proofData = {"scheme":"g16","curve":"bn128","proof":{"a":["0x23fa30977e37089a0dcde3eb1ebe71275f96d5249dd7eb49379301c29edf1215","0x0fb0200d506286cc5fc3d199a1bb1963833b5db6111103932f73d16007988894"],"b":[["0x0a1d1b73761cfd92b4c8d144c4db38d7396a50f2587b1bd81d72daca79f80dfa","0x1a725882a5ac720b8261acec24277adfe64716a1ffa70981f6bff501f5541e35"],["0x2fac2cd0f0f88108fbb36d9d69c9f94d09abcd087aee5ceee50908c436a0d088","0x07a3de4247cf418cfdded0f8700b27c609dc95abb6602e980acec1ec997dca41"]],"c":["0x191e112004f4f097fa82c98012626bf29476dcb88458967913f513c26be225e9","0x18996704456fe392c34297dcc8c042536b697a6f8624ce11b393d0fdc53bc431"]},"inputs":["0x000000000000000000000000000000000000000000000000000000000a3f6bc8","0x00000000000000000000000000000000000000000000000000000000e3c5f0c9","0x00000000000000000000000000000000000000000000000000000000d4b1b69d","0x0000000000000000000000000000000000000000000000000000000043f060ac","0x000000000000000000000000000000000000000000000000000000003c976c78","0x0000000000000000000000000000000000000000000000000000000074f2e5fd","0x00000000000000000000000000000000000000000000000000000000c4a00592","0x00000000000000000000000000000000000000000000000000000000b332a9f1","0x000000000000000000000000000000000000000000000000000000007fdbe8c7","0x000000000000000000000000000000000000000000000000000000009888e835","0x000000000000000000000000000000000000000000000000000000000b61ca17","0x0000000000000000000000000000000000000000000000000000000031e83ebf","0x00000000000000000000000000000000000000000000000000000000cee524f9","0x00000000000000000000000000000000000000000000000000000000ddd7878b","0x00000000000000000000000000000000000000000000000000000000c9fccf12","0x00000000000000000000000000000000000000000000000000000000e7074647","0x00000000000000000000000000000000000000000000000000000000c8834c1f","0x00000000000000000000000000000000000000000000000000000000cf0df662","0x000000000000000000000000000000000000000000000000000000003fc8c8ed","0x0000000000000000000000000000000000000000000000000000000025064a41","0x0000000000000000000000000000000000000000000000000000000048d99388"]};
        this.oldLeaf = Buffer.from("0a3f6bc8e3c5f0c9d4b1b69d43f060ac3c976c7874f2e5fdc4a00592b332a9f1", "hex");
        this.newLeaf = Buffer.from("7fdbe8c79888e8350b61ca1731e83ebfcee524f9ddd7878bc9fccf12e7074647", "hex")
        this.issuerAddress = "0xC8834C1FcF0Df6623Fc8C8eD25064A4148D99388";
        this.creds = Buffer.from("abcde");
        this.paddedCreds = paddedCreds = Buffer.concat([this.creds], 28);
        // assert(issuerAddress == this.account.address, "credential issuer needs to sign the transaction for the tests (and production code) to work");
        [this.account] = await ethers.getSigners();
        const sig_ = await this.account.signMessage(this.oldLeaf);
        this.sig = ethers.utils.splitSignature(sig_);
  
      })
      it("Does not revert when inputs are valid", async function (){
        let tx = await this.hub.addLeafSmall(this.issuerAddress, this.sig.v, this.sig.r, this.sig.s, this.proofData.proof, this.proofData.inputs)
        await tx.wait();
        expect(tx).to.not.be.reverted;
        const leaves = await this.hub.getLeaves();
        expect(leaves[leaves.length - 1]).to.equal("0x" + this.newLeaf.toString("hex"));
  
      })
  
      it("Reverts when issuer address is invalid", async function (){
        await expect(
          this.hub.addLeafSmall("0x483293fCB4C2EE29A02D74Ff98C976f9d85b1AAd", this.sig.v, this.sig.r, this.sig.s, this.proofData.proof, this.proofData.inputs)
        ).to.be.revertedWith("credentials must be proven to start with the issuer's address");
      })
  
      it("Reverts when v is invalid", async function (){
        await expect(
          this.hub.addLeafSmall(this.issuerAddress, 69, this.sig.r, this.sig.s, this.proofData.proof, this.proofData.inputs)
        ).to.be.revertedWith("leaf must be signed by the issuer");
      })
  
      it("Reverts when r is invalid", async function (){
        await expect(
          this.hub.addLeafSmall(this.issuerAddress, this.sig.v, Buffer.from("69".repeat(32), "hex"), this.sig.s, this.proofData.proof, this.proofData.inputs)
        ).to.be.revertedWith("leaf must be signed by the issuer");
      })
  
      it("Reverts when s is invalid", async function (){
        await expect(
          this.hub.addLeafSmall(this.issuerAddress, this.sig.v, this.sig.r,Buffer.from("69".repeat(32), "hex"), this.proofData.proof, this.proofData.inputs)
        ).to.be.revertedWith("leaf must be signed by the issuer");
      })
  
      it("Reverts when proof is invalid", async function (){
        // Deepcopy proof and all of its arrays:
        let badProof = JSON.parse(JSON.stringify(this.proofData.proof)); 
        badProof.a[0] = "0x"+"69".repeat(32);
        await expect(
          this.hub.addLeafSmall(this.issuerAddress, this.sig.v, this.sig.r, this.sig.s, badProof, this.proofData.inputs)
        ).to.be.reverted;
      })
  
    });


    /* REFACTORING: going to move proveIHaveCredential to a new file in a future update -- we are commenting out all proveIHaveCredentials for now as they are not yet needed */
    
    // describe("proveIHaveCredential", function () {
    //   before(async function() {
    //     this.alfa = await (await ethers.getContractFactory("AssertLeafFromAddressVerifier")).deploy();
    //     this.alcc = await (await ethers.getContractFactory("AssertLeafContainsCredsVerifier")).deploy();
    //     this.hub = await (await ethers.getContractFactory("Hub")).deploy(this.alfa.address, this.alcc.address);
        
    //     // Proof needed to add the credential
    //     this.addProofData = {"scheme":"g16","curve":"bn128","proof":{"a":["0x2ce3173d6ac9ed566f5ea1616dccf56d81326791e3dbda98f186cc01026b3d0c","0x05d27e2a8b43a3a09a911db48d9bd1d0c7b418b73b7c42f22308c076a984d683"],"b":[["0x1d0ab122866755114e534274e7a968889620ddb2b70553a0496ce09cb0c17673","0x2d3f6b07a2dbf9364bb3f816776b323c51e25f03b7cc74363e65755584ae3adb"],["0x0c7ba1962bd01c1d8147fccf29d9f481f3e58ff6fc2322e7049fcbbd8e6f9ab6","0x20a9cf9a498d7393c4291cf17e3a400710a1461406bff7978d433b760e3e23a9"]],"c":["0x0aebaa33367a802d7659ea25b8d87c6b9471a3be157248a3f62a5cac054a7dbc","0x232ef269a6cad873a36ad0f32b681a6b3bd4ab197e060a062c410cf79d75838b"]},"inputs":["0x000000000000000000000000000000000000000000000000000000000a3f6bc8","0x00000000000000000000000000000000000000000000000000000000e3c5f0c9","0x00000000000000000000000000000000000000000000000000000000d4b1b69d","0x0000000000000000000000000000000000000000000000000000000043f060ac","0x000000000000000000000000000000000000000000000000000000003c976c78","0x0000000000000000000000000000000000000000000000000000000074f2e5fd","0x00000000000000000000000000000000000000000000000000000000c4a00592","0x00000000000000000000000000000000000000000000000000000000b332a9f1","0x00000000000000000000000000000000000000000000000000000000c8834c1f","0x00000000000000000000000000000000000000000000000000000000cf0df662","0x000000000000000000000000000000000000000000000000000000003fc8c8ed","0x0000000000000000000000000000000000000000000000000000000025064a41","0x0000000000000000000000000000000000000000000000000000000048d99388"]};
    //     // Proof needed to prove knowledge of the raw credential
    //     this.proofData = {"scheme":"g16","curve":"bn128","proof":{"a":["0x020d723eff1ce68e218a21fa7b31e0a96a81028351a82a839384dd90ce628a24","0x0349466222ba3e6a5b1e7a12adcb99c99f71230d25cd7a43a56aee57bf13697e"],"b":[["0x1c7aec32bdb0ca05c32710bbba340a7f846baaacff9ea1cf166da3a8050f47ab","0x1dd7a7f98b96ada3abe69e838f6b0bb240947e7bf8a83d15d8a73df133be92ac"],["0x1adcefca1c74db8d3a5ecc43f85f5c5f8404048c1652b2b1a11fda34c543a609","0x2f7311cc55b5f74ad481b7c161b1c6019a74852df2f3416645e35e339dfa8eeb"]],"c":["0x17ed70a8c239f10adf3ebb83da9d014887037099b355d25cd3136c23d38259de","0x2a3b10e36e881460105b06785299aa3576fcd3b39648fd58aa667059af35c7d8"]},"inputs":["0x000000000000000000000000000000000000000000000000000000000a3f6bc8","0x00000000000000000000000000000000000000000000000000000000e3c5f0c9","0x00000000000000000000000000000000000000000000000000000000d4b1b69d","0x0000000000000000000000000000000000000000000000000000000043f060ac","0x000000000000000000000000000000000000000000000000000000003c976c78","0x0000000000000000000000000000000000000000000000000000000074f2e5fd","0x00000000000000000000000000000000000000000000000000000000c4a00592","0x00000000000000000000000000000000000000000000000000000000b332a9f1","0x00000000000000000000000000000000000000000000000000000000c8834c1f","0x00000000000000000000000000000000000000000000000000000000cf0df662","0x000000000000000000000000000000000000000000000000000000003fc8c8ed","0x0000000000000000000000000000000000000000000000000000000025064a41","0x0000000000000000000000000000000000000000000000000000000048d99388","0x0000000000000000000000000000000000000000000000000000000061626364","0x0000000000000000000000000000000000000000000000000000000065000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x00000000000000000000000000000000000000000000000000000000c8834c1f","0x00000000000000000000000000000000000000000000000000000000cf0df662","0x000000000000000000000000000000000000000000000000000000003fc8c8ed","0x0000000000000000000000000000000000000000000000000000000025064a41","0x0000000000000000000000000000000000000000000000000000000048d99388"]};
        
    //     this.leaf = Buffer.from("0a3f6bc8e3c5f0c9d4b1b69d43f060ac3c976c7874f2e5fdc4a00592b332a9f1", "hex");
    //     this.issuerAddress = "0xC8834C1FcF0Df6623Fc8C8eD25064A4148D99388";
    //     this.creds = Buffer.from("abcde");
    //     this.paddedCreds = paddedCreds = Buffer.concat([this.creds], 28);  

    //     [this.account] = await ethers.getSigners();
    //     const sig_ = await this.account.signMessage(this.leaf);
    //     this.sig = ethers.utils.splitSignature(sig_);

    //     // Add the credential
    //     let tx = await this.hub.addLeafSmall(this.leaf, this.issuerAddress, this.sig.v, this.sig.r, this.sig.s, this.addProofData.proof, this.addProofData.inputs)
    //     await tx.wait();
    //   })
      
    //   it("Does not revert when inputs are valid", async function (){
    //     let tx = await this.hub.proveIHaveCredential(this.proofData.proof, this.proofData.inputs)
    //     await tx.wait();
    //     expect(tx).to.not.be.reverted;
    //   })
  
    //   it("Reverts when msgSender does not match is invalid", async function (){
    //     const [account, account2] = await ethers.getSigners();
    //     await expect(
    //       this.hub.connect(account2).proveIHaveCredential(this.proofData.proof, this.proofData.inputs)
    //     ).to.be.revertedWith("msgSender is not antiFrontrunningAddress");
    //   })
  
    //   it("Reverts when proof is invalid", async function (){
    //     // Deepcopy proof and all of its arrays:
    //     let badProof = JSON.parse(JSON.stringify(this.proofData.proof)); 
    //     badProof.a[0] = "0x"+"69".repeat(32);
    //     await expect(
    //       this.hub.proveIHaveCredential(badProof, this.proofData.inputs)
    //     ).to.be.reverted;
    //   })

    //   // Modifying the inputs would make the proof fail. But it's important to test the solidity code also cares about the public inputs
    //   it("Reverts when leaf in proof is invalid", async function (){
    //     // Deepcopy inputs and all of its arrays:
    //     let badInputs = JSON.parse(JSON.stringify(this.proofData.inputs)); 
    //     badInputs[0] = "0x"+"69".repeat(32);
    //     await expect(
    //       this.hub.proveIHaveCredential(this.proofData.proof, badInputs)
    //     ).to.be.revertedWith("Leaf was not found");
    //   })

    // });
});
