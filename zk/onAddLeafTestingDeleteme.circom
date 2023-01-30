pragma circom 2.0.0;
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/eddsaposeidon.circom";
include "../node_modules/circomlib/circuits/compconstant.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/escalarmulany.circom";
include "../node_modules/circomlib/circuits/escalarmulfix.circom";
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

// template OAL () {  
//     // Issuer pubkey and signature (R, S) :
//     signal input pubKeyX;
//     signal input pubKeyY;
//     signal input R8x;
//     signal input R8y;
//     signal input S;

//     // Old leaf and new leaf
//     signal input signedLeaf;
//     signal input newLeaf;

//     // Secret known to issuer (signedLeafSecret) and secret known only to user (newLeafSecret)
//     signal input signedLeafSecret;
//     signal input newLeafSecret;

//     // Time the issuer says the credential was issued at
//     signal input iat;

//     // Scope of credentials (probably set to 0)
//     signal input scope; 

//     // Three custom fields the issuer can put in the leaf (can be anything, e.g. [name, address, birthdate, phone #])
//     signal input customFields[2];

//     // signal output hashOfMessageForSign; RIGHT
//     // signal output publicNonce; RIGHT BY DEFINITION (given as input)
//     // signal output hashOfMessageForSignTimes
//     // signal output xRightSide; WRONG
//     signal output leftX;


//     var i;

//     // Ensure S<Subgroup Order

//     component snum2bits = Num2Bits(253);
//     snum2bits.in <== S;

//     component  compConstant = CompConstant(2736030358979909402780800718157159386076813972158567259200215660948447373040);

//     for (i=0; i<253; i++) {
//         snum2bits.out[i] ==> compConstant.in[i];
//     }
//     compConstant.in[253] <== 0;
//     compConstant.out === 0;

//     // This is our somewhat odd address scheme: hash of pubkey x and y, so that we don't have to worry about point conversions:
//     component addressFromPubKey = Poseidon(2);
//     addressFromPubKey.inputs[0] <== pubKeyX;
//     addressFromPubKey.inputs[1] <== pubKeyY;

//     // Recreate the signed leaf and the new leaf by hashing their respective preimages. Later, the new and old leaf will be checked for correctness:
//     component createSignedLeaf = Poseidon(6);
//     component createNewLeaf = Poseidon(6);

//     createSignedLeaf.inputs[0] <== addressFromPubKey.out;
//     createSignedLeaf.inputs[1] <== signedLeafSecret;
//     createSignedLeaf.inputs[2] <== customFields[0];
//     createSignedLeaf.inputs[3] <== customFields[1];
//     createSignedLeaf.inputs[4] <== iat; 
//     createSignedLeaf.inputs[5] <== scope;

//     createNewLeaf.inputs[0] <== addressFromPubKey.out;
//     createNewLeaf.inputs[1] <== newLeafSecret; // Note this secret is different than in createSignedLeaf; we are changing *only* the secret -- no other fields
//     createNewLeaf.inputs[2] <== customFields[0];
//     createNewLeaf.inputs[3] <== customFields[1];
//     createNewLeaf.inputs[4] <== iat; 
//     createNewLeaf.inputs[5] <== scope;
    
//     // Check that the leaves were not spoofed; their preimage was indeed known
//     createSignedLeaf.out === signedLeaf;
//     createNewLeaf.out === newLeaf; 

//     component mhash = Poseidon(5);
    
//     mhash.inputs[0] <== R8x;
//     mhash.inputs[1] <== R8y;
//     mhash.inputs[2] <== pubKeyX;
//     mhash.inputs[3] <== pubKeyY;
//     mhash.inputs[4] <== signedLeaf;
    
//     // hashOfMessageForSign <== mhash.out;

//     component h2bits = Num2Bits_strict();
//     h2bits.in <== mhash.out;

//     component dbl1 = BabyDbl();
//     dbl1.x <== pubKeyX;
//     dbl1.y <== pubKeyY;
//     component dbl2 = BabyDbl();
//     dbl2.x <== dbl1.xout;
//     dbl2.y <== dbl1.yout;
//     component dbl3 = BabyDbl();
//     dbl3.x <== dbl2.xout;
//     dbl3.y <== dbl2.yout;

//     // We check that A is not zero.
//     component isZero = IsZero();
//     isZero.in <== dbl3.x;
//     isZero.out === 0;

//     component mulAny = EscalarMulAny(254);
//     for (i=0; i<254; i++) {
//         mulAny.e[i] <== h2bits.out[i];
//     }
//     mulAny.p[0] <== dbl3.xout;
//     mulAny.p[1] <== dbl3.yout;


// // Compute the right side: right =  R8 + right2

//     component addRight = BabyAdd();
//     addRight.x1 <== R8x;
//     addRight.y1 <== R8y;
//     addRight.x2 <== mulAny.out[0];
//     addRight.y2 <== mulAny.out[1];

//     // Calculate left side of equation left = S*B8

//     var BASE8[2] = [
//         5299619240641551281634865583518297030282874472190772894086521144482721001553,
//         16950150798460657717958625567821834550301663161624707787222815936182638968203
//     ];
//     component mulFix = EscalarMulFix(253, BASE8);
//     for (i=0; i<253; i++) {
//         mulFix.e[i] <== snum2bits.out[i];
//     }

// // Do the comparation left == right if enabled;

//     leftX <== mulFix.out[0];
//     // rightX <== addRight.xout;
//     // component eqCheckX = ForceEqualIfEnabled();
//     // eqCheckX.enabled <== 1;
//     // eqCheckX.in[0] <== mulFix.out[0];
//     // eqCheckX.in[1] <== addRight.xout;

//     // component eqCheckY = ForceEqualIfEnabled();
//     // eqCheckY.enabled <== 1;
//     // eqCheckY.in[0] <== mulFix.out[1];
//     // eqCheckY.in[1] <== addRight.yout;

// }



template OALTestingDeleteme () {  
    // Issuer pubkey and signature (R, S) :
    signal input pubKeyX;
    signal input pubKeyY;
    signal input R8x;
    signal input R8y;
    signal input S;

    // Old leaf and new leaf
    signal input signedLeaf;
    // signal input newLeaf;

    // // Secret known to issuer (signedLeafSecret) and secret known only to user (newLeafSecret)
    // signal input signedLeafSecret;
    // signal input newLeafSecret;

    // // Time the issuer says the credential was issued at
    // signal input iat;

    // // Scope of credentials (probably set to 0)
    // signal input scope; 

    // // Three custom fields the issuer can put in the leaf (can be anything, e.g. [name, address, birthdate, phone #])
    // signal input customFields[2];

    // // This is our somewhat odd address scheme: hash of pubkey x and y, so that we don't have to worry about point conversions:
    // component addressFromPubKey = Poseidon(2);
    // addressFromPubKey.inputs[0] <== pubKeyX;
    // addressFromPubKey.inputs[1] <== pubKeyY;

    // // Recreate the signed leaf and the new leaf by hashing their respective preimages. Later, the new and old leaf will be checked for correctness:
    // component createSignedLeaf = Poseidon(6);
    // component createNewLeaf = Poseidon(6);

    // createSignedLeaf.inputs[0] <== addressFromPubKey.out;
    // createSignedLeaf.inputs[1] <== signedLeafSecret;
    // createSignedLeaf.inputs[2] <== customFields[0];
    // createSignedLeaf.inputs[3] <== customFields[1];
    // createSignedLeaf.inputs[4] <== iat; 
    // createSignedLeaf.inputs[5] <== scope;

    // createNewLeaf.inputs[0] <== addressFromPubKey.out;
    // createNewLeaf.inputs[1] <== newLeafSecret; // Note this secret is different than in createSignedLeaf; we are changing *only* the secret -- no other fields
    // createNewLeaf.inputs[2] <== customFields[0];
    // createNewLeaf.inputs[3] <== customFields[1];
    // createNewLeaf.inputs[4] <== iat; 
    // createNewLeaf.inputs[5] <== scope;
    
    // // Check that the leaves were not spoofed; their preimage was indeed known
    // createSignedLeaf.out === signedLeaf;
    // createNewLeaf.out === newLeaf; 

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

component main {public [signedLeaf]} = OALTestingDeleteme();