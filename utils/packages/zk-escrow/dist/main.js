"use strict";
const { createHash, randomBytes } = require('crypto');
const { groth16 } = require('snarkjs');
const { Utils } = require('threshold-eg-babyjub');
const prfEndpoint = 'https://prf.zkda.network/';
/* TODO: find a better way to set ZK_DIR */
let ZK_DIR;
// if not in a browser, circom expects a file:
if (typeof window === 'undefined') {
    // if in node_modules, this path is different
    const runningAsScript = require.main === module;
    ZK_DIR = runningAsScript ? './zk' : './node_modules/zk-escrow/zk';
    // if in a browser, circom expects a url:
}
else {
    ZK_DIR = 'https://preproc-zkp.s3.us-east-2.amazonaws.com/circom';
}
const ORDER_r = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const ORDER_n = 21888242871839275222246405745257275088614511777268538073601725287587578984328n;
const SUBORDER = ORDER_n >> 3n; // Order of prime subgroup
const MAX_MSG = ORDER_n >> 10n; //Use 10 bits for Koblitz encoding
function randFr() {
    return BigInt('0x' + randomBytes(64).toString('hex')) % ORDER_r;
}
async function getPRF() {
    // Authenticate yourself to some random number by showing knowledge of its preimage. This will allow you to ge the PRF fo the preiamge
    const preimage = randomBytes(64).toString('hex');
    const hash = createHash('sha512');
    hash.update(preimage);
    const digestFr = BigInt('0x' + hash.digest('hex')) % ORDER_r;
    const r = await fetch(prfEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            preimage: preimage,
            digestFr: digestFr.toString()
        })
    });
    return await r.json();
}
function getPubkey() {
    return ['420', '69'];
}
/**
   * Gets the parameters needed to generate an encryption
   * @param msgsToEncrypt - an array of messages that need to be encrypted. These messages are base10-strings of numbers less than 21888242871839275222246405745257275088614511777268538073601725287587578984328 << 10, where << is the bitshift operator.
   * @returns parameters needed to encrypt
   *
   * @beta
   */
async function encryptParams(accessControlID, msgsToEncrypt) {
    // const msgsToEncrypt = ["12341234123412341234123412341234123412341234123412341234123412341234123412", "5555555"];
    const msgsAsPointObjects = await Promise.all(msgsToEncrypt.map(msg => Utils.msgToPoint(msg)));
    const msgsAsPoints = msgsAsPointObjects.map(obj => [obj.x, obj.y]);
    const nonces = msgsToEncrypt.map(_ => randFr().toString());
    const commitRnd = msgsToEncrypt.map(_ => randFr().toString());
    const prfData = await Promise.all(msgsToEncrypt.map(_ => getPRF()));
    const prfIn = prfData.map(d => BigInt(d.prfIn).toString());
    const prfOuts = prfData.map(d => BigInt(d.prfOut).toString());
    const prfOutAsPointObjects = await Promise.all(prfOuts.map(p => Utils.msgToPoint(p.toString())));
    const prfOutAsPoints = prfOutAsPointObjects.map(obj => [obj.x, obj.y]);
    const inputs = {
        accessControlID: accessControlID,
        msgAsPoint: msgsAsPoints,
        encryptWithNonce: nonces,
        // prf inputs, and prf outputs converted to points
        prfIn: prfIn,
        prfOutAsPoint: prfOutAsPoints,
        // Signature
        S: prfData.map(d => BigInt(d.sig.S).toString()),
        R8x: prfData.map(data => data.sig.R8.x.toString()),
        R8y: prfData.map(data => data.sig.R8.y.toString()),
        // Randomness for commtiment:
        rnd: commitRnd
    };
    return inputs;
}
// setInterval(async () => getPRF().then(x=>console.log(x)), 1000)
// setInterval(()=>encryptParams(["123"]).then(x=>console.log(x)), 1000)
setInterval(() => encryptAndProve(["123"]).then(x => console.log(x)), 2000);
/**
   * Encrypts a message and generates a proof of successful encryption
   * @param msgToEncrypt - an array of messages that need to be encrypted. These messages are base10-strings of numbers less than 21888242871839275222246405745257275088614511777268538073601725287587578984328 << 10, where << is the bitshift operator.
   * @returns encryption and proof of proper encryption
   *
   * @beta
   */
async function encryptAndProve(msgToEncrypt) {
    const params = await encryptParams("123456", msgToEncrypt);
    // const proofParams = {};
    // Object.keys(params).forEach(param=>
    //     proofParams[param] = typeof
    // );
    let proof;
    try {
        proof = await groth16.fullProve(params, `${ZK_DIR}/daEncrypt_js/daEncrypt.wasm`, `${ZK_DIR}/daEncrypt_0001.zkey`);
    }
    catch {
        proof = await groth16.fullProve(params, `${ZK_DIR}/daEncrypt_js/daEncrypt.wasm`, `${ZK_DIR}/daEncrypt_0001.zkey`);
    }
    // const proof = await snarkjs.groth16.fullProve(par, `./zk/circuits/circom/artifacts/${circuitName}_js/${circuitName}.wasm`, `./zk/pvkeys/circom/${zkeyName}.zkey`);
    //[proof.publicSignals.length-])
    return {
        encryption: proof.publicSignals,
        proof: proof
    };
}
module.exports = {
    encryptParams: encryptParams,
    encryptAndProve: encryptAndProve
};
