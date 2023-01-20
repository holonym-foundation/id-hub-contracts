const assert = require("assert");
const { buildEddsa, buildBabyjub, buildPoseidon } = require("circomlibjs");
const { BigNumber } = require("ethers");
const { randomBytes } = require("ethers/lib/utils");
const { getCurrentDateAsInt } = require("./casts");

let eddsa; 
let bjj; 

class Signer {
    constructor(privKey, eddsa, poseidon, babyJubJub) {
        this.privKey = privKey;
        this.eddsa = eddsa;
        this.poseidon = poseidon;
        this.bjj = babyJubJub;
    }
    signLeaf(leaf) {
        return this.eddsa.signPoseidon(this.privKey, leaf);
    }
    // Takes an array of two custom fields, returns the leaf (issuer address, secret, customFields, scope)
    createLeaf(customFields) {
        assert(customFields.length === 2);
        const addr = this.getAddress();
        const secret = BigNumber.from(randomBytes(64)).mod(this.bjj.subOrder);
        const iat = getCurrentDateAsInt();
        const scope = 0; // Lol we're not even using scope anymore --- :(

        const preimage = [addr, secret, customFields[0], customFields[1], iat, scope];
        return {
            preimage : preimage,
            digest: this.poseidon(preimage)
        }

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
        const address = this.poseidon(x,y);
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
    let poseidon = await buildPoseidon();
    return new Signer(privKey, eddsa, poseidon, bjj);
}
  
makeSigner(randomBytes(64)).then(s=>console.log(s.createAndSignLeaf([0,0])));
module.exports = {
    makeSigner : makeSigner
}