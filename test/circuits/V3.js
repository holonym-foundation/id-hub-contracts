const { expect } = require("chai");
const { randomBytes } = require("crypto");
const { issue, get_pubkey } = require("holonym-wasm-issuer");
const { createProofVOLEZK } = require("../../utils/proofs");
const  { poseidon } = require("circomlibjs-old");
const { prove, verify } = require("wasm-vole-zk-adapter")
// const { makeLeafMaker } = require("../../utils/leaves");
// const { Issuer } = require("../../utils/issuer");
// const { rejects } = require("assert");

const year = 31536002n;
const month = 2592000n;
const secureExpiryOffset = () => year - BigInt("0x"+randomBytes(32).toString("hex")) % month;

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
            iat :  this.issued.credentials.iat,
            expiry: (BigInt(this.issued.credentials.iat) + secureExpiryOffset()).toString(), // should be a random slightly less than 31536000n seconds (how much less determines anonymity set size)
            scope : this.issued.credentials.scope,
            customFields : this.issued.credentials.custom_fields,
            actionId : "12321232123212321234567890987654321",
            recipient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
        }
        // console.log("inputs", JSON.stringify(circuitInputs));
        const proof = await createProofVOLEZK("V3SybilResistance", circuitInputs);
        
        let res = await fetch("http://localhost:3000/verify/0x0a/V3PhoneSybilResistance", {
        // let res = await fetch("https://verifier.holonym.io/verify/0x7a69/V3SybilResistance", {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: proof
        });
        console.log('res.text', await res.text());
        expect((await res.text()).startsWith(`{"values":{"circuit_id":"`)).to.be.true;
    });
   
    it("Expiry > 1 year since issuance fails", async function () {
        const circuitInputs = {
            pubKeyX : this.issued.pubkey.x,
            pubKeyY : this.issued.pubkey.y,
            R8x : this.issued.signature_r8.x,
            R8y : this.issued.signature_r8.y,
            S: this.issued.signature_s,
            nullifierSecretKey: this.secret,
            iat :  this.issued.credentials.iat,
            expiry: BigInt(this.issued.credentials.iat) + year+1n,
            scope : this.issued.credentials.scope,
            customFields : this.issued.credentials.custom_fields,
            actionId : "12321232123212321234567890987654321"
        }
        
        await expect(createProofVOLEZK("V3SybilResistance", circuitInputs)).to.be.rejected;
    });

    it("Expiry offset range", async function () {
        for(let i=0; i<10000; i++) {
           expect(secureExpiryOffset()).to.be.within(year-month, year);
        }
    });
});