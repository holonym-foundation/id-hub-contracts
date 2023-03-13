interface Point {
    x: string,
    y: string
}

// Arrays should be of length N where N is the number of messages to encrypt
interface EncryptionParams {
    messagesAsPoint: Array<Array<string>>;
    encryptWithNonce: Array<string>;

    // prf seed and output:
    prfSeed: Array<string>;
    pAsPoint: Array<Array<string>>;
    // Signature:
    S: Array<string>;
    R8x: Array<string>;
    R8y: Array<string>;
}

interface EncryptionProof {
}