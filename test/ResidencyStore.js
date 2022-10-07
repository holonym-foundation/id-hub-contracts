
const { expect } = require("chai");
const { ethers } = require("hardhat");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { createLeaf, createLeafAdditionProof, deployPoseidon } = require("../utils/utils");
const { Tree } = require("holo-merkle-utils");
const { readFileSync } = require("fs");
const { randomBytes } = require("crypto");
const { poseidon } = require("circomlibjs-old"); //The new version gives wrong outputs of Poseidon hash that disagree with ZoKrates and are too big for the max scalar in the field
require("dotenv").config();

describe.only("ResidencyStore", function () {
    before(async function() {
        [this.account, this.admin, this.someAccount] = await ethers.getSigners();

        const _pt6 = await deployPoseidon();
        const _tree = await (await ethers.getContractFactory("IncrementalQuinTree", 
        {
            libraries : {
            PoseidonT6 : _pt6.address
            }
        })).deploy();

        const _hub = await (await ethers.getContractFactory("Hub", {
        libraries : {
            IncrementalQuinTree : _tree.address
            } 
        })).deploy(this.admin.address);

        this.hub = _hub;

        this.router = await (await ethers.getContractFactory("ProofRouter")).attach(await this.hub.router());
        this.verifier = await (await ethers.getContractFactory("ProofOfCountry")).deploy();
        await this.router.connect(this.admin).addRoute("USResident", this.verifier.address);
        this.resStore = await (await ethers.getContractFactory("ResidencyStore")).deploy(this.hub.address, "0xC8834C1FcF0Df6623Fc8C8eD25064A4148D99388");
        
    });

    describe("Verifier works:", function() {
        before("Add new proof route and verify the proof ", async function() {
            
            
            // Add a new leaf:
            this.leafParams = {
                issuerAddress : this.account.address,
                wrongIssuerAddress : this.someAccount.address,
                oldSecret : ethers.BigNumber.from(randomBytes(16)),
                newSecret : ethers.BigNumber.from(randomBytes(16)),
                oldSecret2 : ethers.BigNumber.from(randomBytes(16)),
                newSecret2 : ethers.BigNumber.from(randomBytes(16)),
                wrongAddressNewSecret : ethers.BigNumber.from(randomBytes(16)),
                wrongCountryNewSecret : ethers.BigNumber.from(randomBytes(16)),
                countryCode : 2,
                wrongCountryCode : 69,
                subdivision : ethers.BigNumber.from(Buffer.from("NY")),
                completedAt : ethers.BigNumber.from(Math.floor(Date.now()/1000)),
                birthdate : 6969696969
            }
            

            this.salt = ethers.BigNumber.from("18450029681611047275023442534946896643130395402313725026917000686233641593164"); // this number is poseidon("IsFromUS")
            this.footprint = ethers.BigNumber.from(poseidon([this.salt, this.leafParams.newSecret]));
            this.footprint2 = ethers.BigNumber.from(poseidon([this.salt, this.leafParams.newSecret2]));
            this.wrongAddressFootprint = ethers.BigNumber.from(poseidon([this.salt, this.leafParams.wrongAddressNewSecret]));
            this.wrongCountryFootprint = ethers.BigNumber.from(poseidon([this.salt, this.leafParams.wrongCountryNewSecret]));
            

            this.oldLeaf = await createLeaf(
              ethers.BigNumber.from(this.leafParams.issuerAddress), 
              this.leafParams.oldSecret, 
              this.leafParams.countryCode, 
              this.leafParams.subdivision,
              this.leafParams.completedAt,
              this.leafParams.birthdate
            );
            
            this.newLeaf = await createLeaf(
              ethers.BigNumber.from(this.leafParams.issuerAddress), 
              this.leafParams.newSecret, 
              this.leafParams.countryCode, 
              this.leafParams.subdivision,
              this.leafParams.completedAt,
              this.leafParams.birthdate
            );

            this.oldLeaf2 = await createLeaf(
                ethers.BigNumber.from(this.leafParams.issuerAddress), 
                this.leafParams.oldSecret2, 
                this.leafParams.countryCode, 
                this.leafParams.subdivision,
                this.leafParams.completedAt,
                this.leafParams.birthdate
              );
              
              this.newLeaf2 = await createLeaf(
                ethers.BigNumber.from(this.leafParams.issuerAddress), 
                this.leafParams.newSecret2, 
                this.leafParams.countryCode, 
                this.leafParams.subdivision,
                this.leafParams.completedAt,
                this.leafParams.birthdate
              );

            this.oldLeafWrongAddress = await createLeaf(
                ethers.BigNumber.from(this.leafParams.wrongIssuerAddress), 
                this.leafParams.oldSecret, 
                this.leafParams.countryCode,
                this.leafParams.subdivision,
                this.leafParams.completedAt,
                this.leafParams.birthdate
            );

            this.newLeafWrongAddress = await createLeaf(
                ethers.BigNumber.from(this.leafParams.wrongIssuerAddress), 
                this.leafParams.wrongAddressNewSecret, 
                this.leafParams.countryCode,
                this.leafParams.subdivision,
                this.leafParams.completedAt,
                this.leafParams.birthdate
            );

            this.oldLeafWrongCountry = await createLeaf(
                ethers.BigNumber.from(this.leafParams.issuerAddress), 
                this.leafParams.oldSecret, 
                this.leafParams.wrongCountryCode,
                this.leafParams.subdivision,
                this.leafParams.completedAt,
                this.leafParams.birthdate
              );
            
              this.newLeafWrongCountry = await createLeaf(
                ethers.BigNumber.from(this.leafParams.issuerAddress), 
                this.leafParams.wrongCountryNewSecret,
                this.leafParams.wrongCountryCode,
                this.leafParams.subdivision,
                this.leafParams.completedAt,
                this.leafParams.birthdate
              );
    
            this.additionProofGood = await createLeafAdditionProof(
              ethers.BigNumber.from(this.leafParams.issuerAddress), 
              this.leafParams.countryCode, 
              this.leafParams.subdivision,
              this.leafParams.completedAt,
              this.leafParams.birthdate,
              this.leafParams.oldSecret, 
              this.leafParams.newSecret
    
            )

            this.additionProofGood2 = await createLeafAdditionProof(
                ethers.BigNumber.from(this.leafParams.issuerAddress), 
                this.leafParams.countryCode, 
                this.leafParams.subdivision,
                this.leafParams.completedAt,
                this.leafParams.birthdate,
                this.leafParams.oldSecret2, 
                this.leafParams.newSecret2
      
              )
        
            this.additionProofWrongCountry = await createLeafAdditionProof(
                ethers.BigNumber.from(this.leafParams.issuerAddress), 
                this.leafParams.wrongCountryCode, 
                this.leafParams.subdivision,
                this.leafParams.completedAt,
                this.leafParams.birthdate,
                this.leafParams.oldSecret, 
                this.leafParams.wrongCountryNewSecret
      
              )

            this.additionProofWrongAddress = await createLeafAdditionProof(
                ethers.BigNumber.from(this.leafParams.wrongIssuerAddress), 
                this.leafParams.countryCode, 
                this.leafParams.subdivision,
                this.leafParams.completedAt,
                this.leafParams.birthdate,
                this.leafParams.oldSecret, 
                this.leafParams.wrongAddressNewSecret, 
      
              )
            
           const tbsGood = Buffer.from(
            ethers.BigNumber.from(this.oldLeaf).toHexString().replace("0x",""),
            "hex"
           );

           const tbsGood2 = Buffer.from(
            ethers.BigNumber.from(this.oldLeaf2).toHexString().replace("0x",""),
            "hex"
           );

           const tbsWrongAddress = Buffer.from(
            ethers.BigNumber.from(this.oldLeafWrongAddress).toHexString().replace("0x",""),
            "hex"
           );

           const tbsWrongCountry = Buffer.from(
            ethers.BigNumber.from(this.oldLeafWrongCountry).toHexString().replace("0x",""),
            "hex"
           );
    
           const sigGood = ethers.utils.splitSignature(
            await this.account.signMessage(tbsGood)
           );

           const sigGood2 = ethers.utils.splitSignature(
            await this.account.signMessage(tbsGood2)
           );
           
           const sigWrongAddress = ethers.utils.splitSignature(
            await this.someAccount.signMessage(tbsWrongAddress)
           );

           const sigWrongCountry = ethers.utils.splitSignature(
            await this.account.signMessage(tbsWrongCountry)
           );

            await this.hub.addLeaf(this.leafParams.issuerAddress, sigGood.v, sigGood.r, sigGood.s, this.additionProofGood.proof, this.additionProofGood.inputs);
            await this.hub.addLeaf(this.leafParams.issuerAddress, sigGood2.v, sigGood2.r, sigGood2.s, this.additionProofGood2.proof, this.additionProofGood2.inputs);
            await this.hub.addLeaf(this.leafParams.wrongIssuerAddress, sigWrongAddress.v, sigWrongAddress.r, sigWrongAddress.s, this.additionProofWrongAddress.proof, this.additionProofWrongAddress.inputs);
            await this.hub.addLeaf(this.leafParams.issuerAddress, sigWrongCountry.v, sigWrongCountry.r, sigWrongCountry.s, this.additionProofWrongCountry.proof, this.additionProofWrongCountry.inputs);

            // Now, make proof of the new residency
            const t = Tree(14, [this.newLeaf, this.newLeaf2, this.newLeafWrongAddress, this.newLeafWrongCountry]);
            let proof = await t.createCLISerializedProof(0);
            proof = proof.split(" ");
            proof.shift();
            proof = proof.join(" ")

            const proofArgs = `${[
                t.root, 
                ethers.BigNumber.from(this.account.address),
                ethers.BigNumber.from(this.leafParams.issuerAddress).toString(), 
                this.salt,
                this.footprint,
                this.leafParams.countryCode,
                this.leafParams.subdivision,
                this.leafParams.completedAt,
                this.leafParams.birthdate,
                this.leafParams.newSecret // newSecret == nullifier
            ].join(" ", )
            } ${ proof }`;
            
            await exec(`zokrates compute-witness -a ${proofArgs} -i zk/compiled/proofOfResidency.out -o tmp.witness`);
            await exec(`zokrates generate-proof -i zk/compiled/proofOfResidency.out -w tmp.witness -p zk/pvkeys/proofOfResidency.proving.key -j tmp.proof.json`);
            this.proofObject = JSON.parse(readFileSync("tmp.proof.json").toString());
        });

        it("Proving your country works", async function() {
            expect(await this.resStore.prove(this.proofObject.proof, this.proofObject.inputs)).to.not.be.reverted;
        });

        it("Sybil resistance: cannot prove more than once with same nullifier", async function() {
            const t = Tree(14, [this.newLeaf, this.newLeaf2, this.newLeafWrongAddress, this.newLeafWrongCountry]);
            let proof = await t.createCLISerializedProof(0);
            proof = proof.split(" ");
            proof.shift();
            proof = proof.join(" ");
            
            
            const proofArgs = `${[
                t.root, 
                ethers.BigNumber.from(this.someAccount.address),
                ethers.BigNumber.from(this.leafParams.issuerAddress).toString(), 
                this.salt,
                this.footprint,
                this.leafParams.countryCode,
                this.leafParams.subdivision,
                this.leafParams.completedAt,
                this.leafParams.birthdate,
                this.leafParams.newSecret // newSecret == nullifier
            ].join(" ", )
            } ${ proof }`;
            await exec(`zokrates compute-witness -a ${proofArgs} -i zk/compiled/proofOfResidency.out -o tmp.witness`);
            await exec(`zokrates generate-proof -i zk/compiled/proofOfResidency.out -w tmp.witness -p zk/pvkeys/proofOfResidency.proving.key -j tmp.proof.json`);
            this.proofObject = JSON.parse(readFileSync("tmp.proof.json").toString());
            await expect(this.resStore.connect(this.someAccount).prove(this.proofObject.proof, this.proofObject.inputs)).to.be.revertedWith("One person can only verify once");
        });
        
        it("Invalid proof doesn't work: root", async function() {
            // Add a new leaf so the root is bad:
            const t = Tree(14, [this.newLeaf, this.newLeaf2, this.newLeafWrongAddress, this.newLeafWrongCountry, 69]);
            let proof = await t.createCLISerializedProof(1);
            
            proof = proof.split(" ");
            proof.shift();
            proof = proof.join(" ")
            

            const proofArgs = `${[
                t.root, 
                ethers.BigNumber.from(this.account.address),
                ethers.BigNumber.from(this.leafParams.issuerAddress).toString(), 
                this.salt,
                this.footprint2,
                this.leafParams.countryCode,
                this.leafParams.subdivision,
                this.leafParams.completedAt,
                this.leafParams.birthdate,
                this.leafParams.newSecret2
            ].join(" ", )
            } ${ proof }`;
            await exec(`zokrates compute-witness -a ${proofArgs} -i zk/compiled/proofOfResidency.out -o tmp.witness`);
            await exec(`zokrates generate-proof -i zk/compiled/proofOfResidency.out -w tmp.witness -p zk/pvkeys/proofOfResidency.proving.key -j tmp.proof.json`);
            this.proofObject = JSON.parse(readFileSync("tmp.proof.json").toString());
            
            await expect(
                this.resStore.prove(this.proofObject.proof, this.proofObject.inputs)
            ).to.be.revertedWith("First public argument of proof must be a recent Merkle Root");
        });

        it("Invalid proof doesn't work: issuer address", async function() {
            // Add a new leaf so the root is bad:
            const t = Tree(14, [this.newLeaf, this.newLeaf2, this.newLeafWrongAddress, this.newLeafWrongCountry]);
            let proof = await t.createCLISerializedProof(2);
            proof = proof.split(" ");
            proof.shift();
            proof = proof.join(" ")

            const proofArgs = `${[
                t.root, 
                ethers.BigNumber.from(this.account.address),
                ethers.BigNumber.from(this.leafParams.wrongIssuerAddress).toString(), 
                this.salt,
                this.wrongAddressFootprint,
                this.leafParams.countryCode,
                this.leafParams.subdivision,
                this.leafParams.completedAt,
                this.leafParams.birthdate,
                this.leafParams.wrongAddressNewSecret
            ].join(" ", )
            } ${ proof }`;
            await exec(`zokrates compute-witness -a ${proofArgs} -i zk/compiled/proofOfResidency.out -o tmp.witness`);
            await exec(`zokrates generate-proof -i zk/compiled/proofOfResidency.out -w tmp.witness -p zk/pvkeys/proofOfResidency.proving.key -j tmp.proof.json`);
            this.proofObject = JSON.parse(readFileSync("tmp.proof.json").toString());

            await expect(
                this.resStore.prove(this.proofObject.proof, this.proofObject.inputs)
            ).to.be.revertedWith("Proof must come from authority address");
        });

        it("Invalid proof doesn't work: msg sender address", async function() {
            // Add a new leaf so the root is bad:
            const t = Tree(14, [this.newLeaf, this.newLeaf2, this.newLeafWrongAddress, this.newLeafWrongCountry]);
            let proof = await t.createCLISerializedProof(2);
            proof = proof.split(" ");
            proof.shift();
            proof = proof.join(" ")

            const proofArgs = `${[
                t.root, 
                ethers.BigNumber.from(this.someAccount.address),
                ethers.BigNumber.from(this.leafParams.wrongIssuerAddress).toString(), 
                this.salt,
                this.wrongAddressFootprint,
                this.leafParams.countryCode,
                this.leafParams.subdivision,
                this.leafParams.completedAt,
                this.leafParams.birthdate,
                this.leafParams.wrongAddressNewSecret 
            ].join(" ", )
            } ${ proof }`;
            await exec(`zokrates compute-witness -a ${proofArgs} -i zk/compiled/proofOfResidency.out -o tmp.witness`);
            await exec(`zokrates generate-proof -i zk/compiled/proofOfResidency.out -w tmp.witness -p zk/pvkeys/proofOfResidency.proving.key -j tmp.proof.json`);
            this.proofObject = JSON.parse(readFileSync("tmp.proof.json").toString());

            await expect(
                this.resStore.prove(this.proofObject.proof, this.proofObject.inputs)
            ).to.be.revertedWith("Second public argument of proof must be your address");
        });

        it("Invalid proof doesn't work: country", async function() {
           // Add a new leaf so the root is bad:
           const t = Tree(14, [this.newLeaf, this.newLeaf2, this.newLeafWrongAddress, this.newLeafWrongCountry]);
           let proof = await t.createCLISerializedProof(3);
           proof = proof.split(" ");
           proof.shift();
           proof = proof.join(" ")

           const proofArgs = `${[
                t.root, 
                ethers.BigNumber.from(this.account.address),
                ethers.BigNumber.from(this.leafParams.issuerAddress).toString(), 
                this.salt,
                this.wrongCountryFootprint,
                this.leafParams.wrongCountryCode,
                this.leafParams.subdivision,
                this.leafParams.completedAt,
                this.leafParams.birthdate,
                this.leafParams.wrongCountryNewSecret 
           ].join(" ", )
           } ${ proof }`;
           await exec(`zokrates compute-witness -a ${proofArgs} -i zk/compiled/proofOfResidency.out -o tmp.witness`);
           await exec(`zokrates generate-proof -i zk/compiled/proofOfResidency.out -w tmp.witness -p zk/pvkeys/proofOfResidency.proving.key -j tmp.proof.json`);
           this.proofObject = JSON.parse(readFileSync("tmp.proof.json").toString());

           await expect(
               this.resStore.prove(this.proofObject.proof, this.proofObject.inputs)
           ).to.be.revertedWith("Credentials do not have US as country code");
        });
    });
});