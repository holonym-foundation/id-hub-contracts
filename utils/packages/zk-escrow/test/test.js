const { readFileSync } = require("fs");
const { encryptAndProve, randFr } = require("../lib/main");
const snarkjs = require("snarkjs");
const { expect } = require("chai");
const signalOrder = require("../signalOrder.json");

describe("zkEscrow circuit", function (){
    before(async function() {
        const [provableEncryption, commitmentData] = await encryptAndProve("69", ["1234567898765"]);
        this.tag = provableEncryption.tag; this.proof = provableEncryption.proof;
        this.vKey = JSON.parse(readFileSync(`./zk/daEncrypt_verification_key.json`));
    });
    
    it("Proof generation and verification successful", async function() {
        console.log(this.proof.publicSignals, this.proof.publicSignals.length);
        const res = await snarkjs.groth16.verify(this.vKey, this.proof.publicSignals, this.proof.proof);
        expect(res).to.equal(true);
    });

    it("All public signals are constrained (includes malleability check)", async function() {
        for (let i = 0; i < this.proof.publicSignals.length; i++) {
            let wrongPublicSignals = [...this.proof.publicSignals];
            wrongPublicSignals[i] = randFr().toString();
            const res = await snarkjs.groth16.verify(this.vKey, wrongPublicSignals, this.proof.proof);
            expect(res).to.equal(false,`Signal ${signalOrder[i]} is not constrained`);
        }
        
    });

    after(async function() {
        // process.exit(0);
    });
})
