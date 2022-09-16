
const { expect } = require("chai");
const { ethers, hardhatArguments } = require("hardhat");

const { poseidonContract } = require("circomlibjs");

const abiPoseidon = poseidonContract.generateABI(5);
const bytecodePoseidon = poseidonContract.createCode(5);

const deployPoseidon = async () => {
    const [account] = await ethers.getSigners();
    const PoseidonContractFactory = new ethers.ContractFactory(
        abiPoseidon,
        bytecodePoseidon,
        account
    );
    return await PoseidonContractFactory.deploy();
}



describe.only("Merkle Tree", function () {
  describe("Insert", function () {
    beforeEach(async function() {
        [this.account, this.someRando] = await ethers.getSigners();
        const _pt6 = await deployPoseidon();
        const _tree = await (await ethers.getContractFactory("IncrementalQuinTree", {
            libraries : {
            PoseidonT6 : _pt6.address
            }
        }
        )).deploy();
        this.mt = await (await ethers.getContractFactory("MerkleTree", {
            libraries : {
                IncrementalQuinTree : _tree.address
                } 
            }
        )).deploy(this.account.address);
    });
    // it("Only owner can add leaf", async function (){
    //     await expect(this.mt.insertLeaf(69)).to.not.be.reverted;
    //     await expect(this.mt.connect(this.someRando).insertLeaf(69)).to.be.revertedWith("Only the Hub contract can call this function.");
    // });
    // it("Roots update (this test assumes PoseidonT6)", async function (){
    //     expect(await this.mt.mostRecentRoot()).to.equal(ethers.BigNumber.from("0x13BE4E0DBCDEF8DB5591266757EB74F469AB292AF3F51F2BFA7DCE9329968300"));
    //     let tx = await this.mt.insertLeaf(69);
    //     expect(await this.mt.mostRecentRoot()).to.equal(ethers.BigNumber.from("0x99C5BB728492914F9EBE1688A7F1B390B4D48A5EF2FAFE770F4946A2EDCC12E"));
    // });
    it("Recent roots update correctly for first few", async function (){
        expect(await this.mt.recentRoots(0)).to.equal(0);
        expect(await this.mt.recentRoots(1)).to.equal(0);
        expect(await this.mt.recentRoots(2)).to.equal(0);
        let tx = await this.mt.insertLeaf(69);
        expect(await this.mt.recentRoots(0)).to.equal(ethers.BigNumber.from("0x99C5BB728492914F9EBE1688A7F1B390B4D48A5EF2FAFE770F4946A2EDCC12E"));
        expect(await this.mt.recentRoots(1)).to.equal(0);
        expect(await this.mt.recentRoots(2)).to.equal(0);
        tx = await this.mt.insertLeaf(69690);
        expect(await this.mt.recentRoots(0)).to.equal(ethers.BigNumber.from("0x99C5BB728492914F9EBE1688A7F1B390B4D48A5EF2FAFE770F4946A2EDCC12E"));
        expect(await this.mt.recentRoots(1)).to.equal(ethers.BigNumber.from("0x1F3DCDF98EEDEE3E671C0C9A490D83E418D20CB1DEEB8B6AC6085A8A89755BAF"));
        expect(await this.mt.recentRoots(2)).to.equal(0);

        expect(await this.mt.rootIsRecent(await this.mt.recentRoots(0))).to.equal(true);
        expect(await this.mt.rootIsRecent(await this.mt.recentRoots(1))).to.equal(true);
        expect(await this.mt.rootIsRecent(await this.mt.recentRoots(2))).to.equal(false);
        expect(await this.mt.rootIsRecent(     1234567                )).to.equal(false);
    });
    // it("Root updates correctly cycle over many iterations", async function (){
    //     expect(await this.mt.recentRoots(0)).to.equal(0);
    //     expect(await this.mt.recentRoots(1)).to.equal(0);
    //     expect(await this.mt.recentRoots(2)).to.equal(0);
    //     let tx = await this.mt.insertLeaf(69);
    //     expect(await this.mt.recentRoots(0)).to.equal(ethers.BigNumber.from("0x99C5BB728492914F9EBE1688A7F1B390B4D48A5EF2FAFE770F4946A2EDCC12E"));
    //     expect(await this.mt.recentRoots(1)).to.equal(0);
    //     expect(await this.mt.recentRoots(2)).to.equal(0);
    //     tx = await this.mt.insertLeaf(69690);
    //     expect(await this.mt.recentRoots(0)).to.equal(ethers.BigNumber.from("0x99C5BB728492914F9EBE1688A7F1B390B4D48A5EF2FAFE770F4946A2EDCC12E"));
    //     expect(await this.mt.recentRoots(1)).to.equal(ethers.BigNumber.from("0x1F3DCDF98EEDEE3E671C0C9A490D83E418D20CB1DEEB8B6AC6085A8A89755BAF"));
    //     expect(await this.mt.recentRoots(2)).to.equal(0);
    // });
  });
});
