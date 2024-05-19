// Checks that a credential corresponding to a nullifier secret key was signed by an issuer
pragma circom 2.0.0;
include "../../../node_modules/circomlib/circuits/poseidon.circom";
include "../../../node_modules/circomlib/circuits/eddsaposeidon.circom";
include "../../../node_modules/circomlib/circuits/comparators.circom";

// A template identical to V3, but without an expiry input. Expiry is important
// for circuits that are used when assigning on-chain SBTs, but for off-chain one-off
// proofs, expiry is not necessary. For such off-chain proofs, we recommend exposing
// the expiration date or iat in the credential itself--rather than an expiry set by
// the user--to make sure the user isn't using an old credential.
template V3SansExpiry() {
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
}
