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

const createProof = {
    // onAddLeaf : async (inputs: IOnAddLeafInputs) => {
        onAddLeaf : async (inputs) => {
        return await createProofCircom("onAddLeaf", "onAddLeaf_0001", inputs)
    },
    sybilResistance : ()=>{},
    proofOfResidency : ()=>{}
}
createProof.onAddLeaf({
    pubKeyX: 12345n,
    pubKeyY: 12345n,
    R8x: 12345n,
    R8y: 12345n,
    S: 12345n,

    // Old leaf and new leaf
    signedLeaf: 12345n,
    newLeaf: 12345n,

    // Secret known to issuer (signedLeafSecret) and secret known only to user (newLeafSecret)
    signedLeafSecret: 12345n,
    newLeafSecret: 12345n,

    // Time the issuer says the credential was issued at
    iat: 12345n,

    // Two custom fields the issuer can put in the leaf (can be anything, e.g. [name, address, birthdate, phone #])
    // For now, the last should always be a 0 (need to update spec so this is beter)
    customFields: [12345n, 12345n, 0n],

}).then(() => {
    process.exit(0);
});