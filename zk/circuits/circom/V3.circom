// Checks that a credential corresponding to a nullifier secret key was signed by an issuer
pragma circom 2.0.0;
include "../../../node_modules/circomlib/circuits/poseidon.circom";
include "../../../node_modules/circomlib/circuits/eddsaposeidon.circom";
include "../../../node_modules/circomlib/circuits/comparators.circom";

template V3() {
    // Nothing-up-my-sleeve value: SHA256("Holonym Issuance")
    signal saltForIssuance <== 0x194ee5653c27cb200f64d0bd1ade2b4734e3341ea37712c6a5a4bd30870c33f1; 

    // ------------------------------------------------------------------ //
    // -------------------------- Inputs -------------------------------- //
    // ------------------------------------------------------------------ //

    // Issuer pubkey and signature (R, S) :
    signal input pubKeyX;
    signal input pubKeyY;
    signal input R8x;
    signal input R8y;
    signal input S;

    // The secret key used to create nullifiers.
    signal input nullifierSecretKey;

    // Time the issuer says the credential was issued at
    signal input iat;

    // A time the user can choose for their credential to expire. Max is one year from iat. 
    // To keep anonymity, the user should choose a random time slightly before iat, depending
    // On how long they want the anonymity
    signal input expiry;

    // Scope of credentials (probably set to 0)
    signal input scope; 

    // Three custom fields the issuer can put in the leaf (can be anything, e.g. [name, address, birthdate, phone #])
    signal input customFields[2];

    signal output issuerAddress;

    
    // ------------------------------------------------------------------ //
    // ------------------------- Constraints ---------------------------- //
    // ------------------------------------------------------------------ //

    // Reconstructs the signed nullifier from the nullifierSecretKey
    // For resistance to length-extension attacks, it's extremely important the secret input is the zero'th input.
    component signedNullifier = Poseidon(2);
    signedNullifier.inputs[0] <== nullifierSecretKey;
    signedNullifier.inputs[1] <== saltForIssuance;
    

    // This is our somewhat odd address scheme: hash of pubkey x and y, so that we don't have to worry about point conversions:
    component addressFromPubKey = Poseidon(2);
    addressFromPubKey.inputs[0] <== pubKeyX;
    addressFromPubKey.inputs[1] <== pubKeyY;
    issuerAddress <== addressFromPubKey.out;

    // Reconstruct the hash of the credentials that was signed by the issuer
    component createCredentialHash = Poseidon(6);

    createCredentialHash.inputs[0] <== addressFromPubKey.out;
    createCredentialHash.inputs[1] <== signedNullifier.out;
    createCredentialHash.inputs[2] <== customFields[0];
    createCredentialHash.inputs[3] <== customFields[1];
    createCredentialHash.inputs[4] <== iat; 
    createCredentialHash.inputs[5] <== scope;
    
    // Check that signature for the hashed credentials is actually from the given EdDSA public key
    component eddsaVerifier = EdDSAPoseidonVerifier();
    eddsaVerifier.enabled <== 1;
    eddsaVerifier.Ax <== pubKeyX;
    eddsaVerifier.Ay <== pubKeyY;
    eddsaVerifier.R8x <== R8x;
    eddsaVerifier.R8y <== R8y;
    eddsaVerifier.S <== S;
    eddsaVerifier.M <== createCredentialHash.out;

    // Check that expiry is <= 1 year of issuance
    // We can assume 31536001 and iat are safe values to use with LessThan (the issuer wouldn't lie about iat and if they could, we have other problems...)
    // However, we can't assume expiry - iat is safe, so we should check that it's at most 25 bits (31536001 has 25 bits)
    component n2b = Num2Bits(25);
    n2b.in <== expiry - iat;
    component lt = LessThan(25);
    lt.in[0] <== expiry - iat;
    lt.in[1] <== 31536001; // 1 year + 1 second
    lt.out === 1;
    component lt2 = LessThan(25); // check that iat < expiry
    lt.in[0] <== iat;
    lt.in[1] <== expiry;
    lt.out === 1;
}