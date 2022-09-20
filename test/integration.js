const { deployPoseidon } = require("../utils/utils");
const { Tree }  = require("holo-merkle-utils");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const DEPTH = 14; // Merkle tree depth


describe("Merkle Tree Implementation Parity", function(){
    before(async function() {
        [this.account, this.someRando] = await ethers.getSigners();

        const _pt6 = await deployPoseidon();
        
        const _tree = await (await ethers.getContractFactory("IncrementalQuinTree", {
                libraries : {
                    PoseidonT6 : _pt6.address
                }
            }
        )).deploy();

        this.mt = await (await ethers.getContractFactory("MerkleTree", {
                libraries : {
                    IncrementalQuinTree : _tree.address
                } 
            }
        )).deploy(this.account.address);
    });

    it("Parity of on-chain and off-chain Merkle Trees", async function (){
        const leaves = ["6","9","69"];
        const offChain = Tree(DEPTH, leaves);
        for(const l of leaves){
            await this.mt.insertLeaf(l);
        }
        const proof = offChain.createProof(2); // create proof of the third element
        expect(proof.root).to.equal(await this.mt.mostRecentRoot())
    });


    describe("This one needs the ZoKrates CLI installed:", function() {
        before(async function() {
            const tree = Tree(DEPTH, ["6","9","69","6","9","69","6969696969696969","6","9","69"]);
            const proof = tree.createCLISerializedProof(7);
            await exec("zokrates compile -i zk/quinaryMerkleProof.zok -o tmp.out; zokrates setup -i tmp.out -p tmp.proving.key -v tmp.verifying.key;")
            this.res = await exec(`zokrates compute-witness -a ${proof} -i tmp.out -o tmp.witness`);
        })
        it("Parity of JS and circuit merkle proofs", async function (){
            expect(this.res.stderr).to.equal("");
                // expect(this.res.stdout).to.equal("Witness file written to 'tmp.witness'");
        });
    });
    
});