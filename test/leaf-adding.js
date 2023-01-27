const { expect } = require("chai");
const { randomBytes } = require("crypto");
const { makeLeafMaker } = require("../utils/leaves");
const { Proofs } = require("../utils/proofs");
const { Issuer } = require("../utils/issuer");

describe.only("Leaf Insertion", function (){
    before(async function (){
        this.leafMaker = await makeLeafMaker();
        const PRIVATE_KEY = randomBytes(32).toString("hex");
        this.issuer = new Issuer(PRIVATE_KEY);
        
    })

    describe("Issuer, JS, and constraints agree on leaves and signature implementation", function (){
        it("issuer and js agree on leaf generation", async function () {
            const res = await this.issuer.issue("6996", "69696969");
            const creds = Issuer.formatCreds(res.credentials);
            const leaf = Issuer.frToBigInt(res.leaf)
            expect(leaf).to.equal(this.leafMaker.createLeaf(creds).digest);
        });
        it("issuer, js, and circuit agree on signature generation", async function () {
            const customFields = ["123456769", "987654321"]
            const res = await this.issuer.issue(...customFields);
            const creds = Issuer.formatCreds(res.credentials);
            const leaf_ = this.leafMaker.createLeaf(creds); //returns not only leaf but also the metadata: creds, preimage, and leaf (digest)
            const leaves = this.leafMaker.swapAndCreateSecret(leaf_);
            const circuitInputs = {
                pubKeyX: Issuer.frToBigInt(res.pubkey[0]),
                pubKeyY: Issuer.frToBigInt(res.pubkey[1]),
                R8x: Issuer.frToBigInt(res.signature.r_b8[0]),
                R8y: Issuer.frToBigInt(res.signature.r_b8[1]),
                S: Issuer.frToBigInt(res.signature.s),
                signedLeaf: leaves.originalLeaf.digest, //originalLeaf.digest,
                newLeaf: leaves.newLeaf.digest, 
                signedLeafSecret: leaves.originalLeaf.inputs.secret,
                newLeafSecret: leaves.newLeaf.inputs.secret,
                iat : creds.iat,
                customFields: customFields.map(cf=>BigInt(cf)),
                scope : creds.scope,
            }
            let proof = await Proofs.onAddLeaf.prove(circuitInputs);
            // Really anything here to make sure it didn't throw an error on proof generation:
            let result = await Proofs.onAddLeaf.verify(proof);
            expect(result).to.equal(true);               
        });
    });
});