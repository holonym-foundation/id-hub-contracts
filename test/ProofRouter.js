
const { expect } = require("chai");
const { ethers } = require("hardhat");const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { createLeaf, createLeafAdditionProof, deployPoseidon } = require("../utils/utils");
const { Tree } = require("holo-merkle-utils");
const { readFileSync } = require("fs");


describe("ProofRouter", function () {
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


    describe("ProofRouter Integration tests", function() {
        before("Add new proof route and verify the proof ", async function() {
            const QuinVerifier = await (await ethers.getContractFactory("QuinaryMerkleProof")).deploy();
            await this.router.connect(this.admin).addRoute("MerkleProof", QuinVerifier.address);
            
            // Add a new leaf:
            this.leafParams = {
                issuerAddress : "0xC8834C1FcF0Df6623Fc8C8eD25064A4148D99388",
                oldSecret : 69,
                newSecret : 71,
                countryCode : 2,
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
    
            this.proofData = await createLeafAdditionProof(
              ethers.BigNumber.from(this.leafParams.issuerAddress), 
              this.leafParams.countryCode, 
              this.leafParams.subdivision,
              this.leafParams.completedAt,
              this.leafParams.birthdate,
              this.leafParams.oldSecret, 
              this.leafParams.newSecret, 
    
            )
            
           const tbs = Buffer.from(
            ethers.BigNumber.from(this.oldLeaf).toHexString().replace("0x",""),
            "hex"
           );
    
           const sig_ = await this.account.signMessage(tbs);
           const sig = ethers.utils.splitSignature(sig_);
    
           await this.hub.addLeaf(this.leafParams.issuerAddress, sig.v, sig.r, sig.s, this.proofData.proof, this.proofData.inputs);
        });

        it("Proving the new leaf works", async function() {
            // Now, make proof of the new leaf
            const t = Tree(14, [this.newLeaf]);
            const proofArgs = t.createCLISerializedProof(0);
            await exec("zokrates compile -i zk/quinaryMerkleProof.zok -o tmp.out;")
            await exec(`zokrates compute-witness -a ${proofArgs} -i tmp.out -o tmp.witness`);
            await exec(`zokrates generate-proof -i tmp.out -w tmp.witness -p zk/pvkeys/quinaryMerkleProof.proving.key -j tmp.proof.json`);
            const proofObject = JSON.parse(readFileSync("tmp.proof.json").toString());
            await this.hub.verifyProof("MerkleProof", proofObject.proof, proofObject.inputs);
        });

        it("Proving the new leaf with wrong root doesn't work", async function() {
            const t = Tree(14, [this.newLeaf, 69]);
            const proofArgs = t.createCLISerializedProof(0);
            await exec("zokrates compile -i zk/quinaryMerkleProof.zok -o tmp.out;")
            await exec(`zokrates compute-witness -a ${proofArgs} -i tmp.out -o tmp.witness`);
            await exec(`zokrates generate-proof -i tmp.out -w tmp.witness -p zk/pvkeys/quinaryMerkleProof.proving.key -j tmp.proof.json`);
            const proofObject = JSON.parse(readFileSync("tmp.proof.json").toString());

            await expect(
                this.hub.verifyProof("MerkleProof", proofObject.proof, proofObject.inputs)
            ).to.be.revertedWith("First public argument of proof must be a recent Merkle Root");
        });
    });
});