    export interface IOnAddLeafInputs {
        pubKeyX: BigInt,
        pubKeyY: BigInt,
        R8x: BigInt,
        R8y: BigInt,
        S: BigInt,

        // Old leaf and new leaf
        signedLeaf: BigInt,
        newLeaf: BigInt,

        // Secret known to issuer (signedLeafSecret) and secret known only to user (newLeafSecret)
        signedLeafSecret: BigInt,
        newLeafSecret: BigInt,

        // Time the issuer says the credential was issued at
        iat: BigInt,

        // Two custom fields the issuer can put in the leaf (can be anything, e.g. [name, address, birthdate, phone #])
        customFields: Array<BigInt>,

        scope: BigInt

    }
    