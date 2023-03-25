interface Point {
    x: string,
    y: string
}

// Arrays should be of length N where N is the number of messages to encrypt
interface EncryptionParams {
    // Address pointing to the contract that access-gates the encrypted data: 
    accessControlID: String;

    msgAsPoint: Array<Array<string>>;
    encryptWithNonce: Array<string>;

    // prf seed and output:
    prfIn: Array<string>;
    prfOutAsPoint: Array<Array<string>>;
    // Signature:
    S: Array<string>;
    R8x: Array<string>;
    R8y: Array<string>;

    // randomness to use for Pedersen commitment of encrypted message:
    rnd: Array<string>;
}

interface EncryptionProof {
}