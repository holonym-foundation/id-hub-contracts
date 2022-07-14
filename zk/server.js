const { initialize } = require("zokrates-js");
const express = require("express");
const fs = require("fs");
const path = require("path");
const { assert } = require("console");

const app = express();
const port = 8081;

// Initialize global variables
var globals = {}
const init = (args = {
    mainPath : "./deleteThis.zok",
    provingKeyPath : "./proving.key"
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
                globals.mainCompiled = zokratesProvider.compile(source);//, options);
                // Setup
                globals.provingKey = fs.readFileSync(args.provingKeyPath);

                // Also, compilation of hash
                globals.hashCompiled = zokratesProvider.compile(`
                import "hashes/pedersen/512bit" as hash;
                def main(u32[16] preimage) -> u32[8] {
                    return hash(preimage);
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

function hash(args) {
    const { witness, output } = globals.zokratesProvider.computeWitness(globals.hashCompiled, args);
    return output
}

// NOTE : assumes leaves are already hashed, does not take raw leaves as input. This is because leaves may be hashed with a different algorithm
function createMerkleTree(leaves) {
    console.log(leaves)
    let depth = 3;
    let tree = [[...leaves]];
    let currentLevel;
    let prevLevel = tree[tree.length-1];
    while(depth > 0){
        assert(prevLevel.length % 2 == 0, `Invalid number of leaves ${leaves.length}, should be 2^n`);
        tree.push([]);
        currentLevel = tree[tree.length-1];
        prevLevel = tree[tree.length-2];
        console.log(depth, prevLevel.length, currentLevel.length)
        for(i = 0; i < prevLevel.length; i+=2){
            currentLevel.push(JSON.parse(hash([[...prevLevel[i], ...prevLevel[i+1]]])))
            console.log(currentLevel.length)
        }
        depth--;
    }
    return tree;
}

app.get("/prove/:args", (req, res) => {
    res.send(generateProof(JSON.parse(req.params.args)))
})

app.get("/hash/:args", (req, res) => {
    res.send(hash(JSON.parse(req.params.args)))
})

app.get("/createMerkleTree/:args", (req, res) => {
    // res.send(createMerkleTree(JSON.parse(req.params.args)))
    res.send(
        createMerkleTree(
        [["0xacb1b088", "0x259a3bd7", "0x28a95362", "0x61c8e035", "0x78654b9d", "0x5a7ba174", "0x302dd94b", "0x3feb81e1"],
        ["0xacb1b088", "0x259a3bd7", "0x28a95362", "0x61c8e035", "0x78654b9d", "0x5a7ba174", "0x302dd94b", "0x3feb81e1"],
        ["0xacb1b088", "0x259a3bd7", "0x28a95362", "0x61c8e035", "0x78654b9d", "0x5a7ba174", "0x302dd94b", "0x3feb81e1"],
        ["0xacb1b088", "0x259a3bd7", "0x28a95362", "0x61c8e035", "0x78654b9d", "0x5a7ba174", "0x302dd94b", "0x3feb81e1"],
        ["0xacb1b088", "0x259a3bd7", "0x28a95362", "0x61c8e035", "0x78654b9d", "0x5a7ba174", "0x302dd94b", "0x3feb81e1"],
        ["0xacb1b088", "0x259a3bd7", "0x28a95362", "0x61c8e035", "0x78654b9d", "0x5a7ba174", "0x302dd94b", "0x3feb81e1"],
        ["0xacb1b088", "0x259a3bd7", "0x28a95362", "0x61c8e035", "0x78654b9d", "0x5a7ba174", "0x302dd94b", "0x3feb81e1"],
        ["0xacb1b088", "0x259a3bd7", "0x28a95362", "0x61c8e035", "0x78654b9d", "0x5a7ba174", "0x302dd94b", "0x3feb81e1"]]
    )
    )
})

app.listen(port, () => {
    init();
    console.log(`Listening: Port ${port}`);
})