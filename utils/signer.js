const { poseidon } = require("circomlibjs-old");
const { buildEddsa, buildBabyjub } = require("circomlibjs");
const { BigNumber } = require("ethers");
const { randomBytes } = require("ethers/lib/utils");
const { getCurrentDateAsInt, U8ArrToBigInt } = require("./casts");
const { makeLeafMaker } = require("./leaves");

let eddsa; 
let bjj; 

class Signer {
    constructor(privKey, eddsa, babyJubJub, leafMaker) {
        this.privKey = privKey;
        this.eddsa = eddsa;
        this.bjj = babyJubJub;
        this.leafMaker = leafMaker
    }
    signLeaf(leaf) {
        return this.eddsa.signPoseidon(this.privKey, leaf);
    }
    // Takes an array of two custom fields, returns the leaf (issuer address, secret, customFields, scope)
    createLeaf(customFields) {
        const addr = this.getAddress();
        const secret = BigNumber.from(randomBytes(64)).mod(this.bjj.subOrder);
        const iat = getCurrentDateAsInt();
        const scope = 0; // Lol we're not even using scope anymore :..(
        return this.leafMaker.createLeaf(addr, secret, iat, customFields, scope);
    }

    // Takes an array of two custom fields, returns the leaf (issuer address, secret, customFields, scope)
    // along with a signature of the leaf
    createAndSignLeaf(customFields) {
        const leaf = this.createLeaf(customFields);
        const signature = this.signLeaf(leaf.digest);
        return {leaf: leaf, signature: signature};
    }
    getAddress() {
        const [x, y] = this.getPubkey();
        // Arbitrary address scheme, meant to be circuit-friendly
        const address = poseidon([x,y].map(value=>U8ArrToBigInt(value)));
        // console.log("getAddress: \npubkey", [x,y], "\naddress", address);
        return address;
    }
    getPubkey() {
        return this.eddsa.prv2pub(this.privKey);
    }
}

// privateKeySeed: randomness. Reccomended 512-bit to be extra safe. Circom will create a private from a 512-bit output hash of it mod order of the prime subgroup.
async function makeSigner (privKey) {
    let bjj = await buildBabyjub(); 
    let eddsa = await buildEddsa();
    // let poseidon = await buildPoseidon();
    let leafMaker = await makeLeafMaker();
    return new Signer(privKey, eddsa, bjj, leafMaker);
}
  
module.exports = {
    makeSigner : makeSigner
}