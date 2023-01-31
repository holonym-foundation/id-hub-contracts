// Test PaidProofs (using SybilResistance contract)
describe.only("Pricing", function() {
    before(async function () {
        [this.account, this.admin, this.someAccount] = await ethers.getSigners();

        this.roots = await (await ethers.getContractFactory("Roots"))
            .connect(this.admin).deploy();
        this.sr = await (await ethers.getContractFactory("SybilResistance"))
            .connect(this.admin).deploy(this.roots.address, ISSUER_ADDRESS, 0);
    });
    
    it("Only owner can change price", async function() {
        await expect(this.sr.connect(this.account).setPrice(69)).to.be.revertedWith("Ownable: caller is not the owner");
        expect(await this.sr.price()).to.equal(0);
        await expect(this.sr.connect(this.admin).setPrice(69)).to.not.be.reverted;
        expect(await this.sr.price()).to.equal(69);
      
    });

    it("Only when price is paid does tx go thru", async function() {
        let proofObject = await createSRProof({ 
            tree: this.tree, 
            actionId: this.actionId, 
            masala: this.masala,
            address: this.account.address, 
            ...this.leaves.correct.newLeaf.inputs
        });
        await expect(this.sr.prove(proofObject.proof, proofObject.inputs)).to.be.revertedWith("Missing payment");
        await expect(this.sr.prove(proofObject.proof, proofObject.inputs, { value : 68 })).to.be.revertedWith("Missing payment");
        await expect(this.sr.prove(proofObject.proof, proofObject.inputs, { value: 69 } )).to.not.be.reverted;
    });

    it("Only owner can get funds", async function() {
        const startingAdminBalance = await ethers.provider.getBalance(this.admin.address);
        const startingSRBalance = await ethers.provider.getBalance(this.sr.address);
        await expect(this.sr.connect(this.account).collectPayments()).to.be.revertedWith("Ownable: caller is not the owner");
        expect(await ethers.provider.getBalance(this.sr.address)).to.equal(startingSRBalance);
        await expect(this.sr.connect(this.admin).collectPayments()).to.not.be.reverted();
        expect(await ethers.provider.getBalance(this.admin.address)).to.equal(startingAdminBalance + 69);
    });
});