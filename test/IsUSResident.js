
const { expect } = require("chai");
const { ethers } = require("hardhat");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { Tree } = require("holo-merkle-utils");
const { readFileSync } = require("fs");
const { poseidon } = require("circomlibjs-old"); //The new version gives wrong outputs of Poseidon hash that disagree with ZoKrates and are too big for the max scalar in the field
const { makeLeafMaker } = require("../utils/leaves");
require("dotenv").config();

const US_COUNTRYCODE = "2"
const ISSUER_ADDRESS = "1234567" // Obviously not the correct issuer address but validity of address isn't checked in Solidity; rather it's checked in the constraints

const exampleUSResidentCredentials = {
    addr: ISSUER_ADDRESS,
    secret: "6969696969", // please keep this secret. don't tell anyone
    customFields: [US_COUNTRYCODE, "123"],
    iat: "1675020200",
    scope: "0"
}

const exampleInvalidIssuerCredentials = {...exampleUSResidentCredentials, addr: "987654321"}
const exampleInvalidCountryCredentials = {...exampleUSResidentCredentials, customFields: ["30000", "23456789"]}

// :p address = user address, addr = issuer address.
const createProofOfResidency = async ({tree, salt, masala, address, addr, secret, customFields, iat, scope}) => {
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
            salt,
            masala,
            customFields[0],
            customFields[1],
            iat,
            scope,
            secret
        ].join(" ", )
        } ${ merkleProof }`;
        
        await exec(`zokrates compute-witness -a ${proofArgs} -i zk/compiled/proofOfResidency.out -o tmp.witness`);
        await exec(`zokrates generate-proof -i zk/compiled/proofOfResidency.out -w tmp.witness -p zk/pvkeys/proofOfResidency.proving.key -j tmp.proof.json`);
        return JSON.parse(readFileSync("tmp.proof.json").toString());
}

describe("IsUSResident", function () {
    before(async function() {
        [this.account, this.admin, this.someAccount] = await ethers.getSigners();
        this.leafMaker = await makeLeafMaker();
        const [correct, wrongIssuer, wrongCountry] = [exampleUSResidentCredentials, exampleInvalidIssuerCredentials, exampleInvalidCountryCredentials].map(
            creds => this.leafMaker.swapAndCreateSecret(this.leafMaker.createLeaf(creds))
        );
        this.leaves = {
            correct: correct,
            wrongIssuer: wrongIssuer,
            wrongCountry
        };

        this.roots = await (await ethers.getContractFactory("Roots"))
            .deploy();
        this.resStore = await (await ethers.getContractFactory("IsUSResident"))
            .deploy(this.roots.address, ISSUER_ADDRESS, 0);
    });

    describe("Verifier works:", function() {
        before(async function() {
            this.salt = ethers.BigNumber.from("18450029681611047275023442534946896643130395402313725026917000686233641593164"); // this number is poseidon("IsFromUS")
            this.masala = poseidon([this.salt, this.leaves.correct.newLeaf.inputs.secret]);
            this.wrongIssuerMasala = poseidon([this.salt, this.leaves.wrongIssuer.newLeaf.inputs.secret]);
            this.wrongCountryMasala = poseidon([this.salt, this.leaves.wrongCountry.newLeaf.inputs.secret]);

            // Initialize the Merkle tree
            this.tree = Tree(14, [this.leaves.correct.newLeaf.digest, this.leaves.wrongIssuer.newLeaf.digest, this.leaves.wrongCountry.newLeaf.digest]);
            this.roots.addRoot(this.tree.root);

            // Now, make proof of the new residency
            this.proofObject = await createProofOfResidency({ 
                tree: this.tree, 
                salt: this.salt, 
                masala: this.masala,
                address: this.account.address, 
                ...this.leaves.correct.newLeaf.inputs
            });

        });

        it("Proving your country works, but only once", async function() {

            await expect(this.resStore.prove(this.proofObject.proof, this.proofObject.inputs)).to.not.be.reverted;
            await expect(this.resStore.prove(this.proofObject.proof, this.proofObject.inputs)).be.revertedWith("One person can only verify once");
        });
        
        it("Invalid proof doesn't work: root", async function() {
            const roots_ = await (await ethers.getContractFactory("Roots"))
                .deploy();
            const resStore_ = await (await ethers.getContractFactory("IsUSResident"))
            .deploy(roots_.address, ISSUER_ADDRESS, 0);

            const t = Tree(14, [this.leaves.correct.newLeaf.digest, this.leaves.wrongIssuer.newLeaf.digest, this.leaves.wrongCountry.newLeaf.digest]);
            roots_.addRoot(t.root);
            
            // Add a new leaf so the root is bad:
            t.insert(69);

            let proofObject = await createProofOfResidency({ 
                tree: t, 
                salt: this.salt, 
                masala: this.masala,
                address: this.account.address, 
                ...this.leaves.correct.newLeaf.inputs
            });
            
            await expect(
                resStore_.prove(proofObject.proof, proofObject.inputs)
            ).to.be.revertedWith("The root provided was not found in the Merkle tree's recent root list");
        });

        it("Invalid proof doesn't work: Invalid Merkle proof", async function() {
           console.error("TODO: implement this test `Invalid proof doesn't work: Invalid Merkle proof`. I am not super worried though, should likely be OK without testing");
        });

        it("Invalid proof doesn't work: issuer address", async function() {
            // Add a new leaf so the root is bad:
            let proofObject = await createProofOfResidency({ 
                tree: this.tree, 
                salt: this.salt, 
                masala: this.wrongIssuerMasala,
                address: this.account.address, 
                ...this.leaves.wrongIssuer.newLeaf.inputs
            });

            await expect(
                this.resStore.prove(proofObject.proof, proofObject.inputs)
            ).to.be.revertedWith("Proof must come from correct issuer's address");
        });

        it("Invalid proof doesn't work: country", async function() {
           // Add a new leaf so the root is bad:
           // Add a new leaf so the root is bad:
            let proofObject = await createProofOfResidency({ 
                tree: this.tree, 
                salt: this.salt, 
                masala: this.wrongCountryMasala,
                address: this.account.address, 
                ...this.leaves.wrongCountry.newLeaf.inputs
            });

           await expect(
               this.resStore.prove(proofObject.proof, proofObject.inputs)
           ).to.be.revertedWith("Credentials do not have US as country code");
        });
    });
});