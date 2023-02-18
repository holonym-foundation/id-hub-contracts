const { rejects } = require("assert");
const { expect } = require("chai");
const { Tree } = require("holo-merkle-utils");
const { Proofs } = require("../utils/proofs");

const leafSets = [
    [1n, 2n, 3n],
    // [100000n, 999999999999999n, 123456789n, 987654321n, 6969n],
    // [100000n, 999999999999999n, 123456789n, 987654321n, 6969n, 0n],
    // [100000n, 999999999999999n, 123456789n, 987654321n, 6969n, 0n, 1n],
    // [100000n, 999999999999999n, 100000n, 999999999999999n, 123456789n, 987654321n, 6969n, 0n, 1n, 123456789n, 987654321n, 6969n, 0n, 1n, 123456789n, 123456789n, 123456789n, 123456789n, 123456789n, 123456789n, 123456789n, 123456789n],
    // [0n],
    // [0n,0n,0n,0n,0n],
    // [0n,0n,0n,0n,0n,0n],
];

describe.only("Quinary Tree Circuit", function (){
    before(async function (){
        /* By the end of the testing, there shuold be 4 different errors. one for each
        * incorrect root, 
        * incorrect leaf
        * incorrect indices
        * incorrect siblings
        */
        // this.errors = [];
        // this.logError = (error) => {
        //     if (!this.errors.includes(error)) {this.errors.push(error)}
        //     console.log(this.errors)
        // }
    });
    for (var i=0; i<leafSets.length; i++) {
        const errors = [];
        const logError = (error) => { if (!errors.includes(error)) {errors.push(error) } }
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
            it("incorrect leaf", async function () {
                const mp = randMP(leaves);
                console.log("should error:")
                await rejects(Proofs.quinMerkleTree.prove({...mp, leaf:mp.leaf+1n}));
            });
            it("incorrect indices", async function (done) {
                const mp = randMP(leaves);
                const pathIndices = [...mp.pathIndices];
                const randomIdx = randIdx(pathIndices.length);
                const correct =  pathIndices[randomIdx];
                const incorrect = ((parseInt(correct) + 1) % 4).toString(); // Can't be more than 4

                // This test won't work when two adjacent values in the Merkle tree are the same and one of them occurs at randIdx. Even though the path would wrong, the proof would still succeed.
                // Hence, don't expect it to fail; do not run this test. Only run if the adjacent sisters differ:
                if(mp.siblings[randomIdx][parseInt(correct)] !== mp.siblings[randomIdx][parseInt(incorrect)]) {
                    
                    pathIndices[randomIdx] = incorrect;
                    Proofs.quinMerkleTree.prove({...mp, pathIndices: pathIndices})
                    .then(p=>expect("this should have errored").to.equal("but it didn't"))
                    .catch(function(e){console.log(e.message);logError(e.message)})
                    .finally(_=>done());
                }
            });

            it("incorrect siblings", async function () {
                
            });
            it("the errors thrown came from failures to match different constraints", function() {
                expect(errors.length).to.equal(4);
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