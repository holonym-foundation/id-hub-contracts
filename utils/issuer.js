const util = require("util");
const exec = util.promisify(require("child_process").exec);
// Issues credentials with address, secret, timestamp, scope=0, and two custom fields representing anything issuer wants
class TestIssuer {
    constructor(privateKey){
        this.privateKey = privateKey
    }

    async issue(field1, field2) {
        const {stdout, stderr} = await exec(`HOLONYM_ISSUER_PRIVKEY=${this.privateKey} ../rust-ecc/binaries/${process.env.RUST_COMPILATION_TARGET_ARCHICTECTURE || "aarch64-apple-darwin"}/issuer --field1 ${field1} --field2 ${field2}`);
        if(stderr) throw `Error: ${stderr}`
        // Beyond me why JSON.parse needs to wrap JSON.parse (why??)
        return JSON.parse(JSON.parse(stdout));
    }

    static formatFr(frString) { return frString.replace("Fr(","").replace(")","") }
    static frToBigInt(frString) { return BigInt(this.formatFr(frString)) };

    // Takes `response.credentials` as input where `response` is the response of `this.issue()`
    static formatCreds(creds) { 
        const c = {
            addr: this.frToBigInt(creds.address),
            secret: this.frToBigInt(creds.secret),
            customFields: [
                this.frToBigInt(creds.custom_fields[0]), 
                this.frToBigInt(creds.custom_fields[1])
            ],
            iat: this.frToBigInt(creds.iat),
            scope: this.frToBigInt(creds.scope)
        }
        return c
    }

}

module.exports = {
    Issuer : TestIssuer
}
// Destructive:
// const formatCreds = (creds) => Object.keys(creds).map(key=>{console.log(creds[key], "abcbbbcbbcbcbcds"); creds[key]=formatFr(creds[key])});


// const { poseidon } = require("circomlibjs-old");
// const { buildEddsa, buildBabyjub } = require("circomlibjs");
// const { BigNumber } = require("ethers");
// const { randomBytes } = require("ethers/lib/utils");
// const { getCurrentDateAsInt, U8ArrToBigInt, U8ArrToBigIntBE, U8ArrToBigIntLE } = require("./casts");
// const { makeLeafMaker } = require("./leaves");
// const createBlakeHash = require("blake-hash");
// const { Scalar } = require("ffjavascript");

// class Signer {
//     constructor(privKey, eddsa, babyJubJub, leafMaker) {
//         this.privKey = privKey;
//         this.eddsa = eddsa;
//         this.bjj = babyJubJub;
//         this.leafMaker = leafMaker
//     }
//     signLeaf(leaf) {
//         console.log("signing leaf", leaf, Buffer.from(leaf.toString(16), "hex"));
//         return this.customSignPoseidon(this.privKey, Buffer.from(leaf.toString(16), "hex"));
//     }
//     // Takes an array of two custom fields, returns the leaf (issuer address, secret, customFields, scope)
//     createLeaf(customFields) {
//         const addr = this.getAddress();
//         const secret = BigNumber.from(randomBytes(64)).mod(this.bjj.subOrder);
//         const iat = getCurrentDateAsInt();
//         const scope = 0; // Lol we're not even using scope anymore :..(
//         return this.leafMaker.createLeaf(addr, secret, iat, customFields, scope);
//     }

//     // Takes an array of two custom fields, returns the leaf (issuer address, secret, customFields, scope)
//     // along with a signature of the leaf
//     createAndSignLeaf(customFields) {
//         const leaf = this.createLeaf(customFields);
//         const signature = this.signLeaf(leaf.digest);
//         return {leaf: leaf, signature: signature};
//     }
//     getAddress() {
//         const [x, y] = this.getPubkey();
//         // Arbitrary address scheme, meant to be circuit-friendly
//         const address = poseidon([x,y].map(value=>this.bjj.F.toObject(value)));
//         // console.log("getAddress: \npubkey", [x,y], "\naddress", address);
//         return address;
//     }
//     getPubkey() {
//         return this.eddsa.prv2pub(this.privKey);
//     }

//     // signature using old Circom poseidon Because new circom poseidon doesn't work with circom circuits
//     // Most of this is copied from circomlibjs signPoseidon
//     customSignPoseidon(prv, msg) {
//         const F = this.eddsa.babyJub.F;
//         const sBuff = this.eddsa.pruneBuffer(createBlakeHash("blake512").update(Buffer.from(prv)).digest());
//         const s = Scalar.fromRprLE(sBuff, 0, 32);
//         const A = this.eddsa.babyJub.mulPointEscalar(this.eddsa.babyJub.Base8, Scalar.shr(s, 3));

//         const composeBuff = new Uint8Array(32 + msg.length);
//         composeBuff.set(sBuff.slice(32), 0);
//         F.toRprLE(composeBuff, 32, msg);
//         const rBuff = createBlakeHash("blake512").update(Buffer.from(composeBuff)).digest();
//         let r = Scalar.mod(Scalar.fromRprLE(rBuff, 0, 64), this.eddsa.babyJub.subOrder);
//         const R8 = this.eddsa.babyJub.mulPointEscalar(this.eddsa.babyJub.Base8, r);

//         // console.log([R8[0], R8[1], A[0], A[1], msg])
//         const hm = poseidon([R8[0], R8[1], A[0], A[1], msg].map(x=>U8ArrToBigIntBE(x)));

//         console.log("public")
//         // console.log("hm should be", hm);
//         // console.log("Pubkey * message ", Scalar.mul(8, this.getPubkey()));
//         // console.log("pubkey * 8 * message", Scalar.add(this.getPubkey));
//         // console.log("pubkey * 8 * message + g*nonce", Scalar.add(this.getPubkey));
        
//         // Commented this:
//         // const hms = Scalar.e(this.eddsa.babyJub.F.toObject(hm));
//         const S = Scalar.mod(
//             Scalar.add(
//                 r,
//                 Scalar.mul(hm, s)
//             ),
//             this.eddsa.babyJub.subOrder
//         );
//         console.log("base8", this.bjj.Base8.map(x=>[x, U8ArrToBigIntBE(x), U8ArrToBigIntLE(x)]))
//         console.log("left should be ", Scalar.mul(F.toObject(this.bjj.Base8), S))
//         console.log("private key * message + nonce", S);
//         // console.log("public key * messsage + public nonce", 
//         //     Scalar.mod(
//         //         Scalar.add(
//         //             R8, 
//         //             Scalar.mul(hms, 8)
//         //         ),
//         //         this.eddsa.babyJub.subOrder
//         //     )
//         // )
//         console.log("(private key * message + nonce) * base point", this.bjj.mulPointEscalar(this.bjj.Base8, S).map(x=>[U8ArrToBigIntBE(x), U8ArrToBigIntLE(x)]));
//         return {
//             R8: R8,
//             S: S
//         };
//     }
// }

// // privateKeySeed: randomness. Reccomended 512-bit to be extra safe. Circom will create a private from a 512-bit output hash of it mod order of the prime subgroup.
// async function makeSigner (privKey) {
//     let bjj = await buildBabyjub(); 
//     let eddsa = await buildEddsa();
//     console.log("mt", bjj.Base8, bjj.F.fromMontgomery(bjj.Base8));
//     return;
//     // let poseidon = await buildPoseidon();
//     let leafMaker = await makeLeafMaker();
//     return new Signer(privKey, eddsa, bjj, leafMaker);
// }
  
// module.exports = {
//     makeSigner : makeSigner
// }