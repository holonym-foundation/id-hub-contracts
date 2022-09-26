
const { expect } = require("chai");
const { ethers } = require("hardhat");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { createLeaf, createLeafAdditionProof, deployPoseidon } = require("../utils/utils");
const { Tree } = require("holo-merkle-utils");
const { readFileSync } = require("fs");
const { randomBytes } = require("crypto");


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
        this.resStore = await (await ethers.getContractFactory("ResidencyStore")).deploy(this.hub.address);
        
    });

    describe("Verifier works:", function() {
        before("Add new proof route and verify the proof ", async function() {
            
            
            // Add a new leaf:
            this.leafParams = {
                issuerAddress : this.account.address,
                wrongIssuerAddress : this.someAccount.address,
                oldSecret : ethers.BigNumber.from(randomBytes(16)),
                newSecret : ethers.BigNumber.from(randomBytes(16)),
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
            // this.proofObject.proof.a[0] = "0x2b54a104041923a8cf188cf06d579aa3f78f8832803088af6dd4f0048d7da669"
            // expect(await this.verifier.verifyTx(this.proofObject.proof, this.proofObject.inputs)).to.equal(true);
            // expect(await this.verifier.verifyEncoded(this.proofObject.proof, this.proofObject.inputs)).to.equal(true);
            // expect(await this.hub.verifyProof("USResident", this.proofObject.proof, this.proofObject.inputs)).to.not.be.reverted;
            expect(await this.resStore.prove(this.proofObject.proof, this.proofObject.inputs)).to.not.be.reverted;
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
                this.resStore.prove(this.proofObject.proof, this.proofObject.inputs)
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
                this.resStore.prove(this.proofObject.proof, this.proofObject.inputs)
            ).to.be.revertedWith("Proof must come from authority address");
        });

        it("Invalid proof doesn't work: country", async function() {
           // Add a new leaf so the root is bad:
           const t = Tree(14, [this.newLeaf, this.newLeafWrongAddress, this.newLeafWrongCountry]);
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
               this.resStore.prove(this.proofObject.proof, this.proofObject.inputs)
           ).to.be.revertedWith("Credentials do not have US as country code");
        });
    });
});