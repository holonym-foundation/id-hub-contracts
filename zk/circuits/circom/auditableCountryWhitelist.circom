include "../../../node_modules/circomlib/circuits/poseidon.circom";
include "./primeAccumulator.circom";
include "./merkleproof.circom";
include "./encryptElGamal.circom";
include "./hash.circom";

// Country whitelist proof that proves correct encryption to the audit layer
template ACW() {
    // Merkle Tree properties
    var depth = 14;
    var arity = 5;
    // Accumulator which represents country whitelist. This is a product of whitelisted countries (mod the order of the BabyJubJub sugroup) -- each country has a corresponding prime number
    signal input whitelistAccumulator;
    // Merkle root:
    signal input root;  

    // Merkle path sibling nodes
    signal input siblings[depth][arity];

    // Merkle path indices within sibling groups
    signal input pathIndices[depth];

    // Include address as public input so proof can't be frontrun. IMPORTANT: Make sure to constrain this input to prevent malicous proofs due to groth16 malleability! 
    signal input msgSenderAddr;  

    // Address of credential issuer:
    signal input issuerAddr; 

    // province or state:
    signal input subdivision;

    // iat (see docs.holonym.id Leaf section):
    signal input iat;

    // scope (see docs.holonym.id Leaf section):
    signal input scope;


    // countrycode (a prime number representing the country, see docs.holonym.id whichever section discusses this):
    signal input countryCode;

    // nullifier (see docs.holonym.id whichever section discusses this):
    signal input pepper;

    // actionId / salt (see docs.holonym.id Sybil Resistance section):
    signal input salt;

    // hasbrowns (see docs.holonym.id Sybil Resistance section):
    signal input hashbrowns;
    
    //ElGamal encryption parameters:
    signal input encryptToPubkey[2];
    signal input encryptWithNonce;
    signal input messageAsPoint[2];
    signal output c1[2];
    signal output c2[2];
    /* ------------------------------------------------------------------------------------ */

    component leafMaker = Hash6();
    signal leaf;
    leafMaker.in <== [issuerAddr, pepper, countryCode, subdivision, iat, scope];
    leaf <== leafMaker.out;
    
    component mp = MerkleProof(depth, arity);
    mp.root <== root;
    mp.leaf <== leaf;
    mp.siblings <== siblings;
    mp.pathIndices <== pathIndices;

    component whitelist = WhitelistByPrime();
    whitelist.accumulator <== whitelistAccumulator;
    whitelist.member <== countryCode;

    component encryption = EncryptElGamal();
    encryption.h <== encryptToPubkey;
    encryption.y <== encryptWithNonce;
    encryption.messageAsPoint <== messageAsPoint;
    
    c1 <== encryption.c1;
    c2 <== encryption.c2;

}

component main { public [root, whitelistAccumulator, msgSenderAddr, issuerAddr] } = ACW();
