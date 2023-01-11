pragma circom 2.0.0;
include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/eddsaposeidon.circom";

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

   component hash = Poseidon(6);
   // hash()
   component verifier = EdDSAPoseidonVerifier();
   verifier.enabled <== 1;
   verifier.Ax <== pubKeyX;
   verifier.Ay <== pubKeyY;
   verifier.R8x <== R8x;
   verifier.R8y <== R8y;
   verifier.S <== S;
   verifier.M <== newLeaf;
}

component main = OAL();