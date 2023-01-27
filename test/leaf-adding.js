const { poseidon } = require("circomlibjs-old");
const { buildPoseidon, buildPoseidonReference, buildPoseidonWasm } = require("circomlibjs");
const { randomBytes } = require("crypto");
const { U8ArrToBigInt } = require("../utils/casts");
const { makeLeafMaker } = require("../utils/leaves");
const { Proofs } = require("../utils/proofs");
const { makeSigner } = require("../utils/signer");

async function run () {
    const PRIVATE_KEY_SEED = randomBytes(64);
    const signer = await makeSigner(PRIVATE_KEY_SEED);
    // const pubKey = await signer.getPubkey();
    const leafMaker = await makeLeafMaker();
    const poseidon2 = await buildPoseidon();
    // const poseidon3 = buildPoseidonReference();
    // const poseidon4 = buildPoseidonWasm();
    console.log(
        "pppp",
        poseidon([69n]).toString(16)
        // signer.bjj.F.toObject(poseidon2([Buffer.from("")])).toString(16),
        // U8ArrToBigInt(poseidon3([69n])).toString(16),
        // U8ArrToBigInt(poseidon4([69n])).toString(16)
        )
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
    // const { leaf, signature } = signer.createAndSignLeaf(customFields);
    // const { originalLeaf, newLeaf } = leafMaker.swapAndCreateSecret(leaf);
    // const address = signer.getAddress();
    // console.log("should be", address, poseidon([U8ArrToBigInt(pubKey[0]), U8ArrToBigInt(pubKey[1])]))

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
    
    const formatFr = (frString)=> frString.replace("Fr(","").replace(")","");
    const frToBigInt = (frString) => BigInt(formatFr(frString));
    // Destructive:
    // const formatCreds = (creds) => Object.keys(creds).map(key=>{console.log(creds[key], "abcbbbcbbcbcbcds"); creds[key]=formatFr(creds[key])});
    let creds = JSON.parse("{\"credentials\":{\"address\":\"Fr(0x002c69e750d670c47bdc4746ed2e70469c4a358b7238e9078e63cb0d946426bb)\",\"secret\":\"Fr(0x0eb548be190f189419e3bdeeb91ccb748527baba76ef0dbb8812c5124953110c)\",\"custom_fields\":[\"Fr(0x0000000000000000000000000000000000000000000000000000000000000045)\",\"Fr(0x0000000000000000000000000000000000000000000000000000000000000045)\"],\"iat\":\"Fr(0x00000000000000000000000000000000000000000000000000000000e77da9fa)\",\"scope\":\"Fr(0x0000000000000000000000000000000000000000000000000000000000000000)\"},\"leaf\":\"Fr(0x0367c8ef07d8cb8b54df23b59c9e26137a828cf0f0e3ffc067e2f6a17c2d45a5)\",\"pubkey\":[\"Fr(0x1e6a69b9fb7be79b85794b11ff715e247a1f5ef9fa2c76e5ca49cde15a81cf0a)\",\"Fr(0x19a6ce18d4b36b0432145bddd6036c9e9d22e5d739574354f0a49f6fb0d71f3a)\"],\"signature\":{\"r_b8\":[\"Fr(0x1e5e40f114afe65b8bf247d1bbd216acc9cbf714d8c23b434e231ba58b78da82)\",\"Fr(0x022db1d1c678052f14a3c659f5ef0b2542fda9e628fb1987f6b4663a8d894eed)\"],\"s\":\"1667342502539031665853759726972578782554169435561166400807927693137680889973\"}}");
    // formatCreds(creds);
    // console.log("creds", creds);

    Proofs.onAddLeafTestingDeleteThisFunction({
        pubKeyX: frToBigInt(creds.pubkey[0]),
        pubKeyY: frToBigInt(creds.pubkey[1]),
        R8x: frToBigInt(creds.signature.r_b8[0]),
        R8y: frToBigInt(creds.signature.r_b8[1]),
        S: frToBigInt(creds.signature.s),
        // pubKeyX: BigInt("0x26dd7e90ddc2c91dae9bf074e7b3b2f05fe4228fbc3d17cce7b697031e20fbd9"),//signer.bjj.F.toObject(pubKey[0]),
        // pubKeyY: BigInt("0x2fb6e1bcb68f054584839c86e44b52410bc5d1d44e92d062acc22b9279a948ce"),//signer.bjj.F.toObject(pubKey[1]),
        // R8x: BigInt("0x2705351032fa33950853db8b17c4fcc38b7b8adea0a30e4861fcb2810d952ef7"),//signer.bjj.F.toObject(signature.R8[0]),
        // R8y: BigInt("0x03b126d5a0c48c8ef897e45edeb28317603e7052cf2433d234a7836dec3aabe6"),//signer.bjj.F.toObject(signature.R8[1]),
        // S: BigInt("838451496104979414106000340289772086984298615695777911998189003250685443584"),//signature.S,
    
        // Old leaf and new leaf
        signedLeaf: frToBigInt(creds.leaf), //originalLeaf.digest,
        // newLeaf: newLeaf.digest,
    
        // // Secret known to issuer (signedLeafSecret) and secret known only to user (newLeafSecret)
        // signedLeafSecret: originalLeaf.inputs.secret.toBigInt(),
        // newLeafSecret: newLeaf.inputs.secret.toBigInt(),
    
        // // Time the issuer says the credential was issued at
        // iat: originalLeaf.inputs.iat,
    
        // // Two custom fields the issuer can put in the leaf (can be anything, e.g. [name, address, birthdate, phone #])
        // customFields: originalLeaf.inputs.customFields,
        // scope: originalLeaf.inputs.scope,
        
        // deleteThisSignalAddressForTesting: address,
        // abcdefghijklmnopqw: 3n
    })
}

run().then(()=>null)
