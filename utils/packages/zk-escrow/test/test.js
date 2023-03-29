const { readFileSync } = require("fs");
const { encryptAndProve } = require("../lib/main");
const snarkjs = require("snarkjs");

describe("Tests", function (){
    this.timeout(10000); //Plane wifi xD
    it("Malleability", async function() {
        const { encryption, proof } = await encryptAndProve("69", ["1234567898765"]);
        const vKey = JSON.parse(readFileSync(`./zk/daEncrypt_verification_key.json`));
        const result = await snarkjs.groth16.verify(vKey, proof.publicSignals, proof.proof);
        console.log("result", result)
    });
})
