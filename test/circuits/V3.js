const { expect } = require("chai");
const { randomBytes } = require("crypto");
const { issue, get_pubkey } = require("holonym-wasm-issuer");
const { createProofVOLEZK } = require("../../utils/proofs");
const  { poseidon } = require("circomlibjs-old");
// const { makeLeafMaker } = require("../../utils/leaves");
// const { Issuer } = require("../../utils/issuer");
// const { rejects } = require("assert");

describe.only("Example Proof E2E", function (){
    before(async function (){
        this.secret = "111111111111111111111112";
        // Nothing-up-my-sleeve value: SHA256("Holonym Issuance")
        this.issuanceNullifier = poseidon([
            BigInt(this.secret), 
            BigInt("0x194ee5653c27cb200f64d0bd1ade2b4734e3341ea37712c6a5a4bd30870c33f1")
        ]).toString();

        const privateKey = randomBytes(32).toString("hex");
        const issued = await issue(privateKey, this.issuanceNullifier, "1234567890", "1234567890");
        this.issued = JSON.parse(issued);
    })
    it("Example Proof that should succeed", async function () {

        const circuitInputs = {
            pubKeyX : this.issued.pubkey.x,
            pubKeyY : this.issued.pubkey.y,
            R8x : this.issued.signature_r8.x,
            R8y : this.issued.signature_r8.y,
            S: this.issued.signature_s,
            nullifierSecretKey: this.secret,
            // signedLeaf: leaves.originalLeaf.digest, //originalLeaf.digest,
            // newLeaf: leaves.newLeaf.digest, 
            // signedLeafSecret: leaves.originalLeaf.inputs.secret,
            // newLeafSecret: leaves.newLeaf.inputs.secret,
            iat :  this.issued.credentials.iat,
            scope : this.issued.credentials.scope,
            customFields : this.issued.credentials.custom_fields,
            actionId : "12321232123212321234567890987654321"
        }
        console.log("circuit inputs", circuitInputs)
        console.log("result is", await createProofVOLEZK("V3SybilResistance", circuitInputs));
        throw new Error("not yet implemented");
    });
    // Is this out of scope for these tests? I think so.
    it("Modifying it to fail", async function () {
        throw new Error("not yet implemented");
    });
});
// describe.only("Proof", function (){
//     before(async function (){
//         this.leafMaker = await makeLeafMaker();
//         const PRIVATE_KEY = randomBytes(32).toString("hex");
//         this.issuer = new Issuer(PRIVATE_KEY);
//     })

//     describe("Issuer, js, and circuit agree on leaves and signature implementation", function (){
//         it("issuer and js agree on leaf generation", async function () {
//             const res = await this.issuer.issue("6996", "69696969");
//             const creds = Issuer.formatCreds(res.credentials);
//             const leaf = Issuer.frToBigInt(res.leaf)
//             expect(leaf).to.equal(this.leafMaker.createLeaf(creds).digest);
//         });
//         it("Circuit accepts signature given by issuer signature generation", async function () {
//             const customFields = ["123456769", "987654321"]
//             const res = await this.issuer.issue(...customFields);
//             const creds = Issuer.formatCreds(res.credentials);
//             const leaf_ = this.leafMaker.createLeaf(creds); //returns not only leaf but also the metadata: creds, preimage, and leaf (digest)
//             const leaves = this.leafMaker.swapAndCreateSecret(leaf_);
//             const circuitInputs = {
//                 pubKeyX: Issuer.frToBigInt(res.pubkey[0]),
//                 pubKeyY: Issuer.frToBigInt(res.pubkey[1]),
//                 R8x: Issuer.frToBigInt(res.signature.r_b8[0]),
//                 R8y: Issuer.frToBigInt(res.signature.r_b8[1]),
//                 S: Issuer.frToBigInt(res.signature.s),
//                 signedLeaf: leaves.originalLeaf.digest, //originalLeaf.digest,
//                 newLeaf: leaves.newLeaf.digest, 
//                 signedLeafSecret: leaves.originalLeaf.inputs.secret,
//                 newLeafSecret: leaves.newLeaf.inputs.secret,
//                 iat : creds.iat,
//                 customFields: customFields.map(cf=>BigInt(cf)),
//                 scope : creds.scope,
//             }
//             let proof = await Proofs.onAddLeaf.prove(circuitInputs);
//             // Really anything here to make sure it didn't throw an error on proof generation:
//             let result = await Proofs.onAddLeaf.verify(proof);
//             expect(result).to.equal(true);               
//         });
//         it("Circuit doesn't accept when inputs are modified (i.e., all constraints are likely implemented, albeit not necessarily against edge cases)", async function () {
//             const customFields = ["123456769", "987654321"]
//             const res = await this.issuer.issue(...customFields);
//             const creds = Issuer.formatCreds(res.credentials);
//             const leaf_ = this.leafMaker.createLeaf(creds); //returns not only leaf but also the metadata: creds, preimage, and leaf (digest)
//             const leaves = this.leafMaker.swapAndCreateSecret(leaf_);

//             const circuitInputs = {
//                 pubKeyX: Issuer.frToBigInt(res.pubkey[0]),
//                 pubKeyY: Issuer.frToBigInt(res.pubkey[1]),
//                 R8x: Issuer.frToBigInt(res.signature.r_b8[0]),
//                 R8y: Issuer.frToBigInt(res.signature.r_b8[1]),
//                 S: Issuer.frToBigInt(res.signature.s),
//                 signedLeaf: leaves.originalLeaf.digest, //originalLeaf.digest,
//                 newLeaf: leaves.newLeaf.digest, 
//                 signedLeafSecret: leaves.originalLeaf.inputs.secret,
//                 newLeafSecret: leaves.newLeaf.inputs.secret,
//                 iat : creds.iat,
//                 customFields: customFields.map(cf=>BigInt(cf)),
//                 scope : creds.scope,
//             }
//             console.log("These *should* throw errors; I wish it wasn't verbose:")
//             for(const key of Object.keys(circuitInputs)) {
//                 badCircuitInputs = {...circuitInputs}
//                 badCircuitInputs[key] += 1n;
//                 // Make sure it's rejected
//                 await rejects(Proofs.onAddLeaf.prove(badCircuitInputs));
//                 // Really anything here to make sure it didn't throw an error on proof generation:
//                 // let result = await Proofs.onAddLeaf.verify(proof);
//                 // expect(result).to.equal(false);               
//             }
//             console.log("OK, done with ^^ errors that should have happened. Don't worry about them.")

//         });
//     });

    
// });