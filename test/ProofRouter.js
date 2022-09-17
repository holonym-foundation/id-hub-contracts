
const { expect } = require("chai");
const { ethers } = require("hardhat");
    
describe("ProofRouter", function () {
    before(async function() {
        [this.account, this.admin, this.someAccount] = await ethers.getSigners();

        this.alb = await (await ethers.getContractFactory("AddLeafBig")).deploy();
        this.als = await (await ethers.getContractFactory("AddLeafSmall")).deploy();


        const _pt3 = await (await ethers.getContractFactory("PoseidonT3")).deploy();
        const _tree = await (await ethers.getContractFactory("IncrementalBinaryTree", 
        {
            libraries : {
            PoseidonT3 : _pt3.address
            }
        })).deploy();

        const _hub = await (await ethers.getContractFactory("Hub", {
        libraries : {
            IncrementalBinaryTree : _tree.address
            } 
        })).deploy(this.alb.address, this.als.address, this.admin.address);

        this.hub = _hub;

        this.router = await (await ethers.getContractFactory("ProofRouter")).attach(await this.hub.router());
        
        console.log("a", this.router.address);
    })
    it("Owner is correct", async function (){
        expect(await this.router.owner()).to.equal(this.admin.address);
    })

    it("Only owner can add a new route", async function (){
        await expect(this.router.
                addRoute("someProof", this.someAccount.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");

        expect(await this.router.connect(this.admin).
                addRoute("someProof", this.someAccount.address)
        ).to.not.be.reverted;
    })

    it("Cannot override existing route", async function (){
        const addTheRoute = async () => await this.router.connect(this.admin).addRoute("someOtherProof", this.someAccount.address);
        await addTheRoute(); 
        await expect(addTheRoute()).to.be.revertedWith("cannot override existing route");
    });

});