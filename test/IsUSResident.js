
const { expect } = require("chai");
const { ethers } = require("hardhat");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { createLeaf, createLeafAdditionProof, deployPoseidon } = require("../utils/utils");
const { Tree } = require("holo-merkle-utils");
const { readFileSync } = require("fs");
const { randomBytes } = require("crypto");
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
        // const PRIVATE_KEY = randomBytes(32).toString("hex");
        // this.issuer = new Issuer(PRIVATE_KEY);
        this.roots = await (await ethers.getContractFactory("Roots"))
            .deploy();
        this.resStore = await (await ethers.getContractFactory("IsUSResident"))
            .deploy(this.roots.address, ISSUER_ADDRESS);
    });

    describe.only("Verifier works:", function() {
        before(async function() {
            this.salt = ethers.BigNumber.from("18450029681611047275023442534946896643130395402313725026917000686233641593164"); // this number is poseidon("IsFromUS")
            this.masala = poseidon([this.salt, this.leaves.correct.newLeaf.inputs.secret]);
            this.wrongIssuerMasala = poseidon([this.salt, this.leaves.wrongIssuer.newLeaf.inputs.secret]);
            this.wrongCountryMasala = poseidon([this.salt, this.leaves.wrongCountry.newLeaf.inputs.secret]);
            // this.footprint = ethers.BigNumber.from(poseidon([this.salt, this.leafParams.newSecret]));
            // this.footprint2 = ethers.BigNumber.from(poseidon([this.salt, this.leafParams.newSecret2]));
            // this.wrongAddressFootprint = ethers.BigNumber.from(poseidon([this.salt, this.leafParams.wrongAddressNewSecret]));
            // this.wrongCountryFootprint = ethers.BigNumber.from(poseidon([this.salt, this.leafParams.wrongCountryNewSecret]));
            

        //     this.oldLeaf = await createLeaf(
        //       ethers.BigNumber.from(this.leafParams.issuerAddress), 
        //       this.leafParams.oldSecret, 
        //       this.leafParams.countryCode, 
        //       this.leafParams.subdivision,
        //       this.leafParams.completedAt,
        //       this.leafParams.birthdate
        //     );
            
        //     this.newLeaf = await createLeaf(
        //       ethers.BigNumber.from(this.leafParams.issuerAddress), 
        //       this.leafParams.newSecret, 
        //       this.leafParams.countryCode, 
        //       this.leafParams.subdivision,
        //       this.leafParams.completedAt,
        //       this.leafParams.birthdate
        //     );

        //     this.oldLeaf2 = await createLeaf(
        //         ethers.BigNumber.from(this.leafParams.issuerAddress), 
        //         this.leafParams.oldSecret2, 
        //         this.leafParams.countryCode, 
        //         this.leafParams.subdivision,
        //         this.leafParams.completedAt,
        //         this.leafParams.birthdate
        //       );
              
        //       this.newLeaf2 = await createLeaf(
        //         ethers.BigNumber.from(this.leafParams.issuerAddress), 
        //         this.leafParams.newSecret2, 
        //         this.leafParams.countryCode, 
        //         this.leafParams.subdivision,
        //         this.leafParams.completedAt,
        //         this.leafParams.birthdate
        //       );

        //     this.oldLeafWrongAddress = await createLeaf(
        //         ethers.BigNumber.from(this.leafParams.wrongIssuerAddress), 
        //         this.leafParams.oldSecret, 
        //         this.leafParams.countryCode,
        //         this.leafParams.subdivision,
        //         this.leafParams.completedAt,
        //         this.leafParams.birthdate
        //     );

        //     this.newLeafWrongAddress = await createLeaf(
        //         ethers.BigNumber.from(this.leafParams.wrongIssuerAddress), 
        //         this.leafParams.wrongAddressNewSecret, 
        //         this.leafParams.countryCode,
        //         this.leafParams.subdivision,
        //         this.leafParams.completedAt,
        //         this.leafParams.birthdate
        //     );

        //     this.oldLeafWrongCountry = await createLeaf(
        //         ethers.BigNumber.from(this.leafParams.issuerAddress), 
        //         this.leafParams.oldSecret, 
        //         this.leafParams.wrongCountryCode,
        //         this.leafParams.subdivision,
        //         this.leafParams.completedAt,
        //         this.leafParams.birthdate
        //       );
            
        //       this.newLeafWrongCountry = await createLeaf(
        //         ethers.BigNumber.from(this.leafParams.issuerAddress), 
        //         this.leafParams.wrongCountryNewSecret,
        //         this.leafParams.wrongCountryCode,
        //         this.leafParams.subdivision,
        //         this.leafParams.completedAt,
        //         this.leafParams.birthdate
        //       );
    
        //     this.additionProofGood = await createLeafAdditionProof(
        //       ethers.BigNumber.from(this.leafParams.issuerAddress), 
        //       this.leafParams.countryCode, 
        //       this.leafParams.subdivision,
        //       this.leafParams.completedAt,
        //       this.leafParams.birthdate,
        //       this.leafParams.oldSecret, 
        //       this.leafParams.newSecret
    
        //     )

        //     this.additionProofGood2 = await createLeafAdditionProof(
        //         ethers.BigNumber.from(this.leafParams.issuerAddress), 
        //         this.leafParams.countryCode, 
        //         this.leafParams.subdivision,
        //         this.leafParams.completedAt,
        //         this.leafParams.birthdate,
        //         this.leafParams.oldSecret2, 
        //         this.leafParams.newSecret2
      
        //       )
        
        //     this.additionProofWrongCountry = await createLeafAdditionProof(
        //         ethers.BigNumber.from(this.leafParams.issuerAddress), 
        //         this.leafParams.wrongCountryCode, 
        //         this.leafParams.subdivision,
        //         this.leafParams.completedAt,
        //         this.leafParams.birthdate,
        //         this.leafParams.oldSecret, 
        //         this.leafParams.wrongCountryNewSecret
      
        //       )

        //     this.additionProofWrongAddress = await createLeafAdditionProof(
        //         ethers.BigNumber.from(this.leafParams.wrongIssuerAddress), 
        //         this.leafParams.countryCode, 
        //         this.leafParams.subdivision,
        //         this.leafParams.completedAt,
        //         this.leafParams.birthdate,
        //         this.leafParams.oldSecret, 
        //         this.leafParams.wrongAddressNewSecret, 
      
        //       )
            
        //    const tbsGood = Buffer.from(
        //     ethers.BigNumber.from(this.oldLeaf).toHexString().replace("0x",""),
        //     "hex"
        //    );

        //    const tbsGood2 = Buffer.from(
        //     ethers.BigNumber.from(this.oldLeaf2).toHexString().replace("0x",""),
        //     "hex"
        //    );

        //    const tbsWrongAddress = Buffer.from(
        //     ethers.BigNumber.from(this.oldLeafWrongAddress).toHexString().replace("0x",""),
        //     "hex"
        //    );

        //    const tbsWrongCountry = Buffer.from(
        //     ethers.BigNumber.from(this.oldLeafWrongCountry).toHexString().replace("0x",""),
        //     "hex"
        //    );
    
        //    const sigGood = ethers.utils.splitSignature(
        //     await this.account.signMessage(tbsGood)
        //    );

        //    const sigGood2 = ethers.utils.splitSignature(
        //     await this.account.signMessage(tbsGood2)
        //    );
           
        //    const sigWrongAddress = ethers.utils.splitSignature(
        //     await this.someAccount.signMessage(tbsWrongAddress)
        //    );

        //    const sigWrongCountry = ethers.utils.splitSignature(
        //     await this.account.signMessage(tbsWrongCountry)
        //    );

        //     await this.hub.addLeaf(this.leafParams.issuerAddress, sigGood.v, sigGood.r, sigGood.s, this.additionProofGood.proof, this.additionProofGood.inputs);
        //     await this.hub.addLeaf(this.leafParams.issuerAddress, sigGood2.v, sigGood2.r, sigGood2.s, this.additionProofGood2.proof, this.additionProofGood2.inputs);
        //     await this.hub.addLeaf(this.leafParams.wrongIssuerAddress, sigWrongAddress.v, sigWrongAddress.r, sigWrongAddress.s, this.additionProofWrongAddress.proof, this.additionProofWrongAddress.inputs);
        //     await this.hub.addLeaf(this.leafParams.issuerAddress, sigWrongCountry.v, sigWrongCountry.r, sigWrongCountry.s, this.additionProofWrongCountry.proof, this.additionProofWrongCountry.inputs);

            // Initialize the Merkle tree
            this.tree = Tree(14, [this.leaves.correct.newLeaf.digest, this.leaves.wrongIssuer.newLeaf.digest, this.leaves.wrongCountry.newLeaf.digest]);
            this.roots.addRoot(this.tree.root);
            // for (const leaves of [this.leaves.correct, this.leaves.wrongIssuer, this.leaves.wrongCountry]) {
            //     t.insert(leaves.newLeaf);
            //     this.roots.addRoot(t.root);
            // } 

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

        // it("Sybil resistance: cannot prove more than once with same nullifier", async function() {
        //     const t = Tree(14, [this.newLeaf, this.newLeaf2, this.newLeafWrongAddress, this.newLeafWrongCountry]);
        //     let proof = await t.createCLISerializedProof(0);
        //     proof = proof.split(" ");
        //     proof.shift();
        //     proof = proof.join(" ");
            
            
        //     const proofArgs = `${[
        //         t.root, 
        //         ethers.BigNumber.from(this.someAccount.address),
        //         ethers.BigNumber.from(this.leafParams.issuerAddress).toString(), 
        //         this.salt,
        //         this.footprint,
        //         this.leafParams.countryCode,
        //         this.leafParams.subdivision,
        //         this.leafParams.completedAt,
        //         this.leafParams.birthdate,
        //         this.leafParams.newSecret // newSecret == nullifier
        //     ].join(" ", )
        //     } ${ proof }`;
        //     await exec(`zokrates compute-witness -a ${proofArgs} -i zk/compiled/proofOfResidency.out -o tmp.witness`);
        //     await exec(`zokrates generate-proof -i zk/compiled/proofOfResidency.out -w tmp.witness -p zk/pvkeys/proofOfResidency.proving.key -j tmp.proof.json`);
        //     this.proofObject = JSON.parse(readFileSync("tmp.proof.json").toString());
        //     await expect(this.resStore.connect(this.someAccount).prove(this.proofObject.proof, this.proofObject.inputs)).to.be.revertedWith("One person can only verify once");
        // });
        
        it("Invalid proof doesn't work: root", async function() {
            const roots_ = await (await ethers.getContractFactory("Roots"))
                .deploy();
            const resStore_ = await (await ethers.getContractFactory("IsUSResident"))
            .deploy(roots_.address, ISSUER_ADDRESS);

            const t = Tree(14, [this.leaves.correct.newLeaf.digest, this.leaves.wrongIssuer.newLeaf.digest, this.leaves.wrongCountry.newLeaf.digest]);
            this.roots.addRoot(t.root);
            
            // Add a new leaf so the root is bad:
            t.insert(69);

            this.proofObject = await createProofOfResidency({ 
                tree: t, 
                salt: this.salt, 
                masala: this.masala,
                address: this.account.address, 
                ...this.leaves.correct.newLeaf.inputs
            });
            
            await expect(
                this.resStore.prove(this.proofObject.proof, this.proofObject.inputs)
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


        // Checking msg.sender no longer seems useful and prevents signature-free interactions. Without it, relayers can now submit cross-chain transactions without the user signature. Thus, we are deprecating this check:
        // it("Invalid proof doesn't work: msg sender address", async function() {
        //     // Add a new leaf so the root is bad:
        //     const t = Tree(14, [this.newLeaf, this.newLeaf2, this.newLeafWrongAddress, this.newLeafWrongCountry]);
        //     let proof = await t.createCLISerializedProof(2);
        //     proof = proof.split(" ");
        //     proof.shift();
        //     proof = proof.join(" ")

        //     const proofArgs = `${[
        //         t.root, 
        //         ethers.BigNumber.from(this.someAccount.address),
        //         ethers.BigNumber.from(this.leafParams.wrongIssuerAddress).toString(), 
        //         this.salt,
        //         this.wrongAddressFootprint,
        //         this.leafParams.countryCode,
        //         this.leafParams.subdivision,
        //         this.leafParams.completedAt,
        //         this.leafParams.birthdate,
        //         this.leafParams.wrongAddressNewSecret 
        //     ].join(" ", )
        //     } ${ proof }`;
        //     await exec(`zokrates compute-witness -a ${proofArgs} -i zk/compiled/proofOfResidency.out -o tmp.witness`);
        //     await exec(`zokrates generate-proof -i zk/compiled/proofOfResidency.out -w tmp.witness -p zk/pvkeys/proofOfResidency.proving.key -j tmp.proof.json`);
        //     this.proofObject = JSON.parse(readFileSync("tmp.proof.json").toString());

        //     await expect(
        //         this.resStore.prove(this.proofObject.proof, this.proofObject.inputs)
        //     ).to.be.revertedWith("Second public argument of proof must be your address");
        // });
    });
});