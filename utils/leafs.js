const assert = require("assert");
const { buildPoseidon } = require("circomlibjs");

let poseidon = null;

class LeafMaker {
    constructor(poseidon) {
        this.poseidon = poseidon;
    }

    // addr: address of issuer
    // secret: some secret pepper added to the preimage
    // iat: time issued at, as int (see Holonym's getDateAsInt util function)
    // customFields: two custom fields that can be supplied, e.g., birthday, phoneNumber, reputation, whatever issuer desires to put as a custom field. These can be hashes of other fields!
    createLeaf(addr, secret, iat, customFields, scope) {
        assert(customFields.length === 2);
        const preimage = [addr, secret, customFields[0], customFields[1], iat, scope];
        return {
            preimage : preimage,
            digest: this.poseidon(preimage)
        }
    
    }

    // Swaps the secret in a preimage, returning the old leaf with the old secret and the new leaf with the new secret
    swapSecret(originalLeaf, newSecret) {
        let preimage_ = [...originalLeaf.preimage]
        preimage_[1] = newSecret;
        return {
            original : originalLeaf,
            new : this.createLeaf(preimage_)
        }
    
    }
}


module.exports = {
    makeLeafMaker : async () => new LeafMaker(await buildPoseidon())
}