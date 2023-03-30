const { encryptAndProve } = require("../lib/main");
const nrl = require("n-readlines");
const { writeFileSync } = require("fs");
// Returns an ordered list of signal names for serialization
async function buildSerialization() {
    // Find number of public signals:
    const proof = await encryptAndProve("69", ["1234567898765"]);
    const numSignals = proof.proof.publicSignals.length;
    
    // Find name of public signals:
    const reader = new nrl("./zk/daEncrypt.sym");
    let signalNames = [];
    let lineNum = 0;
    while (lineNum < numSignals) {
        signalNames.push(reader.next().toString("utf8").split(".")[1]);
        lineNum++;
    }    
    writeFileSync("./signalOrder.json", JSON.stringify(signalNames));

}
buildSerialization();