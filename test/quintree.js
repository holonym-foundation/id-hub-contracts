const { expect } = require("chai");
const { Tree } = require("holo-merkle-utils");
const { Proofs } = require("../utils/proofs");

const leafSets = [
    [1n, 2n, 3n],
    // [100000n, 999999999999999n, 123456789n, 987654321n, 6969n],
    // [100000n, 999999999999999n, 123456789n, 987654321n, 6969n, 0n],
    // [100000n, 999999999999999n, 123456789n, 987654321n, 6969n, 0n, 1n],
    // [0n],
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
                const tree = Tree(14, leaves);
                const idx = randIdx(leaves.length);
                const mp = tree.createProof(idx);
                const p = await Proofs.quinMerkleTree.prove(mp);
                const result = await Proofs.quinMerkleTree.verify(p);
                // console.log(result)
            });
            
        });
    }

});

// returns a random index i for an array of length `length`
function randIdx(length) { return Math.floor(Math.random() * length ) }