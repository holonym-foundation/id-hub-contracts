
const { expect } = require("chai");
const { ethers } = require("hardhat");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { Tree } = require("holo-merkle-utils");
const { readFileSync } = require("fs");
const { poseidon } = require("circomlibjs-old"); //The new version gives wrong outputs of Poseidon hash that disagree with ZoKrates and are too big for the max scalar in the field
const { makeLeafMaker } = require("../../utils/leaves");
require("dotenv").config();


const ISSUER_ADDRESS = "1234567" // Obviously not the correct issuer address but validity of address isn't checked in Solidity; rather it's checked in the constraints

const exampleCreds = {
    addr: ISSUER_ADDRESS,
    secret: "6969696969", // please keep this secret. don't tell anyone
    customFields: ["453", "77"],
    iat: "1675020200",
    scope: "0"
}

const exampleInvalidIssuerCreds= {...exampleCreds, addr: "987654321"}

const createSRProof= async ({tree, actionId, masala, address, addr, secret, customFields, iat, scope}) => {
    const leaf = poseidon([addr, secret, customFields[0], customFields[1], iat, scope]);
    const idx = tree.indexOf(leaf)
    let merkleProof = await tree.createCLISerializedProof(idx);
    merkleProof = merkleProof.split(" ");
    merkleProof.shift();
    merkleProof = merkleProof.join(" ")
    const proofArgs = `${[
            tree.root, 
            BigInt(address).toString(), // User address
            addr, // Issuer address
            actionId,
            masala,
            customFields[0],
            customFields[1],
            iat,
            scope,
            secret
        ].join(" ", )
        } ${ merkleProof }`;
        
        await exec(`zokrates compute-witness -a ${proofArgs} -i zk/compiled/antiSybil.out -o tmp.witness`);
        await exec(`zokrates generate-proof -i zk/compiled/antiSybil.out -w tmp.witness -p zk/pvkeys/antiSybil.proving.key -j tmp.proof.json`);
        let r = JSON.parse(readFileSync("tmp.proof.json").toString());
        await exec(`rm -r out.wtns tmp.witness tmp.proof.json`);
        return r;
    }

describe("SybilResistance", function () {
    before(async function() {
        [this.account, this.admin, this.someAccount] = await ethers.getSigners();
        this.leafMaker = await makeLeafMaker();
        const [correct, wrongIssuer] = [exampleCreds, exampleInvalidIssuerCreds].map(
            creds => this.leafMaker.swapAndCreateSecret(this.leafMaker.createLeaf(creds))
        );
        this.leaves = {
            correct: correct,
            wrongIssuer: wrongIssuer,
        };

        this.roots = await (await ethers.getContractFactory("Roots"))
            .connect(this.admin).deploy();
        this.sr = await (await ethers.getContractFactory("SybilResistance"))
            .connect(this.admin).deploy(this.roots.address, [ISSUER_ADDRESS], 0, ethers.constants.AddressZero);

        this.actionId = ethers.BigNumber.from("18450029681611047275023442534946896643130395402313725026917000686233641593164"); // this number is poseidon("IsFromUS")
        this.masala = poseidon([this.actionId, this.leaves.correct.newLeaf.inputs.secret]);
        this.wrongIssuerMasala = poseidon([this.actionId, this.leaves.wrongIssuer.newLeaf.inputs.secret]);

        // Initialize the Merkle tree
        this.tree = Tree(14, [this.leaves.correct.newLeaf.digest, this.leaves.wrongIssuer.newLeaf.digest]);
        this.roots.addRoot(this.tree.root);

        
    });
     
    describe("Verifier works:", function() {
        before(async function() {
            // Reset the price to zero for the rest of the tests
            // await this.sr.connect(this.admin).setPrice(0);

            this.proofObject = await createSRProof({ 
                tree: this.tree, 
                actionId: this.actionId, 
                masala: this.masala,
                address: this.account.address, 
                ...this.leaves.correct.newLeaf.inputs
            });
        });

        it("msgSenderAddress is constrained; nobody can frontrun by changing the address in the public inputs", async function() {
            const badInputs = [...this.proofObject.inputs];
            badInputs[1] = '0x0000000000000000000000000000000000000000000000000000000000000069';
            await expect(this.sr.prove(this.proofObject.proof, badInputs)).to.be.revertedWith("Failed to verify ZKP");
        });

        it("Proving uniqueness once works", async function() {
            // Check we aren't verified
            expect(await this.sr.isUniqueForAction(this.account.address, this.actionId)).to.equal(false);

            let tx = this.sr.prove(this.proofObject.proof, this.proofObject.inputs);

            expect(tx).to.emit(this.sr, "Uniqueness").withArgs(this.account.address, this.actionId);

            await (await tx).wait();
            await ethers.provider.send("evm_mine");
            // Check we are verified

            expect(await this.sr.isUniqueForAction(this.account.address, this.actionId)).to.equal(true);  
          
        });


        it("Using the same nullifier, cannot prove twice", async function() {
            await expect(this.sr.connect(this.someAccount).prove(this.proofObject.proof, this.proofObject.inputs)).to.be.revertedWith("One person can only verify once");
        });
        
        it("Invalid proof doesn't work: issuer address", async function() {
            let proofObject = await createSRProof({ 
                tree: this.tree, 
                actionId: this.actionId, 
                masala: this.wrongIssuerMasala,
                address: this.account.address, 
                ...this.leaves.wrongIssuer.newLeaf.inputs
            });
            await expect(
                this.sr.prove(proofObject.proof, proofObject.inputs)
            ).to.be.revertedWith("Proof must come from correct issuer's address");
        });

        it("Invalid proof doesn't work: root", async function() {
            // Add a new leaf so the root is bad:
            const roots_ = await (await ethers.getContractFactory("Roots"))
                .deploy();
            const sr = await (await ethers.getContractFactory("SybilResistance"))
            .deploy(roots_.address, [ISSUER_ADDRESS], 0, ethers.constants.AddressZero);

            const tree = Tree(14, [this.leaves.correct.newLeaf.digest, this.leaves.wrongIssuer.newLeaf.digest]);
            this.roots.addRoot(tree.root);
            
            // Add a new leaf so the root is bad:
            tree.insert(69);

            let proofObject = await createSRProof({ 
                tree: tree, 
                actionId: this.actionId, 
                masala: this.masala,
                address: this.account.address, 
                ...this.leaves.correct.newLeaf.inputs
            });

            await expect(
                sr.prove(proofObject.proof, proofObject.inputs)
            ).to.be.revertedWith("The root provided was not found in the Merkle tree's recent root list");
        });

        it("Invalid proof doesn't work: Invalid Merkle proof", async function() {
            console.error("TODO: implement this test `Invalid proof doesn't work: Invalid Merkle proof`. I am not super worried though, should likely be OK without testing");
         });

        // Checking msg.sender no longer seems useful and prevents signature-free interactions. Without it, relayers can now submit cross-chain transactions without the user signature. Thus, we are deprecating this check:
        // it("Invalid proof doesn't work: msg sender address", async function() {
        //     // Add a new leaf so the root is bad:
        //     const t = Tree(14, [this.newLeaf, this.newLeaf2, this.newLeafWrongAddress]);
        //     let proof = await t.createCLISerializedProof(2);
        //     proof = proof.split(" ");
        //     proof.shift();
        //     proof = proof.join(" ")

        //     const proofArgs = `${[
        //         t.root, 
        //         ethers.BigNumber.from(this.someAccount.address),
        //         ethers.BigNumber.from(this.leafParams.wrongIssuerAddress).toString(), 
        //         this.actionId,
        //         this.wrongAddressFootprint,
        //         this.leafParams.countryCode,
        //         this.leafParams.subdivision,
        //         this.leafParams.completedAt,
        //         this.leafParams.birthdate,
        //         this.leafParams.wrongAddressNewSecret 
        //     ].join(" ", )
        //     } ${ proof }`;
        //     await exec(`zokrates compute-witness -a ${proofArgs} -i zk/compiled/antiSybil.out -o tmp.witness`);
        //     await exec(`zokrates generate-proof -i zk/compiled/antiSybil.out -w tmp.witness -p zk/pvkeys/antiSybil.proving.key -j tmp.proof.json`);
        //     this.proofObject = JSON.parse(readFileSync("tmp.proof.json").toString());

        //     await expect(
        //         this.sr.prove(this.proofObject.proof, this.proofObject.inputs)
        //     ).to.be.revertedWith("Second public argument of proof must be your address");
        // });
    });
});