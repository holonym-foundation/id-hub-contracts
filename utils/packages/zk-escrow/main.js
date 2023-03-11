"use strict";
const { createHash, randomBytes } = require('crypto');
const { groth16 } = require('snarkjs');
const { Utils } = require('threshold-eg-babyjub');
console.log(groth16);
const prfEndpoint = 'https://prf.zkda.network/';
const ZK_DIR = (typeof window === 'undefined') ? './zk' : 'https://preproc-zkp.s3.us-east-2.amazonaws.com/circom';
const ORDER = 21888242871839275222246405745257275088614511777268538073601725287587578984328n;
const SUBORDER = ORDER >> 3n; // Order of Fr subgroup
const MAX_MSG = ORDER >> 10n; //Use 10 bits for Koblitz encoding
function randFr() {
    return BigInt('0x' + randomBytes(64).toString('hex')) % SUBORDER;
}
async function getPRF() {
    // Authenticate yourself to some random number by showing knowledge of its preimage. This will allow you to ge the PRF fo the preiamge
    const preimage = randomBytes(32).toString('hex');
    const hash = createHash('sha512');
    hash.update(preimage);
    const digest = hash.digest('hex');
    const r = await fetch(prfEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            preimage: preimage,
            digest: digest
        })
    });
    return await r.json();
}
function getPubkey() {
    return {
        x: '420',
        y: '69'
    };
}
/**
   * Gets the parameters needed to generate an encryption
   * @param msgsToEncrypt - an array of messages that need to be encrypted. These messages are base10-strings of numbers less than 21888242871839275222246405745257275088614511777268538073601725287587578984328 << 10, where << is the bitshift operator.
   * @returns parameters needed to encrypt
   *
   * @beta
   */
async function encryptParams(msgsToEncrypt) {
    const encryptToPK = getPubkey();
    // const msgsToEncrypt = ["12341234123412341234123412341234123412341234123412341234123412341234123412", "5555555"];
    const msgsAsPoints = await Promise.all(msgsToEncrypt.map(msg => Utils.msgToPoint(msg)));
    const nonces = msgsToEncrypt.map(_ => randFr().toString());
    const inputs = {
        messagesAsPoint: msgsAsPoints.map(point => [point.x, point.y]),
        encryptToPubkey: [encryptToPK.x, encryptToPK.y],
        encryptWithNonce: nonces
    };
    return inputs;
}
setInterval(() => encryptAndProve(["123"]).then(x => console.log(x)), 1000);
/**
   * Encrypts a message and generates a proof of successful encryption
   * @param msgsToEncrypt - an array of messages that need to be encrypted. These messages are base10-strings of numbers less than 21888242871839275222246405745257275088614511777268538073601725287587578984328 << 10, where << is the bitshift operator.
   * @returns encryption and proof of proper encryption
   *
   * @beta
   */
async function encryptAndProve(msgsToEncrypt) {
    const params = await encryptParams(msgsToEncrypt);
    const proof = await groth16.fullProve(params, `${ZK_DIR}/daEncrypt_js/daEncrypt.wasm`, `${ZK_DIR}/daEncrypt_0001.zkey`);
    // const proof = await snarkjs.groth16.fullProve(par, `./zk/circuits/circom/artifacts/${circuitName}_js/${circuitName}.wasm`, `./zk/pvkeys/circom/${zkeyName}.zkey`);
    console.log("public Signals", proof.publicSignals);
    return {
        encryption: proof.publicSignals,
        proof: proof
    };
}
module.exports = {
    getPRF: getPRF
};
