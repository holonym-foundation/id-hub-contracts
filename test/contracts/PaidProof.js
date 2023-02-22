
const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
// Test PaidProofs (using SybilResistance contract as test case, since it inherits from PaidProofs)

// Example root / proof / issuer address combination
const ISSUER_ADDRESS =  "1234567"
const PROOF = {"scheme":"g16","curve":"bn128","proof":{"a":["0x10582421b5e68d0c9fe88753282c053f3e1ad2ec0be7bae3f82a086863888bed","0x105b542d4c52610490d6e156cc5a6d847de0bbec210655c53049dcd50011055e"],"b":[["0x04064815ffda0e9581e7a67e41be60347386d311e61c591556e094ed2a288f6a","0x248e27caaf155e7634f95937685ed21e7a5a5046087b04386981e70b91cf5fad"],["0x11ee6b72672c6800e2c9ddf3ac0c961f30fe267e8cbbdf47fd88d81ef68f3c6f","0x137eea59c4b8ef5eaedf35335a9179ee69b06886fa1b2f616c17a51c793880f8"]],"c":["0x1176bdba2c6328287225e744fc0869dd49770a1cccede86e3542d6ef27b64d1c","0x28f093827921e038da83fe1d1cc692d55c734b436b5fe17b90fa731fee122e21"]},"inputs":["0x083fa5bd25d167448139ee3f23517c549521e5b580e498adb6e3a554c15c674d","0x000000000000000000000000c8834c1fcf0df6623fc8c8ed25064a4148d99388","0x000000000000000000000000000000000000000000000000000000000012d687","0x28ca58c3c1044c5277405071d5e3754aeaa4f91dae2c8647275f0b168ae4a94c","0x12c78a2e2dc214eec2a4bceb57ebbb860dc09570c32510583ad6c0db86a0648d"]}
const ROOT = 3730958041307008203732934007029188719690024470195382229713059198096625133389n;

describe.only("PaidProofs", function() {
    before(async function () {
        [this.account, this.admin, this.someAccount] = await ethers.getSigners();

        this.roots = await (await ethers.getContractFactory("Roots"))
            .connect(this.admin).deploy();
        this.sr = await (await ethers.getContractFactory("SybilGovID"))
            .connect(this.admin).deploy(this.roots.address, [ISSUER_ADDRESS, 69], 0, ethers.constants.AddressZero);

        this.roots.addRoot(ROOT);
    });

    describe("Payment", function() {
        it("Only owner can change price", async function() {
            await expect(this.sr.connect(this.account).setPrice(69)).to.be.revertedWith("Ownable: caller is not the owner");
            expect(await this.sr.price()).to.equal(0);
            await expect(this.sr.connect(this.admin).setPrice(69)).to.not.be.reverted;
            expect(await this.sr.price()).to.equal(69);
          
        });
    
        it("Only when price is paid does tx go thru", async function() {
            await expect(this.sr.prove(PROOF.proof, PROOF.inputs)).to.be.revertedWith("Missing payment");
            await expect(this.sr.prove(PROOF.proof, PROOF.inputs, { value : 68 })).to.be.revertedWith("Missing payment");
            await expect(this.sr.prove(PROOF.proof, PROOF.inputs, { value: 12345678969 } )).to.not.be.reverted;
        });
    
        it("Only owner can get funds", async function() {
            const startingSRBalance = await ethers.provider.getBalance(this.sr.address);
            await expect(this.sr.connect(this.account).collectPayments()).to.be.revertedWith("Ownable: caller is not the owner");
            expect(await ethers.provider.getBalance(this.sr.address)).to.equal(startingSRBalance);
    
            const startingAdminBalance = await ethers.provider.getBalance(this.admin.address);
            const collectPayments = this.sr.connect(this.admin).collectPayments()
            await expect(await collectPayments).to.not.be.reverted;
            const receipt = await (await collectPayments).wait();
            expect(await ethers.provider.getBalance(this.sr.address)).to.equal("0");
            
            // New balance minus gas shouldn't be lower than this! just double checking that the balance is actually transferred, without going into minutia of gas:
            expect(
                BigNumber.from(await ethers.provider.getBalance(this.admin.address))
            ).to.equal(
                BigNumber.from(startingAdminBalance)
                .add(12345678969)
                .sub(receipt.gasUsed * receipt.effectiveGasPrice)
            );
        });
    });

    describe("Issuer", function() {
        it("Only owner can change issuers", async function() {
            await expect(this.sr.connect(this.account).allowIssuers([123456789, 987654321])).to.be.revertedWith("Ownable: caller is not the owner");
            expect((await this.sr.isValidIssuer(123456789)) || (await this.sr.isValidIssuer(987654321))).to.equal(false);
            await expect(this.sr.connect(this.admin).allowIssuers([123456789, 987654321])).to.not.be.reverted;
            expect((await this.sr.isValidIssuer(123456789)) && (await this.sr.isValidIssuer(987654321))).to.equal(true);
          
        });
    
        it("Removing issuers prevents otherwise valid proofs", async function() {
            await expect(this.sr.connect(this.admin).revokeIssuers([ISSUER_ADDRESS])).to.not.be.reverted;
            await expect(this.sr.prove(PROOF.proof, PROOF.inputs, { value: 12345678969 } )).to.be.revertedWith("Proof must come from correct issuer's address");
        });
    
    });
    
});