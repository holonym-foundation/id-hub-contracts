const { poseidon } = require("circomlibjs-old");
const { randomBytes } = require("crypto");
const { U8ArrToBigInt } = require("../utils/casts");
const { makeLeafMaker } = require("../utils/leaves");
const { Proofs } = require("../utils/proofs");
const { makeSigner } = require("../utils/signer");

async function run () {
    const PRIVATE_KEY_SEED = randomBytes(64);
    const signer = await makeSigner(PRIVATE_KEY_SEED);
    const pubKey = await signer.getPubkey();
    const leafMaker = await makeLeafMaker();
    // const poseidon = await buildPoseidon();

    // const endians = (x) => {
    //     const big = U8ArrToBigIntBE(x);
    //     const little = U8ArrToBigIntLE(x);
    //     return {
    //         big: big,
    //         bigModOrder: big % signer.bjj.order,
    //         bigModSubOrder: big % signer.bjj.subOrder,
    //         little: little,
    //         littleModOrder: little % signer.bjj.order,
    //         littleModSubOrder: little % signer.bjj.subOrder
    //     }
    // };


    const customFields = [0n,0n]; //Empty for now, can be custom fields to add to credentials, e.g. phone number or birthdate:
    const { leaf, signature } = signer.createAndSignLeaf(customFields);
    const { originalLeaf, newLeaf } = leafMaker.swapAndCreateSecret(leaf);
    const address = signer.getAddress();
    console.log("should be", address, poseidon([U8ArrToBigInt(pubKey[0]), U8ArrToBigInt(pubKey[1])]))

    // console.log("should be", poseidon.F.toString(poseidon([pubKey[0]])))
    // console.log("address", U8ArrToBigInt(poseidon(pubKey.map(x=>(U8ArrToBigInt(x))))))
    // console.log("pubkey", pubKey.map(x=>U8ArrToBigInt(x)))
    // console.log("pubkey", endians(pubKey[0]), endians(pubKey[1]));
    // console.log("address", endians(address))
    // console.log(endians(signer.poseidon([pubKey[0].reverse(), pubKey[1].reverse()])))
    // console.log(endians(signer.poseidon([pubKey[0], pubKey[1]])))
    // console.log(endians(signer.poseidon(pubKey[0].reverse(), pubKey[1].reverse())))
    // console.log(endians(signer.poseidon(pubKey[0], pubKey[1])))
    // // console.log(endians(signer.poseidon([endians(pubKey[0]).big, endians(pubKey[1]).big])))
    // console.log(endians(signer.poseidon(endians(pubKey[0]).little, endians(pubKey[1]).little)))
    // console.log(endians(signer.poseidon([endians(pubKey[0]).little, endians(pubKey[1]).little])))

    // console.log(
    //     signer.poseidon([
    //         signer.getAddress(),
    //         originalLeaf.inputs.secret,
    //         customFields[0],
    //         customFields[1],
    //         originalLeaf.inputs.iat,
    //         originalLeaf.inputs.scope]
    //     ),
    //     originalLeaf.digest
    // )

    Proofs.onAddLeaf({
        pubKeyX: U8ArrToBigInt(pubKey[0]),
        pubKeyY: U8ArrToBigInt(pubKey[1]),
        R8x: U8ArrToBigInt(signature.R8[0]),
        R8y: U8ArrToBigInt(signature.R8[1]),
        S: signature.S,
    
        // Old leaf and new leaf
        signedLeaf: U8ArrToBigInt(originalLeaf.digest),
        newLeaf: U8ArrToBigInt(newLeaf.digest),
    
        // Secret known to issuer (signedLeafSecret) and secret known only to user (newLeafSecret)
        signedLeafSecret: originalLeaf.inputs.secret.toBigInt(),
        newLeafSecret: newLeaf.inputs.secret.toBigInt(),
    
        // Time the issuer says the credential was issued at
        iat: originalLeaf.inputs.iat,
    
        // Two custom fields the issuer can put in the leaf (can be anything, e.g. [name, address, birthdate, phone #])
        customFields: originalLeaf.inputs.customFields,
        scope: originalLeaf.inputs.scope,
        
        // deleteThisSignalAddressForTesting: address,
        // abcdefghijklmnopqw: 3n
    })
}

run().then(()=>null)
