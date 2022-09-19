
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

});
