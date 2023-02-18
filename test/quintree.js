const { expect } = require("chai");
const { Tree } = require("holo-merkle-utils");
const { Proofs } = require("../utils/proofs");

const leafSets = [
    [1n, 2n, 3n],
    [100000n, 999999999999999n, 123456789n, 987654321n, 6969n],
    [100000n, 999999999999999n, 123456789n, 987654321n, 6969n, 0n],
    [100000n, 999999999999999n, 123456789n, 987654321n, 6969n, 0n, 1n],
    // [100000n, 999999999999999n, 100000n, 999999999999999n, 123456789n, 987654321n, 6969n, 0n, 1n, 123456789n, 987654321n, 6969n, 0n, 1n, 123456789n, 123456789n, 123456789n, 123456789n, 123456789n, 123456789n, 123456789n, 123456789n],
    // [0n],
    // [0n,0n,0n,0n,0n],
    // [0n,0n,0n,0n,0n,0n],
];

class ErrorHandler {
    constructor() {
        this.errors = [];
        this.messages = {
            noErr : "shouldUniquelyError expected a unique error but received no error at all",
            errSeenBefore : "shouldUniquelyError expected a unique error: ",
            errNotSeenBefore : "shouldUniquelyError expected a previous error but received a new error: "
        };
    }
    throwIfErrSeenBefore(err) { 
        if (this.errors.includes(err.message)) {
            throw Error(this.messages.errSeenBefore + err.message)
        } else {
            this.errors.push(err.message);
        }
    }
    throwIfErrNotSeenBefore(err) { 
        if (!this.errors.includes(err.message)) {
            throw Error(this.messages.errNotSeenBefore + err.message)
        } 
    }
    async shouldUniquelyError(promise) {
        try {
            await promise;
            // await promise should have thrown. Throw an error that promise didn't throw and this line is therefore called
            throw Error(this.messages.noErr)
        }    
        catch(e) {
            if (e.message === this.messages.noErr) { throw e }
            this.throwIfErrSeenBefore(e);
        }
    }
    async shouldRepeatError(promise) {
        try {
            await promise;
            // await promise should have thrown. Throw an error that promise didn't throw and this line is therefore called
            throw Error(this.messages.noErr)
        }    
        catch(e) {
            if (e.message === this.messages.noErr) { throw e }
            this.throwIfErrNotSeenBefore(e);
        }
    }
}

describe.only("Quinary Tree Circuit", function (){
    before(async function (){
    });
    for (var i=0; i<leafSets.length; i++) {
        const errors = new ErrorHandler();
        
        const leaves = leafSets[i];
        describe(`Leaf Set ${i}`, function (){
            it("correct values", async function () {
                const mp = randMP(leaves);
                const p = await Proofs.testMerkleTree.prove(mp);
                const result = await Proofs.testMerkleTree.verify(p);
                expect(result).to.equal(true);
            });
            it("incorrect root", async function () {
                const mp = randMP(leaves);
                await errors.shouldUniquelyError(
                    Proofs.testMerkleTree.prove({...mp, root:mp.root+1n}),
                );
            });
            it("incorrect leaf", async function () {
                const mp = randMP(leaves);
                await errors.shouldUniquelyError(
                    Proofs.testMerkleTree.prove({...mp, leaf:mp.leaf+1n}),
                );
            });
            it("incorrect indices", async function () {
                const mp = randMP(leaves);
                const pathIndices_ = [...mp.pathIndices];
                const randomIdx = randIdx(pathIndices_.length);
                const correct =  pathIndices_[randomIdx];
                const incorrect = ((parseInt(correct) + 1) % 4).toString(); // Can't be more than 4

                // This test won't work when two adjacent values in the Merkle tree are the same and one of them occurs at randIdx. Even though the path would wrong, the proof would still succeed.
                // Hence, don't expect it to fail; do not run this test. Only run if the adjacent sisters differ:
                if(mp.siblings[randomIdx][parseInt(correct)] !== mp.siblings[randomIdx][parseInt(incorrect)]) {

                    pathIndices_[randomIdx] = incorrect;
                    await errors.shouldUniquelyError(
                        Proofs.testMerkleTree.prove({...mp, pathIndices: pathIndices_}),
                    );
                }
            });

            it("incorrect siblings", async function () {
                const mp = randMP(leaves);
                const siblings_ = [...mp.siblings];
                const [i, j] = [randIdx(mp.siblings.length), randIdx(mp.siblings[0].length)];
                siblings_[i][j] = siblings_[i][j] + 1n
                await errors.shouldRepeatError(
                    Proofs.testMerkleTree.prove({...mp, siblings: siblings_}),
                );
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