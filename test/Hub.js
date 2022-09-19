
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { createLeaf, createLeafAdditionProof, deployPoseidon } = require("../utils/utils");

describe.only("Hub", function () {
  describe("Signature", function () {
    before(async function() {
      [this.account, this.admin] = await ethers.getSigners();

      this.tbs = "To Be Signed";

      const _pt6 = await deployPoseidon();
      const _tree = await (await ethers.getContractFactory("IncrementalQuinTree", 
      {
        libraries : {
          PoseidonT6 : _pt6.address
        }
      })).deploy();

      const _hub = await (await ethers.getContractFactory("Hub", {
       libraries : {
          IncrementalQuinTree : _tree.address,
        } 
      })).deploy(this.admin.address);

      this.hub = _hub;
    })
      it("Should accept from the right address", async function () {
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

    describe("addLeaf", function () {
      before(async function() {
        [this.account, this.admin] = await ethers.getSigners();
        this.issuerAddress = "0xC8834C1FcF0Df6623Fc8C8eD25064A4148D99388";
        this.oldSecret = 69;
        this.newSecret = 71;
        this.countryCode = 2;
        this.subdivision = ethers.BigNumber.from(Buffer.from("NY"));
        this.completedAt = ethers.BigNumber.from(Math.floor(Date.now()/1000));
        this.birthdate = 6969696969;

        this.oldLeaf = await createLeaf(
          ethers.BigNumber.from(this.issuerAddress), 
          this.oldSecret, 
          this.countryCode, 
          this.subdivision,
          this.completedAt,
          this.birthdate
        );

        this.newLeaf = await createLeaf(
          ethers.BigNumber.from(this.issuerAddress), 
          this.newSecret, 
          this.countryCode, 
          this.subdivision,
          this.completedAt,
          this.birthdate
        );

        this.proofData = await createLeafAdditionProof(
          ethers.BigNumber.from(this.issuerAddress), 
          this.countryCode, 
          this.subdivision,
          this.completedAt,
          this.birthdate,
          this.oldSecret, 
          this.newSecret, 

        )
        
       console.log("old leaf?!", ethers.utils.solidityPack(["uint256"], [this.oldLeaf]),
       this.oldLeaf)
       const tbs = Buffer.from(
        ethers.BigNumber.from(this.oldLeaf).toHexString().replace("0x",""),
        "hex"
       );
       const sig_ = await this.account.signMessage(tbs);
       this.sig = ethers.utils.splitSignature(sig_);
       console.log(sig_, this.sig)

        const _pt6 = await deployPoseidon();
        const _tree = await (await ethers.getContractFactory("IncrementalQuinTree", 
        {
          libraries : {
            PoseidonT6 : _pt6.address
          }
        })).deploy();

        const _hub = await (await ethers.getContractFactory("Hub", {
        libraries : {
            IncrementalQuinTree : _tree.address,
          } 
        })).deploy(this.admin.address);

        this.hub = _hub;
  
      })
      it("Does not revert when inputs are valid", async function (){
        console.log("this.account: ", this.account.address)
        console.log(this.oldLeaf, this.newLeaf);
        console.log(this.issuerAddress, this.sig.v, this.sig.r, this.sig.s, this.proofData.proof, this.proofData.inputs)
        let tx = await this.hub.addLeaf(this.issuerAddress, this.sig.v, this.sig.r, this.sig.s, this.proofData.proof, this.proofData.inputs)
        await tx.wait();
        expect(tx).to.not.be.reverted;
        const leaves = await this.hub.getLeaves();
        expect(leaves[leaves.length - 1]).to.equal(ethers.BigNumber.from(this.newLeaf));
  
      })
  
      it("Reverts when issuer address is invalid", async function (){
        await expect(
          this.hub.addLeaf("0x483293fCB4C2EE29A02D74Ff98C976f9d85b1AAd", this.sig.v, this.sig.r, this.sig.s, this.proofData.proof, this.proofData.inputs)
        ).to.be.revertedWith("credentials must be proven to start with the issuer's address");
      })
  
      it("Reverts when v is invalid", async function (){
        await expect(
          this.hub.addLeaf(this.issuerAddress, 69, this.sig.r, this.sig.s, this.proofData.proof, this.proofData.inputs)
        ).to.be.revertedWith("leaf must be signed by the issuer");
      })
  
      it("Reverts when r is invalid", async function (){
        await expect(
          this.hub.addLeaf(this.issuerAddress, this.sig.v, Buffer.from("69".repeat(32), "hex"), this.sig.s, this.proofData.proof, this.proofData.inputs)
        ).to.be.revertedWith("leaf must be signed by the issuer");
      })
  
      it("Reverts when s is invalid", async function (){
        await expect(
          this.hub.addLeaf(this.issuerAddress, this.sig.v, this.sig.r,Buffer.from("69".repeat(32), "hex"), this.proofData.proof, this.proofData.inputs)
        ).to.be.revertedWith("leaf must be signed by the issuer");
      })
  
      it("Reverts when proof is invalid", async function (){
        // Deepcopy proof and all of its arrays:
        let badProof = JSON.parse(JSON.stringify(this.proofData.proof)); 
        badProof.a[0] = "0x"+"69".repeat(32);
        await expect(
          this.hub.addLeaf(this.issuerAddress, this.sig.v, this.sig.r, this.sig.s, badProof, this.proofData.inputs)
        ).to.be.reverted;
      })
  
      it("Does not allow one signed leaf to create more than one leaf", async function (){
        let tx = this.hub.addLeaf(this.issuerAddress, this.sig.v, this.sig.r, this.sig.s, this.proofData.proof, this.proofData.inputs)
        await expect(tx).to.be.revertedWith("cannot create more than one new leaf from a signed leaf");
      });
    });

    // describe("addLeafSmall", function () {
    //   before(async function() {
    //     [this.account, this.admin] = await ethers.getSigners();
    //     this.alb = await (await ethers.getContractFactory("AddLeafBig")).deploy();
    //     this.als = await (await ethers.getContractFactory("AddLeafSmall")).deploy();
    //     this.proofData = {"scheme":"g16","curve":"bn128","proof":{"a":["0x23fa30977e37089a0dcde3eb1ebe71275f96d5249dd7eb49379301c29edf1215","0x0fb0200d506286cc5fc3d199a1bb1963833b5db6111103932f73d16007988894"],"b":[["0x0a1d1b73761cfd92b4c8d144c4db38d7396a50f2587b1bd81d72daca79f80dfa","0x1a725882a5ac720b8261acec24277adfe64716a1ffa70981f6bff501f5541e35"],["0x2fac2cd0f0f88108fbb36d9d69c9f94d09abcd087aee5ceee50908c436a0d088","0x07a3de4247cf418cfdded0f8700b27c609dc95abb6602e980acec1ec997dca41"]],"c":["0x191e112004f4f097fa82c98012626bf29476dcb88458967913f513c26be225e9","0x18996704456fe392c34297dcc8c042536b697a6f8624ce11b393d0fdc53bc431"]},"inputs":["0x000000000000000000000000000000000000000000000000000000000a3f6bc8","0x00000000000000000000000000000000000000000000000000000000e3c5f0c9","0x00000000000000000000000000000000000000000000000000000000d4b1b69d","0x0000000000000000000000000000000000000000000000000000000043f060ac","0x000000000000000000000000000000000000000000000000000000003c976c78","0x0000000000000000000000000000000000000000000000000000000074f2e5fd","0x00000000000000000000000000000000000000000000000000000000c4a00592","0x00000000000000000000000000000000000000000000000000000000b332a9f1","0x000000000000000000000000000000000000000000000000000000007fdbe8c7","0x000000000000000000000000000000000000000000000000000000009888e835","0x000000000000000000000000000000000000000000000000000000000b61ca17","0x0000000000000000000000000000000000000000000000000000000031e83ebf","0x00000000000000000000000000000000000000000000000000000000cee524f9","0x00000000000000000000000000000000000000000000000000000000ddd7878b","0x00000000000000000000000000000000000000000000000000000000c9fccf12","0x00000000000000000000000000000000000000000000000000000000e7074647","0x00000000000000000000000000000000000000000000000000000000c8834c1f","0x00000000000000000000000000000000000000000000000000000000cf0df662","0x000000000000000000000000000000000000000000000000000000003fc8c8ed","0x0000000000000000000000000000000000000000000000000000000025064a41","0x0000000000000000000000000000000000000000000000000000000048d99388"]};
    //     this.oldLeaf = Buffer.from("0a3f6bc8e3c5f0c9d4b1b69d43f060ac3c976c7874f2e5fdc4a00592b332a9f1", "hex");
    //     this.newLeaf = Buffer.from("7fdbe8c79888e8350b61ca1731e83ebfcee524f9ddd7878bc9fccf12e7074647", "hex")
    //     this.issuerAddress = "0xC8834C1FcF0Df6623Fc8C8eD25064A4148D99388";
    //     this.creds = Buffer.from("abcde");
    //     this.paddedCreds = paddedCreds = Buffer.concat([this.creds], 28);
    //     // assert(issuerAddress == this.account.address, "credential issuer needs to sign the transaction for the tests (and production code) to work");
    //     [this.account] = await ethers.getSigners();
    //     const sig_ = await this.account.signMessage(this.oldLeaf);
    //     this.sig = ethers.utils.splitSignature(sig_);


    //     const _pt3 = await (await ethers.getContractFactory("PoseidonT3")).deploy();
    //     const _tree = await (await ethers.getContractFactory("IncrementalBinaryTree", 
    //     {
    //       libraries : {
    //         PoseidonT3 : _pt3.address
    //       }
    //     })).deploy();

    //     const _hub = await (await ethers.getContractFactory("Hub", {
    //     libraries : {
    //         IncrementalBinaryTree : _tree.address
    //       } 
    //     })).deploy(this.alb.address, this.als.address, this.admin.address);

    //     this.hub = _hub;
  
    //   })
    //   it("Does not revert when inputs are valid", async function (){
    //     let tx = await this.hub.addLeafSmall(this.issuerAddress, this.sig.v, this.sig.r, this.sig.s, this.proofData.proof, this.proofData.inputs)
    //     await tx.wait();
    //     expect(tx).to.not.be.reverted;
    //     const leaves = await this.hub.getLeaves();
    //     expect(leaves[leaves.length - 1]).to.equal("0x" + this.newLeaf.toString("hex"));
  
    //   })
  
    //   it("Reverts when issuer address is invalid", async function (){
    //     await expect(
    //       this.hub.addLeafSmall("0x483293fCB4C2EE29A02D74Ff98C976f9d85b1AAd", this.sig.v, this.sig.r, this.sig.s, this.proofData.proof, this.proofData.inputs)
    //     ).to.be.revertedWith("credentials must be proven to start with the issuer's address");
    //   })
  
    //   it("Reverts when v is invalid", async function (){
    //     await expect(
    //       this.hub.addLeafSmall(this.issuerAddress, 69, this.sig.r, this.sig.s, this.proofData.proof, this.proofData.inputs)
    //     ).to.be.revertedWith("leaf must be signed by the issuer");
    //   })
  
    //   it("Reverts when r is invalid", async function (){
    //     await expect(
    //       this.hub.addLeafSmall(this.issuerAddress, this.sig.v, Buffer.from("69".repeat(32), "hex"), this.sig.s, this.proofData.proof, this.proofData.inputs)
    //     ).to.be.revertedWith("leaf must be signed by the issuer");
    //   })
  
    //   it("Reverts when s is invalid", async function (){
    //     await expect(
    //       this.hub.addLeafSmall(this.issuerAddress, this.sig.v, this.sig.r,Buffer.from("69".repeat(32), "hex"), this.proofData.proof, this.proofData.inputs)
    //     ).to.be.revertedWith("leaf must be signed by the issuer");
    //   })
  
    //   it("Reverts when proof is invalid", async function (){
    //     // Deepcopy proof and all of its arrays:
    //     let badProof = JSON.parse(JSON.stringify(this.proofData.proof)); 
    //     badProof.a[0] = "0x"+"69".repeat(32);
    //     await expect(
    //       this.hub.addLeafSmall(this.issuerAddress, this.sig.v, this.sig.r, this.sig.s, badProof, this.proofData.inputs)
    //     ).to.be.reverted;
    //   })
  
    //   it("Does not allow one signed leaf to create more than one leaf", async function (){
    //     let tx = this.hub.addLeafSmall(this.issuerAddress, this.sig.v, this.sig.r, this.sig.s, this.proofData.proof, this.proofData.inputs)
    //     await expect(tx).to.be.revertedWith("cannot create more than one leaf from a signed leaf");
    //   });
    // });

});
