const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CredentialAdder", function () {
  describe("Deployment", function () {
    // it("Should set the right unlockTime", async function () {
    //   // const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

    //   // expect(await lock.unlockTime()).to.equal(unlockTime);
    // });

    // it("Should set the right owner", async function () {
    //   const { lock, owner } = await loadFixture(deployOneYearLockFixture);

    //   expect(await lock.owner()).to.equal(owner.address);
    // });

    // it("Should receive and store the funds to lock", async function () {
    //   const { lock, lockedAmount } = await loadFixture(
    //     deployOneYearLockFixture
    //   );

    //   expect(await ethers.provider.getBalance(lock.address)).to.equal(
    //     lockedAmount
    //   );
    // });

    // it("Should fail if the unlockTime is not in the future", async function () {
    //   // We don't use the fixture here because we want a different deployment
    //   const latestTime = await time.latest();
    //   const Lock = await ethers.getContractFactory("Lock");
    //   await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
    //     "Unlock time should be in the future"
    //   );
    // });
  });

  // describe("Starts with right msg.sender", function () {
  //   before(async function() {
  //     this.ca = await (await ethers.getContractFactory("CredentialAdder")).deploy()
  //   })
  //   it("Returns true when message starts with sender", async function (){
  //     const [account] = await ethers.getSigners();
  //     expect(
  //       await this.ca.isForSender(Buffer.from(account.address.replace("0x","") + "abcdefabcdef00", "hex"))
  //     ).to.equal(true)
  //   })
  //   it("Returns false when message does not with sender", async function (){
  //     const [account] = await ethers.getSigners();
  //     expect(
  //       await this.ca.isForSender(Buffer.from("abc" + account.address.replace("0x","") + "abcdefabcdef00", "hex"))
  //     ).to.equal(false)
  //   })
  // });

  describe("Signature", function () {
    before(async function() {
      this.ca = await (await ethers.getContractFactory("CredentialAdder")).deploy()
      this.tbs = "To Be Signed"
    })
      it("Should accept fom the right address", async function () {
        const [account] = await ethers.getSigners();
        const sig_ = await account.signMessage(this.tbs)
        const sig = ethers.utils.splitSignature(sig_)
        expect(
          await this.ca.isFromIssuer(Buffer.from(this.tbs), sig.v, sig.r, sig.s, account.address)
        ).to.equal(true)
        
        // expect(
        //   await this.ca.isFromIssuer(
        //     hashed, 
        //     await account.signMessage(hashed),
        //     "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        //   )
        // ).to.equal(true)
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
