const { randomBytes } = require("ethers/lib/utils");
const { Auditor, Lit, Encryption, Utils } = require("threshold-eg-babyjub");

class AuditLayerSimulator {
    constructor() {
        this.auditor = new Auditor(randomBytes(32));
        this.lit = new Lit(randomBytes(32));
        this.initialized = false;
        this.init();

    }
    async init() {
        this.auditorKeygenForLit = await this.auditor.keygen();
        this.litKeygenForAuditor = await this.lit.keygen();
        this.auditorPubkey = await this.auditor.pubkey(this.litKeygenForAuditor);
        this.litPubkey = await this.lit.pubkey(this.auditorKeygenForLit);
        this.encryption = new Encryption(this.litPubkey, this.auditorPubkey);
        this.initalized = true;
    }

    async pubkey() {
        if(!this.initialized) await this.init();
        return this.encryption.toPubkey;
    }
    
    async encryptToAuditLayer(msg) {
        if(!this.initialized) await this.init();
        return await this.encryption.encrypt(msg);
    }

    async decryptFromAuditLayer(encryptedMessages) {
        if(!this.initialized) await this.init();

        let decrypted = [];

        for (const encrypted of encryptedMessages) {
            const litPartialDecryption = await this.lit.partialDecrypt(this.auditorKeygenForLit, encrypted.encrypted.c1);
            const fullDecryption = await this.auditor.decrypt(this.litKeygenForAuditor, encrypted.encrypted, litPartialDecryption);
            decrypted.push(fullDecryption);
        }

        return decrypted;
    }

}
module.exports = { AuditLayerSimulator }