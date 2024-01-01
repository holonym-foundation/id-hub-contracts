pragma circom 2.0.0;
include "./V3.circom";
template SybilResistance() {
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

    // Recipient's wallet address or other identifier that they want to bind the proof to
    signal input recipient;

    // A salt to derive the public nullifier for a public actionId from
    signal input actionId;
    signal output actionNullifier;

    signal output issuerAddress;
    
    // ------------------------------------------------------------------ //
    // ------------------------- Constraints ---------------------------- //
    // ------------------------------------------------------------------ //
    // Check the constraints necessary in any Holonym V3 circuit
    component v3 = V3();
    v3.pubKeyX <== pubKeyX;
    v3.pubKeyY <== pubKeyY;
    v3.R8x <== R8x;
    v3.R8y <== R8y; 
    v3.S <== S;
    v3.nullifierSecretKey <== nullifierSecretKey;
    v3.iat <== iat;
    v3.expiry <== expiry;
    v3.scope <== scope; 
    v3.customFields <== customFields;

    // Output the issuer's address
    issuerAddress <== v3.issuerAddress;

    // Constrain the reconstruction of the action nullifier
    component createActionNullifier = Poseidon(2);
    createActionNullifier.inputs[0] <== nullifierSecretKey;
    createActionNullifier.inputs[1] <== actionId;

    // Output the action nullifier
    actionNullifier <== createActionNullifier.out;

    // Constrain the recipient
    signal recipientSquared <== recipient * recipient;
}

component main { public [recipient, actionId, expiry] } = SybilResistance();