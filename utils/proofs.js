// import { IOnAddLeafInputs } from "../zk/interfaces/IOnAddLeafInputs";

const snarkjs = require("snarkjs");
const fs = require("fs");


async function createProofCircom(circuitName, zkeyName, inputs) {
    // await snarkjs.wtns.calculate(inputs, `./zk/${circuitName}_js/${circuitName}.wasm`, "tmp.wtns");
    // console.log("Witness: ", fs.readFileSync("tmp.wtns").toString());

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, `./zk/${circuitName}_js/${circuitName}.wasm`, `./zk/pvkeys/circom/${zkeyName}.zkey`);

    return {proof: proof, publicSignals: publicSignals};
}

async function verifyProofCircom(circuitName, proof) {
    const vKey = JSON.parse(fs.readFileSync(`./zk/pvkeys/circom/${circuitName}_verification_key.json`));
    console.log("vkey", vKey, "proof", proof.proof, "inputs", proof.inputs)
    return await snarkjs.groth16.verify(vKey, proof.publicSignals, proof.proof);
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
}

module.exports = {
    Proofs : Proofs
}