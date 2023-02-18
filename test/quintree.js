const { rejects } = require("assert");
const { expect } = require("chai");
const { Tree } = require("holo-merkle-utils");
const { Proofs } = require("../utils/proofs");

const leafSets = [
    // [1n, 2n, 3n],
    // [100000n, 999999999999999n, 123456789n, 987654321n, 6969n],
    // [100000n, 999999999999999n, 123456789n, 987654321n, 6969n, 0n],
    // [100000n, 999999999999999n, 123456789n, 987654321n, 6969n, 0n, 1n],
    [100000n, 999999999999999n, 100000n, 999999999999999n, 123456789n, 987654321n, 6969n, 0n, 1n, 123456789n, 987654321n, 6969n, 0n, 1n, 123456789n, 123456789n, 123456789n, 123456789n, 123456789n, 123456789n, 123456789n, 123456789n],
    [0n],
    // [0n,0n,0n,0n,0n],
    // [0n,0n,0n,0n,0n,0n],
];


describe.only("Quinary Tree Circuit", function (){
    before(async function (){
        this.leafSets
    });
    for (var i=0; i<leafSets.length; i++) {
        const leaves = leafSets[i];
        describe(`Leaf Set ${i}`, function (){
            it("correct values", async function () {
                const mp = randMP(leaves);
                const p = await Proofs.quinMerkleTree.prove(mp);
                const result = await Proofs.quinMerkleTree.verify(p);
                expect(result).to.equal(true);
            });
            it("incorrect root", async function () {
                const mp = randMP(leaves);
                console.log("should error:")
                await rejects(Proofs.quinMerkleTree.prove({...mp, root:mp.root+1n}));
            });
            
        });
    }

});

// returns a random index i for an array of length `length`
function randIdx(length) { return Math.floor(Math.random() * length ) }

// returns a merkle proof from leaves at a random index
function randMP(leaves) { 
    const tree = Tree(14, leaves);
    const idx = randIdx(leaves.length);
    return tree.createProof(idx);
}