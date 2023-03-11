interface Point {
    x: string,
    y: string
}
interface EncryptionParams {
    messagesAsPoint: Array<Array<string>>;
    encryptToPubkey: Array<string>;
    encryptWithNonce: Array<string>;
}

interface EncryptionProof {
}