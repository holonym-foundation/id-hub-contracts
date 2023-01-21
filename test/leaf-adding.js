const { randomBytes } = require("crypto");
const { makeLeafMaker } = require("../utils/leaves");
const { Proofs } = require("../utils/proofs");
const { makeSigner } = require("../utils/signer");


async function run () {
    const PRIVATE_KEY_SEED = randomBytes(64);
    const signer = await makeSigner(PRIVATE_KEY_SEED);
    const leafMaker = await makeLeafMaker();
    const customFields = [0,0]; //Empty for now, can be custom fields to add to credentials, e.g. phone number or birthdate:
    const { leaf, signature } = signer.createAndSignLeaf(customFields);
    const { originalLeaf, newLeaf } = leafMaker.swapAndCreateSecret(leaf);
    console.log(newLeaf, originalLeaf)
}

run().then(()=>null)
// Proofs.onAddLeaf({
//     pubKeyX: pubKey[0],
//     pubKeyY: pubKey[1],
//     R8x: signature.R8[0],
//     R8y: signature.R8[1],
//     S: signature.S,

//     // Old leaf and new leaf
//     signedLeaf: 12345n,
//     newLeaf: 12345n,

//     // Secret known to issuer (signedLeafSecret) and secret known only to user (newLeafSecret)
//     signedLeafSecret: 12345n,
//     newLeafSecret: 12345n,

//     // Time the issuer says the credential was issued at
//     iat: 12345n,

//     // Two custom fields the issuer can put in the leaf (can be anything, e.g. [name, address, birthdate, phone #])
//     // For now, the last should always be a 0 (need to update spec so this is beter)
//     customFields: [12345n, 12345n, 0n],

// })