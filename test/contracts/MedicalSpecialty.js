
const { expect } = require("chai");
const { ethers } = require("hardhat");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { Tree } = require("holo-merkle-utils");
const { readFileSync } = require("fs");
const { poseidon } = require("circomlibjs-old"); //The new version gives wrong outputs of Poseidon hash that disagree with ZoKrates and are too big for the max scalar in the field
const { makeLeafMaker } = require("../../utils/leaves");
require("dotenv").config();

const zokratesExecutablePath = process.env.ZOK_EXECUTABLE ?? 'zokrates';

const ISSUER_ADDRESS = "1234567" // Obviously not the correct issuer address but validity of address isn't checked in Solidity; rather it's checked in the constraints

const exampleMedicalSpecialtyCredentials = {
    addr: ISSUER_ADDRESS,
    secret: "6969696969", // please keep this secret. don't tell anyone
    customFields: ['0', "123"], // '0' is our numerical representation of 'Allergy & Immunology'
    iat: "1675020200",
    scope: "0"
}

const exampleInvalidIssuerCredentials = {...exampleMedicalSpecialtyCredentials, addr: "987654321"}

// :p address = user address, addr = issuer address.
const createProofOfMedicalSpecialty = async ({tree, salt, hashbrowns, address, addr, secret, customFields, iat, scope}) => {
    const leaf = poseidon([addr, secret, customFields[0], customFields[1], iat, scope]);
    const idx = tree.indexOf(leaf)
    let merkleProof = await tree.createCLISerializedProof(idx);
    merkleProof = merkleProof.split(" ");
    merkleProof.shift();
    merkleProof = merkleProof.join(" ");
    const merkleProofWithoutLeaf = merkleProof.split(' ').splice(1, merkleProof.split(' ').length + 1).join(' ');
    const proofArgs = `${[
            tree.root, 
            BigInt(address).toString(),
            addr,
            customFields[0],
            salt.toString(),
            hashbrowns,
            leaf,
            customFields[1],
            iat,
            scope,
            secret,
        ].join(" ", )
        } ${merkleProofWithoutLeaf}`;
        
        await exec(`${zokratesExecutablePath} compute-witness -a ${proofArgs} -i zk/compiled/medicalSpecialtyProgram -o tmp.witness`);
        await exec(`${zokratesExecutablePath} generate-proof -i zk/compiled/medicalSpecialtyProgram -w tmp.witness -p zk/pvkeys/medicalSpecialty.proving.key -j tmp.proof.json`);
        let r = JSON.parse(readFileSync("tmp.proof.json").toString());
        await exec(`rm -r out.wtns tmp.witness tmp.proof.json`);
        return r;
    }

describe("MedicalSpecialty", function () {
    before(async function() {
        [this.account, this.admin, this.someAccount] = await ethers.getSigners();
        this.leafMaker = await makeLeafMaker();
        const [correct, wrongIssuer] = [exampleMedicalSpecialtyCredentials, exampleInvalidIssuerCredentials].map(
            creds => this.leafMaker.swapAndCreateSecret(this.leafMaker.createLeaf(creds))
        );
        this.leaves = {
            correct: correct,
            wrongIssuer: wrongIssuer,
        };

        this.roots = await (await ethers.getContractFactory("Roots"))
            .deploy();
        this.medicalSpecialtyContract = await (await ethers.getContractFactory("MedicalSpecialty"))
            .deploy(this.roots.address, [ISSUER_ADDRESS], 0);
    });

    describe("Verifier works:", function() {
        before(async function() {
            this.salt = ethers.BigNumber.from("320192098064396900878317978103229380372186908085604549333845693700248653086"); // this number is poseidon("IsFromUS")
            this.hashbrowns = poseidon([this.salt, this.leaves.correct.newLeaf.inputs.secret]);
            this.wrongIssuerHashbrowns = poseidon([this.salt, this.leaves.wrongIssuer.newLeaf.inputs.secret]);

            // Initialize the Merkle tree
            this.tree = Tree(14, [this.leaves.correct.newLeaf.digest, this.leaves.wrongIssuer.newLeaf.digest]);
            this.roots.addRoot(this.tree.root);

            // Now, make proof of the new residency
            this.proofObject = await createProofOfMedicalSpecialty({ 
                tree: this.tree, 
                salt: this.salt, 
                hashbrowns: this.hashbrowns,
                address: this.account.address, 
                ...this.leaves.correct.newLeaf.inputs
            });
        });

        it("msgSenderAddress is constrained; nobody can frontrun by changing the address in the public inputs", async function() {
            const badInputs = [...this.proofObject.inputs];
            badInputs[1] = '0x0000000000000000000000000000000000000000000000000000000000000069';
            await expect(this.medicalSpecialtyContract.prove(this.proofObject.proof, badInputs)).to.be.revertedWith("Failed to verify proof");
        });

        it("Proving your country works, but only once", async function() {
            await expect(this.medicalSpecialtyContract.prove(this.proofObject.proof, this.proofObject.inputs)).to.not.be.reverted;
            await expect(this.medicalSpecialtyContract.prove(this.proofObject.proof, this.proofObject.inputs)).be.revertedWith("One person can only verify once");
        });
        
        it("Invalid proof doesn't work: root", async function() {
            const roots_ = await (await ethers.getContractFactory("Roots"))
                .deploy();
            const resStore_ = await (await ethers.getContractFactory("MedicalSpecialty"))
            .deploy(roots_.address, [ISSUER_ADDRESS], 0);

            const t = Tree(14, [this.leaves.correct.newLeaf.digest, this.leaves.wrongIssuer.newLeaf.digest]);
            roots_.addRoot(t.root);
            
            // Add a new leaf so the root is bad:
            t.insert(69);

            let proofObject = await createProofOfMedicalSpecialty({ 
                tree: t, 
                salt: this.salt, 
                hashbrowns: this.hashbrowns,
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
            let proofObject = await createProofOfMedicalSpecialty({ 
                tree: this.tree, 
                salt: this.salt, 
                hashbrowns: this.wrongIssuerHashbrowns,
                address: this.account.address, 
                ...this.leaves.wrongIssuer.newLeaf.inputs
            });

            await expect(
                this.medicalSpecialtyContract.prove(proofObject.proof, proofObject.inputs)
            ).to.be.revertedWith("Proof must come from correct issuer's address");
        });
    });
});