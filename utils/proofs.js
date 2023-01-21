// import { IOnAddLeafInputs } from "../zk/interfaces/IOnAddLeafInputs";

const snarkjs = require("snarkjs");
const fs = require("fs");


async function createProofCircom(circuitName, zkeyName, inputs) {
    console.log(process.cwd())
    const { proof, publicInputs } = await snarkjs.groth16.fullProve(inputs, `./zk/${circuitName}_js/${circuitName}.wasm`, `./zk/pvkeys/${zkeyName}.zkey`);

    console.log("Proof: ");
    console.log(JSON.stringify({proof: proof, inputs: publicInputs}));

    // const vKey = JSON.parse(fs.readFileSync("verification_key.json"));

    // const res = await snarkjs.groth16.verify(vKey, publicInputs, proof);

    // if (res === true) {
    //     console.log("Verification OK");
    // } else {
    //     console.log("Invalid proof");
    // }

}

const Proofs = {
    // onAddLeaf : async (inputs: IOnAddLeafInputs) => {
        onAddLeaf : async (inputs) => {
        return await createProofCircom("onAddLeaf", "onAddLeaf_0001", inputs)
    },
    sybilResistance : ()=>{},
    proofOfResidency : ()=>{}
}

module.exports = {
    Proofs : Proofs
}