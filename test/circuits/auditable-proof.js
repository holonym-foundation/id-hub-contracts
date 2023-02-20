const { expect } = require("chai");
const { Proofs } = require("../../utils/proofs");
const { Utils } = require("threshold-eg-babyjub");
const { Tree } = require("holo-merkle-utils");
const { AuditLayerSimulator } = require("../../utils/threshold");
const { randomBytes } = require("crypto");
describe.only("Auditable Proof Base Circuit", function (){
    before(async function (){
        this.tree = Tree(14, ["12345", "999999", "1234567890987654321234567890987654321"]);
        this.auditLayer = new AuditLayerSimulator();
        await this.auditLayer.init();
    });
    it("Outputs proper encryption", async function () {
        const encryptToPK = await this.auditLayer.pubkey();
        const msgsToEncrypt = ["12341234123412341234123412341234123412341234123412341234123412341234123412", "5555555"];
        const msgsAsPoints = await Promise.all(msgsToEncrypt.map(msg=>Utils.msgToPoint(msg)));
        // const encryptedMsgs = await Promise.all(msgsToEncrypt.map(msg=>this.auditLayer.encryptToAuditLayer(msg)));
        // NOTE: this is probably not a safe way to generate nonces; please generate a random element in the prime subgroup
        const nonces = msgsToEncrypt.map(_=>BigInt("0x"+randomBytes(16).toString("hex")).toString());
        // console.log("nonces", nonces)
        // console.log("abc", msgsAsPoints.map(point=>[point.x,point.y]))
        const proof = Proofs.testAuditableProof.prove({
            ...this.tree.createProof(2),

            messagesAsPoint: msgsAsPoints.map(point=>[point.x,point.y]),
            encryptToPubkey: [encryptToPK.x, encryptToPK.y],
            encryptWithNonce: nonces
        })
    });
    it("Merkle proof is constrained", async function () {
        // Note: the Merkle Proof circuit already has unit tests; here we must just check that circuit is actually being used/constrained
        
    });
    

});