
const { expect } = require("chai");
const { ethers } = require("hardhat");
    
describe("ProofRouter", function () {
    before(async function() {
        [this.account, this.ownershipTestAccount, this.someAccount] = await ethers.getSigners();

        this.alb = await (await ethers.getContractFactory("AddLeafBig")).deploy();
        this.als = await (await ethers.getContractFactory("AddLeafSmall")).deploy();
        this.hub = await (await ethers.getContractFactory("Hub")).deploy(this.alb.address, this.als.address, this.ownershipTestAccount.address);
        this.router = await (await ethers.getContractFactory("ProofRouter")).attach(await this.hub.router());
        
        console.log("a", this.router.address);
    })
    it("Owner is correct", async function (){
        expect(await this.router.owner()).to.equal(this.ownershipTestAccount.address);
    })

    it("Only owner can add a new route", async function (){
        await expect(this.router.
                addRoute("someProof", this.someAccount.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");

        expect(await this.router.connect(this.ownershipTestAccount).
                addRoute("someProof", this.someAccount.address)
        ).to.not.be.reverted;
    })

    it("Cannot override existing route", async function (){
        const addTheRoute = async () => await this.router.connect(this.ownershipTestAccount).addRoute("someOtherProof", this.someAccount.address);
        await addTheRoute(); 
        await expect(addTheRoute()).to.be.revertedWith("cannot override existing route");
    });

});