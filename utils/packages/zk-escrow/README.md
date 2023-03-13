# Installation
`npm i zk-escrow`
# Usage
Example code:
```
const { encryptParams, encryptAndProve } = require('zk-escrow')
const run = async () => {
    // This will give the encryption, and the proof of correct encryption. All of this is safe to be posted publicly.
    let encryptionProof = await encryptAndProve(['123'])
    console.log('here is the encrypted data. it is not yet stored, but is encrypted to the DA layer', encryptionProof)
    // If you want to create a custom circuit that handles encryption, you can fork daEncrypt.circom and use these as inputs:
    let inputsToProof = encryptParams(['12345678'])
}
run()
```
# Building
1. cd into this directory with README.md
2. `npm run build`
