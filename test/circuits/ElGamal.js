const { expect } = require("chai");
const { Proofs } = require("../../utils/proofs");

describe("BabyJubJub ElGamal encryption", function (){
    before(async function (){
        this.correctEncryption = {
            msg : [ BigInt("0x1f41270b21a6236fe77038c2ae95dfba5dc18b0075ce0d8774c05682da30b605") , BigInt("0x2516e6ad11d596c1231dce1bee1c9e6763a95c5d57944478b4dabc3a8ad56a5c")],
            pubkey : [ BigInt("0x1e6a69b9fb7be79b85794b11ff715e247a1f5ef9fa2c76e5ca49cde15a81cf0a") , BigInt("0x19a6ce18d4b36b0432145bddd6036c9e9d22e5d739574354f0a49f6fb0d71f3a")],
            nonce : "5663551644058347898281564846252027736505834319117390341737102018327201955912",

            encrypted : { 
                c1: [ BigInt("0x02241578affa5dab3ed66baa231700c318814b94b0b53a05515e313b8bce5502") , BigInt("0x18553ffd7dbb30c6888abf4c445ecbcfa02c75bbbec13899ed5e6e532bf8b5b4")], 
                c2: [ BigInt("0x2361afa095012030358032df19f327f896776609b9ba47ecc5185d5f4a5aba90") , BigInt("0x0ff31eca78fcc1d42dc299518dbc9a457ca200bcf405a00609165706fd60a680")] 
            }
        }
    });
    describe("Encryption", function (){
        it("correct values", async function () {
            const proof = await Proofs.testEGEncryption.prove({
                messageAsPoint: this.correctEncryption.msg,
                h: this.correctEncryption.pubkey,
                y: this.correctEncryption.nonce
            });

            const result = await Proofs.testEGEncryption.verify(proof);
            expect(result).to.equal(true);       

            // Make sure the result has the correct encrypted point:
            let encrypted = { 
                c1 : [proof.publicSignals[0], proof.publicSignals[1]],
                c2: [proof.publicSignals[2], proof.publicSignals[3]],
            }
            expect(encrypted).to.deep.equal(this.correctEncryption.encrypted);
        });
        
    });

});