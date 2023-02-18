include "../../../node_modules/circomlib/circuits/poseidon.circom";
include "./merkleproof.circom";
include "./encryptElGamal.circom";
include "./hash.circom";

// Country whitelist proof that proves correct encryption to the audit layer
template ACW() {
    // Accumulator which represents country whitelist. This is a product of whitelisted countries (mod the order of the BabyJubJub sugroup) -- each country has a corresponding prime number
    signal input whitelistAccumulator;
    // Merkle root:
    signal input root;  

    // Merkle path sibling nodes
    signal input siblings;

    // Merkle path indices within sibling groups
    signal input pathIndices;

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
    
    /* ------------------------------------------------------------------------------------ */

    component leafMaker = Hash();
    signal leaf;
    leafMaker.in <== [issuerAddr, pepper, countryCode, subdivision, iat, scope];
    leaf <== leafMaker.out;


}

component main { public [root, whitelistAccumulator, msgSenderAddr, issuerAddr] } = ACW();
