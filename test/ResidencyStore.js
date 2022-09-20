
const { expect } = require("chai");
const { ethers } = require("hardhat");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { createLeaf, createLeafAdditionProof, deployPoseidon } = require("../utils/utils");
const { Tree } = require("holo-merkle-utils");
const { readFileSync } = require("fs");


describe("ResidencyStore", function () {
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
        
    });

    describe.only("Verifier works:", function() {
        before("Add new proof route and verify the proof ", async function() {
            const CountryVerifier = await (await ethers.getContractFactory("ProofOfCountry")).deploy();
            await this.router.connect(this.admin).addRoute("USResident", CountryVerifier.address);
            
            // Add a new leaf:
            this.leafParams = {
                issuerAddress : this.account.address,
                wrongIssuerAddress : this.someAccount.address,
                oldSecret : 69,
                newSecret : 71,
                countryCode : 2,
                wrongCountryCode : 69,
                subdivision : ethers.BigNumber.from(Buffer.from("NY")),
                completedAt : ethers.BigNumber.from(Math.floor(Date.now()/1000)),
                birthdate : 6969696969
            }
    
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
                this.leafParams.newSecret, 
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
                this.leafParams.newSecret, 
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
              this.leafParams.newSecret, 
    
            )
            
            this.additionProofWrongCountry = await createLeafAdditionProof(
                ethers.BigNumber.from(this.leafParams.issuerAddress), 
                this.leafParams.wrongCountryCode, 
                this.leafParams.subdivision,
                this.leafParams.completedAt,
                this.leafParams.birthdate,
                this.leafParams.oldSecret, 
                this.leafParams.newSecret, 
      
              )
            this.additionProofWrongAddress = await createLeafAdditionProof(
                ethers.BigNumber.from(this.leafParams.wrongIssuerAddress), 
                this.leafParams.countryCode, 
                this.leafParams.subdivision,
                this.leafParams.completedAt,
                this.leafParams.birthdate,
                this.leafParams.oldSecret, 
                this.leafParams.newSecret, 
      
              )
            
           const tbsGood = Buffer.from(
            ethers.BigNumber.from(this.oldLeaf).toHexString().replace("0x",""),
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
           
           const sigWrongAddress = ethers.utils.splitSignature(
            await this.someAccount.signMessage(tbsWrongAddress)
           );

           const sigWrongCountry = ethers.utils.splitSignature(
            await this.account.signMessage(tbsWrongCountry)
           );
    
           await this.hub.addLeaf(this.leafParams.issuerAddress, sigGood.v, sigGood.r, sigGood.s, this.additionProofGood.proof, this.additionProofGood.inputs);
           await this.hub.addLeaf(this.leafParams.wrongIssuerAddress, sigWrongAddress.v, sigWrongAddress.r, sigWrongAddress.s, this.additionProofWrongAddress.proof, this.additionProofWrongAddress.inputs);
           await this.hub.addLeaf(this.leafParams.issuerAddress, sigWrongCountry.v, sigWrongCountry.r, sigWrongCountry.s, this.additionProofWrongCountry.proof, this.additionProofWrongCountry.inputs);

            // Now, make proof of the new residency
            const t = Tree(14, [this.newLeaf, this.newLeafWrongAddress, this.newLeafWrongCountry]);
            let proof = await t.createCLISerializedProof(0);
            proof = proof.split(" ");
            proof.shift();
            proof = proof.join(" ")

            const proofArgs = `${[
                t.root, 
                ethers.BigNumber.from(this.leafParams.issuerAddress).toString(), 
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
            expect(await this.hub.verifyProof("USResident", this.proofObject.proof, this.proofObject.inputs)).to.not.be.reverted;
        });

        it("Invalid proof doesn't work: root", async function() {
            // Add a new leaf so the root is bad:
            const t = Tree(14, [this.newLeaf, this.newLeafWrongAddress, this.newLeafWrongCountry, 123456789]);
            let proof = await t.createCLISerializedProof(0);
            proof = proof.split(" ");
            proof.shift();
            proof = proof.join(" ")

            const proofArgs = `${[
                t.root, 
                ethers.BigNumber.from(this.leafParams.issuerAddress).toString(), 
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

            await expect(
                this.hub.verifyProof("USResident", this.proofObject.proof, this.proofObject.inputs)
            ).to.be.revertedWith("First public argument of proof must be a recent Merkle Root");
        });

        it("Invalid proof doesn't work: address", async function() {
            // Add a new leaf so the root is bad:
            const t = Tree(14, [this.newLeaf, this.newLeafWrongAddress, this.newLeafWrongCountry]);
            let proof = await t.createCLISerializedProof(1);
            proof = proof.split(" ");
            proof.shift();
            proof = proof.join(" ")

            const proofArgs = `${[
                t.root, 
                ethers.BigNumber.from(this.leafParams.wrongIssuerAddress).toString(), 
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

            await expect(
                this.hub.verifyProof("USResident", this.proofObject.proof, this.proofObject.inputs)
            ).to.be.revertedWith("First public argument of proof must be a recent Merkle Root");
        });

        it("Invalid proof doesn't work: country", async function() {
           // Add a new leaf so the root is bad:
           const t = Tree(14, [this.newLeaf, this.newLeafWrongAddress, this.newLeafWrongCountry, 123456789]);
           let proof = await t.createCLISerializedProof(2);
           proof = proof.split(" ");
           proof.shift();
           proof = proof.join(" ")

           const proofArgs = `${[
               t.root, 
               ethers.BigNumber.from(this.leafParams.issuerAddress).toString(), 
               this.leafParams.wrongCountryCode,
               this.leafParams.subdivision,
               this.leafParams.completedAt,
               this.leafParams.birthdate,
               this.leafParams.newSecret // newSecret == nullifier
           ].join(" ", )
           } ${ proof }`;
           await exec(`zokrates compute-witness -a ${proofArgs} -i zk/compiled/proofOfResidency.out -o tmp.witness`);
           await exec(`zokrates generate-proof -i zk/compiled/proofOfResidency.out -w tmp.witness -p zk/pvkeys/proofOfResidency.proving.key -j tmp.proof.json`);
           this.proofObject = JSON.parse(readFileSync("tmp.proof.json").toString());

           await expect(
               this.hub.verifyProof("USResident", this.proofObject.proof, this.proofObject.inputs)
           ).to.be.revertedWith("First public argument of proof must be a recent Merkle Root");
        });
    });
});