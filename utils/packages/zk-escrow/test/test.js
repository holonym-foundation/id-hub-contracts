const { readFileSync } = require("fs");
const { encryptAndProve } = require("../lib/main");
const snarkjs = require("snarkjs");
const { expect } = require("chai");
describe("zkEscrow circuit", function (){
    this.timeout(10000); //Plane wifi xD
    before(async function() {
        const { tag, proof } = await encryptAndProve("69", ["1234567898765"]);
        this.tag = tag; this.proof = proof;
        console.log(tag)
        this.vKey = JSON.parse(readFileSync(`./zk/daEncrypt_verification_key.json`));
    });
    
    it("Proof generation and verification successful", async function() {
        console.log(this.proof.publicSignals, this.proof.publicSignals.length);
        const res = await snarkjs.groth16.verify(this.vKey, this.proof.publicSignals, this.proof.proof);
        expect(res).to.equal("test malleability");
    });

    // it("All constraints are taken into account", async function() {
    //     const res = await snarkjs.groth16.verify(this.vKey, this.proof.publicSignals, this.proof.proof);
    //     expect(res).to.equal(true);
    // });

    // for (let i = 0; i < this.proof.publicSignals.length; i++) {
    //     it(`Proof generation and verification successful for ${i}`, async function() {
    //         console.log(this.proof.publicSignals[i])
    //     });
    // }
    
})
