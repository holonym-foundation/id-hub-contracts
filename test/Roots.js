
const { expect } = require("chai");
const { ethers } = require("hardhat");

// To Test:
// only owner can add roots
// owner can transfer ownership
// after transferring ownership, previous owner cannot (this should almost definitely be covered by openzeppelin tests but if it's easy, might as well include for extra security)
// ROOT_HISTORY_SIZE recent roots are stored in the list and the map
// ROOT_HISTORY_SIZE+1th root is not stored in list, nor is it in the map
// mostRecentRoot() returns the most recent root

describe("Roots", function () {
    describe.only("Ownership", function () {
        before(async function() {
            [this.account1, this.account2, this.account3] = await ethers.getSigners();

            this.roots = await (await ethers.getContractFactory("Roots")).deploy();
        });

        it("Only owner can add roots", async function () {
            await expect(this.roots.connect(this.account1).addRoot(69)).to.not.be.reverted;
            await expect(this.roots.connect(this.account2).addRoot(69)).to.be.revertedWith("Ownable: caller is not the owner");
            
        });

        it("Only owner can transfer ownership and afterwards, no longer is owner", async function () {
            expect(0).to.equal(1);
        });
    });

    describe("Recent Roots", function () {
        before(async function() {
            [this.account1, this.account2, this.account3] = await ethers.getSigners();

            this.roots = await (await ethers.getContractFactory("Roots")).deploy();
        });

        it("ROOT_HISTORY_SIZE recent roots are stored in the list and the map", async function () {
            expect(0).to.equal(1);
        });

        it("ROOT_HISTORY_SIZE+1th root is not stored in list, nor is it in the map", async function () {
            expect(0).to.equal(1);
        });

        it("mostRecentRoot() returns the most recent root", async function () {
            expect(0).to.equal(1);
        });
    });

});
