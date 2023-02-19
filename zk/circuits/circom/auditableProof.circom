include "../../../node_modules/circomlib/circuits/poseidon.circom";
include "./merkleproof.circom";
include "./encryptElGamal.circom";

// Merkle Proof with encryption to audit-layer
// Intended to be used as a template that can be reused for the majority of identity proofs that need merkle proofs and auditability
// Checks that a leaf belongs to a merkle tree given by (root, siblings, pathIndices)
// Encrypts a certain message encoded as a point to the audit layer. This message is encoded as a point in https://github.com/holonym-foundation/babyjubjub-elgamal-project
// Reccomended that message represents the user's name, country, state, and IP address. Anything that should be exposed to catch bad actors but kept private for average users.
// To fit this in the message, it's reccomended to do 32 bits IP, 
template AuditableProof(numMessagesToEncrypt) {
    // Merkle Tree properties
    var depth = 14;
    var arity = 5;
    
    // Merkle root:
    signal input root;  

    // Merkle leaf:
    signal input leaf;

    // Merkle path sibling nodes
    signal input siblings[depth][arity];

    // Merkle path indices within sibling groups
    signal input pathIndices[depth];
    
    //ElGamal encryption parameters:
    signal input encryptToPubkey[2];
    signal input encryptWithNonce[numMessagesToEncrypt];
    signal input messageAsPoint[numMessagesToEncrypt][2];
    // Encryption output will be the two points c1 and c2 for every message. It has dimensions [numMessagesToEncrypt][2][2]
    // E.g., encryptions[1] will be a 2*2 array representing [c1,c2] where c1 and c2 are the two points that represent an encryption
    signal output encryptions[numMessagesToEncrypt][2][2];


    /* ------------------------------------------------------------------------------------ */

    component mp = MerkleProof(depth, arity);
    mp.root <== root;
    mp.leaf <== leaf;
    mp.siblings <== siblings;
    mp.pathIndices <== pathIndices;


    component encryptors[numMessagesToEncrypt];
    for(var i=0; i<numMessagesToEncrypt; i++) {
        encryptors[i] = EncryptElGamal();
        encryptors[i].h <== encryptToPubkey;
        encryptors[i].y <== encryptWithNonce[i];
        encryptors[i].messageAsPoint <== messageAsPoint[i];
        // ElGamal encryption values
        encryptions[i] <== [encryptors[i].c1, encryptors[i].c2];
    }
    
}
