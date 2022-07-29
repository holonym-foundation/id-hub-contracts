
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ResidencyStore", function () {
  describe("setResidesInUS", function () {
    before(async function() {
      this.residencyStore = await (await ethers.getContractFactory("ResidencyStore")).deploy();
      [this.account] = await ethers.getSigners();
    })
    it("Successfully sets residesInUS for valid inputs", async function (){
      // test where residesInUS == true
      let tx = await this.residencyStore.setResidesInUS(this.account.address, true)
      await tx.wait();
      expect(tx).to.not.be.reverted;
      let residesInUSRetVal = await this.residencyStore.residesInUS(this.account.address);
      expect(residesInUSRetVal).to.equal(true);

      // test where residesInUS == false
      tx = await this.residencyStore.setResidesInUS(this.account.address, false)
      await tx.wait();
      expect(tx).to.not.be.reverted;
      residesInUSRetVal = await this.residencyStore.residesInUS(this.account.address);
      expect(residesInUSRetVal).to.equal(false);
    });
  });
});
