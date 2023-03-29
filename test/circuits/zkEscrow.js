const snarkjs = require("snarkjs");
// const { encryptAndProve } = require("../../utils/packages/zk-escrow/lib/main");
const { readFileSync } = require("fs");
const { encryptAndProve } = require("zk-escrow");
const { Proofs } = require("../../utils/proofs");
// const { expect } = require("chai");
// const { Proofs } = require("../../utils/proofs");
// const { Utils } = require("threshold-eg-babyjub");
// // const { Tree } = require("holo-merkle-utils");
// const { AuditLayerSimulator } = require("../../utils/threshold");
// const { randomBytes } = require("crypto");
// const { rejects } = require("assert");

describe.only("...", function (){
    before(async function (){
        // this.auditLayer = new AuditLayerSimulator();
        // await this.auditLayer.init();
    });
    it("Outputs proper encryption", async function () {
        throw('todo')
        // const encryptToPK = await this.auditLayer.pubkey();
        const msgsToEncrypt = ["12341234123412341234123412341234123412341234123412341234123412341234123412"];
        // const msgsAsPoints = await Promise.all(msgsToEncrypt.map(msg=>Utils.msgToPoint(msg)));
        // // const encryptedMsgs = await Promise.all(msgsToEncrypt.map(msg=>this.auditLayer.encryptToAuditLayer(msg)));
        // // NOTE: this is probably not a safe way to generate nonces; please generate a random element in the prime subgroup
        // const nonces = msgsToEncrypt.map(_=>BigInt("0x"+randomBytes(16).toString("hex")).toString());
        
        // const proof = await Proofs.testAuditableProof.prove({
        //     ...this.tree.createProof(2),

        //     messagesAsPoint: msgsAsPoints.map(point=>[point.x,point.y]),
        //     encryptToPubkey: [encryptToPK.x, encryptToPK.y],
        //     encryptWithNonce: nonces
        // });
        

        // Reconstruct the encryptions into the correct object format (perhaps should be separate function but it is  specific to this use case)
        // let encryptedMsgs = [];
        // for (var i = 0; i < msgsToEncrypt.length * 4; i+=4) {
        //     encryptedMsgs.push({ encrypted : {
        //         c1 : {x: proof.publicSignals[i+0], y: proof.publicSignals[i+1]},
        //         c2 : {x: proof.publicSignals[i+2], y: proof.publicSignals[i+3]}
        //     }})
        // }
        // let decryptedMsgs = await this.auditLayer.decryptFromAuditLayer(encryptedMsgs);
        // expect(msgsToEncrypt).to.deep.equal(decryptedMsgs);
    });
    it("Groth16 Malleability", async function () {
        const msgsToEncrypt = ["12345678987654321"];
        const { encryption, proof } = await encryptAndProve(msgsToEncrypt);
        // console.log(proof);
        const vKey = JSON.parse(readFileSync(`./node_modules/zk-escrow/zk/daEncrypt_verification_key.json`));
        const result = await snarkjs.groth16.verify(vKey, proof.publicSignals, proof.proof);
        console.log("result", await Proofs.daEncrypt.verify(proof));
    });
    

});