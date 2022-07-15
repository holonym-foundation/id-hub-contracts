const { initialize } = require("zokrates-js");
const express = require("express");
const fs = require("fs");
const path = require("path");
const { assert } = require("console");
const { randomBytes } = require("crypto");

const app = express();
const port = 8081;

// Initialize global variables
var globals = {}
const init = (args = {
    mainPath : "./v0.zok",
    provingKeyPath : "./v0.proving.key",
    }) => 
{
    fs.readFile(args.mainPath, (err, data) => {
        if(err) {
            console.error(`Error: could not find file at path ${args.mainPath}`);
        } else {
            let source = data.toString();
            // Initialize ZoKrates:
            initialize().then((zokratesProvider) => {
                globals.zokratesProvider = zokratesProvider;
                // Compilation
                globals.main = zokratesProvider.compile(source);//, options);
                // Setup
                globals.provingKey = fs.readFileSync(args.provingKeyPath);

                // Also, compilation of hash
                globals.assertLeafFromAddress = zokratesProvider.compile(`
                import "hashes/blake2/blake2s" as leafHash;

                // asserts that a leaf's preimage begins with a certain address
                def main(u32[8] leaf, u32[5] address, private u32[7] creds, private u32[4] nullifier) {
                    u32[1][16] preimage = [[...address, ...creds, ...nullifier]];
                    assert(leafHash(preimage) == leaf);
                    return;
                }
                                
                `);
                globals.assertLeafFromAddressKey = fs.readFileSync("./assertLeafFromAddress.proving.key");

                globals.leafgen = zokratesProvider.compile(`
                import "hashes/blake2/blake2s" as leafHash;
                def main(u32[5] address, u32[7] creds, u32[4] nullifier) -> u32[8] {
                    u32[1][16] preimage = [[...address, ...creds, ...nullifier]];
                    return leafHash(preimage);
                }
                `)
            })
        }
    })
}

// Takes arguments to main function, then generates witness + proof, and returns proof
function generateProof(args) {
    const { witness, output } = globals.zokratesProvider.computeWitness(globals.mainCompiled, args);
    console.log(output)
    const proof = globals.zokratesProvider.generateProof(globals.mainCompiled.program, witness, globals.provingKey);
    return proof;
}

function leafFromData(address, creds, nullifier) {
    assert(address.length == 20, "address must be 20 bytes");
    assert(nullifier.length == 16, "nullifier must be 16 bytes");
    // Pad creds to 28 bytes
    const paddedCreds = Buffer.concat([creds], 28)
    console.log([address, paddedCreds, nullifier].map(x=>toU32StringArray(x)))
    const { witness, output } = globals.zokratesProvider.computeWitness(
        globals.leafgen, 
        [address, paddedCreds, nullifier].map(x=>toU32StringArray(x))
    );
    return output;
}


app.get("/createLeaf/:address/:creds/:nullifier/", (req, res) => {
    const {address, creds, nullifier} = req.params;
    console.log(address, creds, nullifier, Buffer.from(address.replace("0x",""), "hex"))
    lfd = leafFromData(
        Buffer.from(address.replace("0x",""), "hex"), 
        Buffer.from(creds), 
        Buffer.from(nullifier.replace("0x",""), "hex")
    )
    console.log(1, lfd)
    res.send(
        lfd
    );
})



function toU32StringArray(bytes) {
    let u32s = chunk(bytes.toString("hex"), 8)
    return u32s.map(x=>parseInt(x, 16).toString())
}
function chunk(arr, chunkSize) {
    let out = []
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize);
        out.push(chunk)
    }
    return out
}
app.listen(port, () => {
    init();
    console.log(`Listening: Port ${port}`);
})

// [ '3364047903', '3473798754', '1070123245', '621169217', '1222218632' ]