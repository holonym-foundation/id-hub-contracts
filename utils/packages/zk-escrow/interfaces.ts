interface PointRepr {
    x: string,
    y: string,
}
// interface Point {
//     x: BigInt,
//     y: BigInt
// }
// interface DecStringPoint {
//     x: string,
//     y: string,
// }
// interface HexStringPoint {
//     x: string,
//     y: string,
// }
// // Arrays should be of length N where N is the number of messages to encrypt
// interface EncryptionParams {
//     // Inner array should be of length 2: x, y
//     messagesAsPoint: Array<Array<string>>;
//     // Length 2: x, y
//     encryptToPubkey: Array<string>;
//     encryptWithNonce: Array<string>;
//     prfSeed: Array<string>;
//     pAsPoint: Array<string>;
//     // Signature:
//     S: Array<string>;
//     R8x: Array<string>;
//     R8y: Array<string>;
// }

// Arrays should be of length N where N is the number of messages to encrypt
interface EncryptionParams {
    // Inner array should be of length 2: x, y
    msgsAsPoints: Array<PointRepr>;
    encryptWithNonces: Array<BigInt>;
    encryptToPubkey: PointRepr;

    // prf seed and output:
    prfSeeds: Array<BigInt>;
    ps: Array<BigInt>;
    pAsPoints: Array<PointRepr>;
    // Signature:
    signatureS: Array<BigInt>;
    signatureR8: Array<PointRepr>;
}

interface EncryptionProof {
}