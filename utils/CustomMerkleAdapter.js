const { IncrementalMerkleTree } = require("@zk-kit/incremental-merkle-tree");
const { poseidon } = require("circomlibjs-old"); //The new version gives wrong outputs of Poseidon hash that disagree with ZoKrates and are too big for the max scalar in the field

/* This adapter allows a IncrementalMerkleTree proof to be converted to a proof format that's 
 * easier to write an efficient circuit for IMO. The new format has the full Merkle path of all 5 fields per level
 * whereas the old version has only 4 fields per level, and the circuit inserts the digest of the lower level it just calculated
 * at a particular index. This means the circuit has to figure out at which index to put the digest of the previous level.
 * This adapter avoids that, supplying the full path as part of the proof to make the circuit simpler. The proof still contains indices --
 * The only difference is that instead of inserting the previous digest at that index, the circuit will simply check that the previous digest was supplied at that index
 * */

class MerkleTreeAdapter extends IncrementalMerkleTree {
    
    /**
     * @param {int} index index of element to create a proof for
     */
    createProof(index) {
        const proof = super.createProof(index);
        // Insert the digest of the leaf at every level:
        let digest = proof.leaf;
        for(let i=0; i < proof.siblings.length; i++) {
            proof.siblings[i].splice(proof.pathIndices[i], 0, digest);
            digest = this._hash(proof.siblings[i]);
        }
        return proof
    }

    /** Serializes createProof outputs to ZoKrates format
     * @param {int} index index of element to create a proof for
     */
    createSerializedProof(index) {
        const proof = this.createProof(index);
        const argify = x=>ethers.BigNumber.from(x).toString();//ethers.BigNumber.from
        const args = [
            argify(proof.root),
            argify(proof.leaf),
            proof.siblings.map(x=>x.map(y=>argify(y))),
            proof.pathIndices.map(x=>argify(x))
        ]
        return args;

    }

    /** Serializes createProof outputs to ZoKrates CLI input format
     * @param {int} index index of element to create a proof for
     */
    createCLISerializedProof(index) {
        const proof = this.createSerializedProof(index);
        return proof.flat(2).join(" ");
    }

}

module.exports.treeFrom = (depth, leaves) => {
    let tree = new MerkleTreeAdapter(poseidon, depth, "0", 5);
    leaves.forEach(l=>tree.insert(l));
    return tree;
}