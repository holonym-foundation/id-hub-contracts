pragma circom 2.0.0;
include "./V3.circom";
// include "./encryptElGamalFixedPubkey.circom";
include "./encryptElGamalVariablePubkey.circom";
include "./twistedIsomorphism.circom";

template V3CleanHands() {
    // ------------------------------------------------------------------ //
    // -------------------------- Constants ----------------------------- //
    // ------------------------------------------------------------------ //

    var numMsgsToEncrypt = 3; // [firstName, lastName, birthdate]
    signal twentyFourBytes <== 2**192 - 1;
    
    // ------------------------------------------------------------------ //
    // -------------------------- Inputs -------------------------------- //
    // ------------------------------------------------------------------ //

    // ElGamal encryption parameters
    signal input encryptedTo[2]; // The public key the messages are encrypted to
    signal input ephemeralSecretKey[numMsgsToEncrypt];
    signal input msgsAsPoints[numMsgsToEncrypt][2];

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

    // Custom fields from the issuer. Our "clean hands" issuer issues creds:
    // [birthdate, poseidon(firstName, lastName)]
    signal input customFields[2];

    signal input firstName;
    signal input lastName;
    signal input birthdate;

    // Recipient's wallet address or other identifier that they want to bind the proof to
    signal input recipient;

    // A salt to derive the public nullifier for a public actionId from
    signal input actionId;
    signal output actionNullifier;

    signal output issuerAddress;
    
    // Encryption output will be the two points c1 and c2 for every message. 
    // It has dimensions [numMsgsToEncrypt][2][2]. E.g., encryptions[1] will be 
    // a 2*2 array representing [c1,c2] where c1 and c2 are the two points that 
    // represent an encryption
    signal output encryptions[numMsgsToEncrypt][2][2];

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

    // Constrain nameHash in customFields
    component nameHash = Poseidon(2);
    nameHash.inputs[0] <== firstName;
    nameHash.inputs[1] <== lastName;
    customFields[1] === nameHash.out;

    // Constrain the reconstruction of the action nullifier
    component createActionNullifier = Poseidon(2);
    createActionNullifier.inputs[0] <== nullifierSecretKey;
    createActionNullifier.inputs[1] <== actionId;

    // Output the action nullifier
    actionNullifier <== createActionNullifier.out;

    // Constrain the recipient
    signal recipientSquared <== recipient * recipient;

    component encryptors[numMsgsToEncrypt];

    signal msgs[3] <== [firstName, lastName, birthdate];

    signal firstTwentyFourBytesOfY[numMsgsToEncrypt];

    component toTwisted[numMsgsToEncrypt];
    component toUntwisted[numMsgsToEncrypt * 2];

    var untwistedIdx = 0;
    // Note that the elements of msgsAsPoints should be ordered [firstName, lastName, birthdate]
    for(var i = 0; i < numMsgsToEncrypt; i++) {
        // Compare the y-coordinate of each point to the corresponding message.
        // The rightmost 24 bytes of the y-coordinate should equal the message.
        firstTwentyFourBytesOfY[i] <-- msgsAsPoints[i][1] & twentyFourBytes;
        msgs[i] === firstTwentyFourBytesOfY[i];
        
        // We must convert the untwisted points to twisted points before encrypting
        toTwisted[i] = UntwistedToTwisted();
        toTwisted[i].in <== msgsAsPoints[i];

        // Prove encryption
        encryptors[i] = EncryptElGamal();
        encryptors[i].pubkey <== encryptedTo;
        encryptors[i].y <== ephemeralSecretKey[i];
        encryptors[i].messageAsPoint <== toTwisted[i].out;

        // Convert ciphertext points back to untwisted points
        toUntwisted[untwistedIdx] = TwistedToUntwisted();
        toUntwisted[untwistedIdx].in <== encryptors[i].c1;
        toUntwisted[untwistedIdx + 1] = TwistedToUntwisted();
        toUntwisted[untwistedIdx + 1].in <== encryptors[i].c2;

        // ElGamal encryption values
        encryptions[i] <== [toUntwisted[untwistedIdx].out, toUntwisted[untwistedIdx + 1].out];

        untwistedIdx += 2;
    }
}

component main { public [encryptedTo, recipient, actionId, expiry] } = V3CleanHands();
