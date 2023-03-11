const { createHash, randomBytes } = require('crypto');
const { groth16 } = require('snarkjs');
const { Utils } = require('threshold-eg-babyjub');
const prfEndpoint = 'https://prf.zkda.network/';

const ZK_DIR = (typeof window === 'undefined') ? './zk' : 'https://preproc-zkp.s3.us-east-2.amazonaws.com/circom';

const ORDER = 21888242871839275222246405745257275088614511777268538073601725287587578984328n;
const SUBORDER = ORDER >> 3n; // Order of Fr subgroup
const MAX_MSG = ORDER >> 10n; //Use 10 bits for Koblitz encoding

function randFr(): BigInt {
    return BigInt('0x'+randomBytes(64).toString('hex')) % SUBORDER
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
    return new Point(
        BigInt('420'),
        BigInt('69')
    )
}

/**
   * Gets the parameters needed to generate an encryption
   * @param msgsToEncrypt - an array of messages that need to be encrypted. These messages are base10-strings of numbers less than 21888242871839275222246405745257275088614511777268538073601725287587578984328 << 10, where << is the bitshift operator.
   * @returns parameters needed to encrypt
   *
   * @beta
   */
async function encryptParams(msgsToEncrypt: Array<string>): Promise<EncryptionParams> {
    // const msgsToEncrypt = ["12341234123412341234123412341234123412341234123412341234123412341234123412", "5555555"];
    const msgsAsPoints: Array<PointRepr> = await Promise.all(msgsToEncrypt.map(msg=>Utils.msgToPoint(msg)));
    const nonces = msgsToEncrypt.map(_=>randFr());
    const prfData = await Promise.all(msgsToEncrypt.map(_=>getPRF()));
    const prfSeeds = prfData.map(d=>BigInt('0x'+d.prfSeed))
    const ps: Array<BigInt> = prfData.map(d=>BigInt('0x'+d.prf));
    const pAsPoints: Array<PointRepr> = await Promise.all(ps.map(p=>Utils.msgToPoint(p.toString())));
    const inputs = {
        msgsAsPoints: msgsAsPoints,
        encryptWithNonces: nonces,
        encryptToPubkey: getPubkey().toRepr(),
        prfSeeds: prfSeeds,
        ps: ps,
        pAsPoints: pAsPoints,
        signatureS: prfData.map(d=>BigInt(d.sig.S)),
        signatureR8: prfData.map(data=>{
            const R8: PointRepr = Point.fromHexStrings(
                data.sig.R8.x, data.sig.R8.y,
            ).toRepr();
            return R8;
        })
    }

    return inputs;
} 

setInterval(()=>encryptParams(["123"]).then(x=>console.log(x)), 1000)

/**
   * Encrypts a message and generates a proof of successful encryption
   * @param msgsToEncrypt - an array of messages that need to be encrypted. These messages are base10-strings of numbers less than 21888242871839275222246405745257275088614511777268538073601725287587578984328 << 10, where << is the bitshift operator.
   * @returns encryption and proof of proper encryption 
   *
   * @beta
   */
async function encryptAndProve(msgsToEncrypt: Array<string>): Promise<EncryptionProof> {
    const params: EncryptionParams = await encryptParams(msgsToEncrypt);
    const proof = await groth16.fullProve(params, `${ZK_DIR}/daEncrypt_js/daEncrypt.wasm`, `${ZK_DIR}/daEncrypt_0001.zkey`);
    // const proof = await snarkjs.groth16.fullProve(par, `./zk/circuits/circom/artifacts/${circuitName}_js/${circuitName}.wasm`, `./zk/pvkeys/circom/${zkeyName}.zkey`);
    console.log("public Signals", proof.publicSignals)
    return {
        encryption: proof.publicSignals,
        proof: proof
    }
} 

/* Point */
class Point {

    x: BigInt
    y: BigInt

    constructor(x: BigInt, y: BigInt){
        this.x = x;
        this.y = y;
    }
    static fromDecStrings(x: string, y: string): Point {
        return new Point(
            BigInt(x),
            BigInt(y)
        );
    }
    static fromHexStrings(x: string, y: string): Point {
        let [x_, y_] = [x,y].map(i=> 
            i.startsWith('0x') ? BigInt(i) : BigInt('0x' + i)
        );
        return new Point(x_, y_);
    }
    
    toRepr(): PointRepr {
        return {
            x: this.x.toString(),
            y: this.y.toString()
        }
    }
}

module.exports = {
    getPRF : getPRF
};