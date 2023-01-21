const { randomBytes } = require("crypto");
const { makeLeafMaker } = require("../utils/leaves");
const { Proofs } = require("../utils/proofs");
const { makeSigner } = require("../utils/signer");

// Should this be BE or LE? Trying be for now
// Takes Uint8Array, returns BigInt
const U8ArrToBigIntBE = (x) => BigInt("0x"+Buffer.from(x).toString("hex"));

async function run () {
    const PRIVATE_KEY_SEED = randomBytes(64);
    const signer = await makeSigner(PRIVATE_KEY_SEED);
    const pubKey = await signer.getPubkey();
    const leafMaker = await makeLeafMaker();

    const customFields = [0n,0n]; //Empty for now, can be custom fields to add to credentials, e.g. phone number or birthdate:
    const { leaf, signature } = signer.createAndSignLeaf(customFields);
    const { originalLeaf, newLeaf } = leafMaker.swapAndCreateSecret(leaf);

    console.log("alijvelicjelicjwas", originalLeaf.inputs.customFields)
    // 
    Proofs.onAddLeaf({
        pubKeyX: U8ArrToBigIntBE(pubKey[0]),
        pubKeyY: U8ArrToBigIntBE(pubKey[1]),
        R8x: U8ArrToBigIntBE(signature.R8[0]),
        R8y: U8ArrToBigIntBE(signature.R8[1]),
        S: signature.S,
    
        // Old leaf and new leaf
        signedLeaf: U8ArrToBigIntBE(originalLeaf.digest),
        newLeaf: U8ArrToBigIntBE(newLeaf.digest),
    
        // Secret known to issuer (signedLeafSecret) and secret known only to user (newLeafSecret)
        signedLeafSecret: originalLeaf.inputs.secret.toBigInt(),
        newLeafSecret: newLeaf.inputs.secret.toBigInt(),
    
        // Time the issuer says the credential was issued at
        iat: originalLeaf.inputs.iat,
    
        // Two custom fields the issuer can put in the leaf (can be anything, e.g. [name, address, birthdate, phone #])
        customFields: originalLeaf.inputs.customFields,
        scope: originalLeaf.inputs.scope
    })
}

run().then(()=>null)
