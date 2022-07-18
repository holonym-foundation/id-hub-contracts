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

                globals.leafgenCompiled = zokratesProvider.compile(`
                // import "hashes/blake2/blake2s" as leafHash;
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

function hash(args) {
    const { witness, output } = globals.zokratesProvider.computeWitness(globals.hashCompiled, args);
    return output
}

function leafFromData(args) {
    const { witness, output } = globals.zokratesProvider.computeWitness(globals.leafgenCompiled, args);
    return output
}

// NOTE : assumes leaves are already hashed, does not take raw leaves as input. This is because leaves may be hashed with a different algorithm
function createMerkleTree(leaves, depth=3) {
    assert(leaves.length == 2 ** depth, `Invalid number of leaves ${leaves.length}, should be 2^depth`);
    let tree = [[...leaves]];
    let currentLevel;
    let prevLevel = tree[tree.length-1];
    while(depth > 0){
        assert(prevLevel.length % 2 == 0, `Invalid number of leaves ${leaves.length}, should be 2^n`);
        tree.push([]);
        currentLevel = tree[tree.length-1];
        prevLevel = tree[tree.length-2];
        for(i = 0; i < prevLevel.length; i+=2){
            currentLevel.push(JSON.parse(hash([[...prevLevel[i], ...prevLevel[i+1]]])))
        }
        depth--;
    }
    return tree;
}

function createLeaves(rawData, maxLeaves=256) {
    var leaves = [];
    for (const r of rawData) {
        assert(r.address.length == 20);
        assert(r.nullifier.length == 16);
        // Pad creds to 28 bytes
        const paddedCreds = Buffer.concat([r.creds], 28)
        // console.log([r.address, paddedCreds, r.nullifier].map(x=>toU32StringArray(x)))
        const leaf = leafFromData([r.address, paddedCreds, r.nullifier].map(x=>toU32StringArray(x)))
        // console.log(leaf)
        leaves.push(JSON.parse(leaf))
        // const preimage = Buffer.concat([r.address, paddedCreds, r.nullifier])
        // console.log(toU32StringArray(preimage))
        // leaves.push(leafHash(toU32StringArray(preimage)))
    }
    // fill leaves with blank
    const numEmptyLeaves = maxLeaves - leaves.length 
    const emptyLeaf = [
        "0x00000000",
        "0x00000000",
        "0x00000000",
        "0x00000000",
        "0x00000000",
        "0x00000000",
        "0x00000000",
        "0x00000000"
      ]
    const zeroLeaves = Array.from({ length : numEmptyLeaves }, ()=>emptyLeaf)
    return leaves.concat(zeroLeaves)
}

app.get("/prove/:args", (req, res) => {
    res.send(generateProof(JSON.parse(req.params.args)))
})

app.get("/hash/:args", (req, res) => {
    res.send(hash(JSON.parse(req.params.args)))
})

app.get("/createMerkleTree/:args", (req, res) => {
    const depth = 6;
    const leaves = createLeaves([
        {address: Buffer.from("C8834C1FcF0Df6623Fc8C8eD25064A4148D99388", "hex"), creds: Buffer.from("Nanak Nihal Khalsa"), nullifier: randomBytes(16)},
        {address: Buffer.from("C8834C1FcF0Df6623Fc8C8eD25064A4148D99388", "hex"), creds: Buffer.from("Nanak Nihal S. Khalsa"), nullifier: randomBytes(16)}
        
    ], 
    2**depth);
    console.log(leaves)
    
    // res.send(createMerkleTree(JSON.parse(req.params.args)))
    res.send(
        createMerkleTree(
        // [["0xacb1b088", "0x259a3bd7", "0x28a95362", "0x61c8e035", "0x78654b9d", "0x5a7ba174", "0x302dd94b", "0x3feb81e1"],
        // ["0xacb1b088", "0x259a3bd7", "0x28a95362", "0x61c8e035", "0x78654b9d", "0x5a7ba174", "0x302dd94b", "0x3feb81e1"],
        // ["0xacb1b088", "0x259a3bd7", "0x28a95362", "0x61c8e035", "0x78654b9d", "0x5a7ba174", "0x302dd94b", "0x3feb81e1"],
        // ["0xacb1b088", "0x259a3bd7", "0x28a95362", "0x61c8e035", "0x78654b9d", "0x5a7ba174", "0x302dd94b", "0x3feb81e1"],
        // ["0xacb1b088", "0x259a3bd7", "0x28a95362", "0x61c8e035", "0x78654b9d", "0x5a7ba174", "0x302dd94b", "0x3feb81e1"],
        // ["0xacb1b088", "0x259a3bd7", "0x28a95362", "0x61c8e035", "0x78654b9d", "0x5a7ba174", "0x302dd94b", "0x3feb81e1"],
        // ["0xacb1b088", "0x259a3bd7", "0x28a95362", "0x61c8e035", "0x78654b9d", "0x5a7ba174", "0x302dd94b", "0x3feb81e1"],
        // ["0xacb1b088", "0x259a3bd7", "0x28a95362", "0x61c8e035", "0x78654b9d", "0x5a7ba174", "0x302dd94b", "0x3feb81e1"]]
        leaves, depth
    )
    )
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
[ '3364047903', '3473798754', '1070123245', '621169217', '1222218632' ], 
[ '1239625718', '3654924101', '1553947053', '2469671160' ]