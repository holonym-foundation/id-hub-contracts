pragma circom 2.0.0;
include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/eddsaposeidon.circom";

/* onAddLeaf proof
 * public inputs: signed leaf, new leaf
 * private inputs: signature of signed leaf, pubkey of signer, signed leaf preimage, new leaf preimage
 * to constrain:
 *  - signed leaf is signed by the given pubkey
 *  - signed leaf's preimage starts with the given pubkeky's address
 *  - signed leaf's purported preimage actually hashes to the signed leaf
 *  - new leaf's purported preimage actually hashes to the new leaf
 *  - new leaf's purported preimage is the exact same as signed leaf's preimage except for its secret
*/

template OAL () {  
    // Issuer pubkey and signature (R, S) :
    signal input pubKeyX;
    signal input pubKeyY;
    signal input R8x;
    signal input R8y;
    signal input S;

    // Old leaf and new leaf
    signal input signedLeaf;
    signal input newLeaf;

    // Secret known to issuer (signedLeafSecret) and secret known only to user (newLeafSecret)
    signal input signedLeafSecret;
    signal input newLeafSecret;

    // Time the issuer says the credential was issued at
    signal input iat;

    // Three custom fields the issuer can put in the leaf (can be anything, e.g. [name, address, birthdate, phone #])
    signal input customFields[3];

    // This is our somewhat odd address scheme: hash of pubkey x and y, so that we don't have to worry about point conversions:
    component addressFromPubKey = Poseidon(2);
    addressFromPubKey.inputs[0] <== pubKeyX;
    addressFromPubKey.inputs[1] <== pubKeyY;

    // Recreate the signed leaf and the new leaf by hashing their respective preimages. Later, the new and old leaf will be checked for correctness:
    component createSignedLeaf = Poseidon(6);
    component createNewLeaf = Poseidon(6);

    createSignedLeaf.inputs[0] <== addressFromPubKey.out;
    createSignedLeaf.inputs[1] <== signedLeafSecret;
    createSignedLeaf.inputs[2] <== customFields[0];
    createSignedLeaf.inputs[3] <== customFields[1];
    createSignedLeaf.inputs[4] <== iat; // Yes, this is a weird place to place it in between, but it made sense at some point in time, and it's now backward-compatible with the other circuits we have already built
    createSignedLeaf.inputs[5] <== customFields[2];

    createNewLeaf.inputs[0] <== addressFromPubKey.out;
    createNewLeaf.inputs[1] <== newLeafSecret; // Note this secret is different than in createSignedLeaf; we are changing *only* the secret -- no other fields
    createNewLeaf.inputs[2] <== customFields[0];
    createNewLeaf.inputs[3] <== customFields[1];
    createNewLeaf.inputs[4] <== iat; // Yes, this is a weird place to place it in between, but it made sense at some point in time, and it's now backward-compatible with the other circuits we have already built
    createNewLeaf.inputs[5] <== customFields[2];
    
    // Check that the leaves were not spoofed; their preimage was indeed known
    createSignedLeaf.out === signedLeaf;
    createNewLeaf.out === newLeaf; 

    // Check that signature for the signed leaf is actually from the given pubkey
    component verifier = EdDSAPoseidonVerifier();
    verifier.enabled <== 1;
    verifier.Ax <== pubKeyX;
    verifier.Ay <== pubKeyY;
    verifier.R8x <== R8x;
    verifier.R8y <== R8y;
    verifier.S <== S;
    verifier.M <== signedLeaf;

}

component main {public [signedLeaf, newLeaf]} = OAL();