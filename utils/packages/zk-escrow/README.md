# Installation
`npm i zk-escrow`
# Usage
Example code:
```
const { encryptParams, encryptAndProve } = require('zk-escrow')
const run = async () => {
    /* This will give the proof of correct encryption, along with a "tag" that can be used to access the encrypted value by an authorized party.
    This example has access control logic from the smart contract '0xabc1234567890', i.e. the contract at address 0xabc1234567890 has a hasAccess(address addr, Tag t) method. This method returns whether a certain address has access to the encrypted data with tag t.
    The data encrypted here is the number 55555555. 
    */
    let proofAndTag = await encryptAndProve('0xabc1234567890', ['55555555'])
    console.log('here is the encrypted data. it is not yet stored, but is encrypted to the MPC network', encryptionProof);


    // If you want to create a custom circuit that handles encryption, you can fork daEncrypt.circom and use these as inputs:
    let inputsToProof = encryptParams('0xabc1234567890', ['55555555']);
}
run()
```
# Building
1. cd into this directory with README.md
2. `npm run build`
