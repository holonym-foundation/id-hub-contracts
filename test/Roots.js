
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe.only("Roots", function () {
    before(async function() {
        [this.account1, this.account2, this.account3] = await ethers.getSigners();

        this.roots = await (await ethers.getContractFactory("Roots")).deploy();
    });
    
    describe("Ownership", function () {
        it("Only owner can add roots", async function () {
            await expect(this.roots.connect(this.account1).addRoot(69)).to.not.be.reverted;
            await expect(this.roots.connect(this.account2).addRoot(69)).to.be.revertedWith("Ownable: caller is not the owner"); 
        });

        it("Only owner can transfer ownership and afterwards, no longer is owner", async function () {
            await expect(this.roots.connect(this.account1).transferOwnership(this.account2.address)).to.not.be.reverted;
            await expect(this.roots.connect(this.account1).addRoot(69)).to.be.reverted;
            await expect(this.roots.connect(this.account2).addRoot(69)).to.not.be.reverted;
        });
    });

    describe("Recent Roots", function () {
        before(async function() {
            [this.account1, this.account2, this.account3] = await ethers.getSigners();

            this.roots = await (await ethers.getContractFactory("Roots")).deploy();
        });

        it("ROOT_HISTORY_SIZE recent roots are stored in the list and the map", async function () {
            const MAX_ONCHAIN_HISTORY = await this.roots.ROOT_HISTORY_SIZE(); 
            let allHistory = [];
            // Go a bit over max history to ensure it correctly cycles:
            for(i=0; i < MAX_ONCHAIN_HISTORY + 5; i++) {
                let cyclicCounter = i % MAX_ONCHAIN_HISTORY;
                const newRoot = ethers.BigNumber.from(ethers.utils.randomBytes(32));
                allHistory.push(newRoot);

                // // let mostRecentRoot = await this.mt.mostRecentRoot();
                // if(i >= MAX_HISTORY) {
                //     const old = await this.roots.recentRootsList(cyclicCounter);
                //     expect(await this.roots.rootIsRecent(old)).to.equal(true);
                //     await this.mt.insertLeaf(69);
                //     const cur = await this.roots.recentRootsList(cyclicCounter);
                //     expect(await this.roots.rootIsRecent(cur)).to.equal(true);

                    
                //     expect(await this.roots.rootIsRecent(old)).to.equal(false);
                // } else {
                //     await
                // }
                await this.roots.addRoot(newRoot);
            }
            // Check it doesn't have first root
            expect(await this.roots.rootIsRecent(allHistory[0])).to.equal(false);
            // Check it doesn't have fifth root
            expect(await this.roots.rootIsRecent(allHistory[4])).to.equal(false);
            // Check it has sixth root
            expect(await this.roots.rootIsRecent(allHistory[5])).to.equal(true);
            // Check it has second most recent root
            expect(await this.roots.rootIsRecent(allHistory[allHistory.length-2])).to.equal(true);
            // Check it has most recent root
            expect(await this.roots.rootIsRecent(allHistory[allHistory.length-1])).to.equal(true);

        });

        it("mostRecentRoot() returns the most recent root", async function () {
            await this.roots.addRoot(123);
            await this.roots.addRoot(569);
            expect(await this.roots.mostRecentRoot()).to.equal(569);
        });
    });

});
