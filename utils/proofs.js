const { prove, verify } = require("wasm-vole-zk-adapter");
const { WitnessCalculatorBuilder } = require("circom_runtime");
const snarkjs = require("snarkjs");
const fs = require("fs");

async function createProofCircom(circuitName, zkeyName, inputs) {
    // await snarkjs.wtns.calculate(inputs, `./zk/${circuitName}_js/${circuitName}.wasm`, "tmp.wtns");
    // console.log("Witness: ", fs.readFileSync("tmp.wtns").toString());

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, `./zk/circuits/circom/artifacts/${circuitName}_js/${circuitName}.wasm`, `./zk/pvkeys/circom/${zkeyName}.zkey`);

    return {proof: proof, publicSignals: publicSignals};
}

async function verifyProofCircom(circuitName, proof) {
    const vKey = JSON.parse(fs.readFileSync(`./zk/pvkeys/circom/${circuitName}_verification_key.json`));
    return await snarkjs.groth16.verify(vKey, proof.publicSignals, proof.proof);
}

async function createProofVOLEZK(circuitName, inputs) {
    const r1cs = fs.readFileSync(`./zk/circuits/circom/artifacts/${circuitName}.r1cs`);
    const wasm = fs.readFileSync(`./zk/circuits/circom/artifacts/${circuitName}_js/${circuitName}.wasm`);
    
    const wc = await WitnessCalculatorBuilder(wasm);
    const witness =  (wc.circom_version() == 1) ? await wc.calculateBinWitness(inputs) : await wc.calculateWTNSBin(inputs);
    // fs.writeFile("tmp.wtns", witness, ()=>{})
    const proof = prove(r1cs, witness);
    // const verifierR1cs = fs.readFileSync('/Users/nanaknihal/vole_zk/verifier-server/circuits/circom/V3SybilResistance.r1cs')
    // const verification = verify(verifierR1cs, proof);
    // console.log('verification', verification)
    return proof
}
const Proofs = {
    // onAddLeaf : async (inputs: IOnAddLeafInputs) => {
    onAddLeaf : {
        prove : async (inputs) => {
            return await createProofCircom("onAddLeaf", "onAddLeaf_0001", inputs)
        },
        verify : async (proof) => {
            return await verifyProofCircom("onAddLeaf", proof)
        }
    },
    sybilResistance : { prove : ()=>{} } ,
    proofOfResidency : { prove : ()=>{} } ,
    testAuditableProof : {
        prove : async (inputs) => {
            return await createProofCircom("auditableProof-testwrapper", "auditableProof-testwrapper_0001", inputs)
        },
        verify : async (proof) => {
            return await verifyProofCircom("auditableProof-testwrapper", proof)
        }
    },
    testEGEncryption : { 
        prove : async (inputs) => {
            return await createProofCircom("encryptElGamal-testwrapper", "encryptElGamal-testwrapper_0001", inputs)
        },
        verify : async (proof) => {
            return await verifyProofCircom("encryptElGamal-testwrapper", proof)
        }
    },
    testMerkleTree : {
        prove : async (inputs) => {
            return await createProofCircom("merkleproof-testwrapper", "merkleproof-testwrapper_0001", inputs)
        },
        verify : async (proof) => {
            return await verifyProofCircom("merkleproof-testwrapper", proof)
        }
    },

    daEncrypt : {
        prove : async (inputs) => {
            return await createProofCircom("daEncrypt", "daEncrypt_0001", inputs)
        },
        verify : async (proof) => {
            return await verifyProofCircom("daEncrypt", proof)
        }
    },
}

module.exports = {
    Proofs : Proofs,
    createProofVOLEZK
}