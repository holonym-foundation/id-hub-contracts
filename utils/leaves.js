const { poseidon } = require("circomlibjs-old");
const assert = require("assert");
const { buildPoseidon, buildBabyjub } = require("circomlibjs");
const { randomBytes } = require("crypto");
const { BigNumber } = require("ethers");

const primeFieldOrder = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

class LeafMaker {
    constructor(babyJubJub) {
        // this.poseidon = poseidon;
        this.bjj =  babyJubJub;
    }

    // addr: address of issuer
    // secret: some secret pepper added to the preimage
    // iat: time issued at, as int (see Holonym's getDateAsInt util function)
    // customFields: two custom fields that can be supplied, e.g., birthday, phoneNumber, reputation, whatever issuer desires to put as a custom field. These can be hashes of other fields!
    createLeaf(addr, secret, iat, customFields, scope) {
        assert(customFields.length === 2);
        const inputs = {
            addr:addr,
            secret:secret,
            iat:iat,
            customFields:customFields,
            scope:scope
        }
        const preimage = [addr, secret, customFields[0], customFields[1], iat, scope];
        
        return {
            inputs : inputs,
            preimage : preimage,
            digest: poseidon(preimage)
        }
    
    }

    // Swaps the secret in a preimage, returning the old leaf with the old secret and the new leaf with the new secret
    swapSecret(originalLeaf, newSecret) {
        let newInputs = { ...originalLeaf.inputs, secret: newSecret }
        return {
            originalLeaf : originalLeaf,
            newLeaf : this.createLeaf(newInputs.addr, newInputs.secret, newInputs.iat, newInputs.customFields, newInputs.scope)
        }
    }

    // Swaps the secret in a preimage, returning the old leaf with the old secret and the new leaf with the new secret
    swapAndCreateSecret(originalLeaf) {
        const newSecret = BigNumber.from(randomBytes(64)).mod(primeFieldOrder);
        return this.swapSecret(originalLeaf, newSecret);        
    }
}


module.exports = {
    makeLeafMaker : async () => new LeafMaker(await buildBabyjub())
}