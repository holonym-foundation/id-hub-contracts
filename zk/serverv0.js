// NOTE : include address to prevent frontrunning attax
const { initialize } = require("zokrates-js");
const express = require("express");
const fs = require("fs");
const path = require("path");
const { assert } = require("console");
// const { exec } = require("child_process");
const util = require("util");
const exec = util.promisify(require("child_process").exec); // wrapper for exec that allows async/await for its completion (https://stackoverflow.com/questions/30763496/how-to-promisify-nodes-child-process-exec-and-child-process-execfile-functions)
const { randomBytes } = require("crypto");

const importHash = `import "hashes/blake2/blake2s" as leafHash;`; // import "hashes/sha256/sha256" as leafHash;

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
                // IS IT SAFE TO DO SHA256 UNPADDED ON 512 BIT INPUT
                globals.alfa = zokratesProvider.compile(`
                ${importHash}
                // Assert Leaf From Address (ALFA)
                // asserts that a leaf's preimage begins with a certain address
                def main(u32[8] leaf, u32[5] address, private u32[7] creds, private u32[4] nullifier) {
                    u32[1][16] preimage = [[...address, ...creds, ...nullifier]];
                    assert(leafHash(preimage) == leaf);
                    return;
                }
                                
                `);
                globals.alfaKey = fs.readFileSync("./alfa.proving.key");

                globals.alcc = zokratesProvider.compile(`
                ${importHash}
                // Assert Leaf Contains Credential (ALCC)
                // asserts that a leaf's preimage begins with a certain address. Takes unused input msgSender to prevent frontrunning
                def main(u32[8] leaf, u32[5] address, u32[7] creds, u32[5] msgSender, private u32[4] nullifier) {
                    u32[1][16] preimage = [[...address, ...creds, ...nullifier]];
                    assert(leafHash(preimage) == leaf);
                    return;
                }
               
                `);
                globals.alccKey = fs.readFileSync("./alcc.proving.key");

                globals.leafgen = zokratesProvider.compile(`
                ${importHash}
                def main(u32[5] address, private u32[7] creds, private u32[4] nullifier) -> u32[8] {
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

function alfa(leaf, address, creds, nullifier) {
    assert(leaf.length == 32, `leaf must be 32 bytes but is ${address.length} bytes`);
    assert(address.length == 20, `address must be 20 bytes but is ${address.length} bytes`);
    assert(nullifier.length == 16, `nullifier must be 16 bytes but is ${nullifier.length} bytes `);
    // Pad creds to 28 bytes
    const paddedCreds = Buffer.concat([creds], 28);
    console.log("shit", leaf, address, paddedCreds, nullifier);
    const { witness, output } = globals.zokratesProvider.computeWitness(
        globals.alfa, 
        [leaf, address, paddedCreds, nullifier].map(x=>toU32StringArray(x))
    );
    console.log("Calculating proof...");
    let time_ = Date.now();
    const proof = globals.zokratesProvider.generateProof(globals.alfa.program, witness, globals.alfaKey);
    console.log("Proof", proof, Date.now()-time_)
    return proof;
}

function leafFromData(address, creds, nullifier) {
    assert(address.length == 20, `address must be 20 bytes but is ${address.length} bytes`);
    assert(nullifier.length == 16, `nullifier must be 16 bytes but is ${nullifier.length} bytes `);
    // Pad creds to 28 bytes
    const paddedCreds = Buffer.concat([creds], 28)
    console.log([address, paddedCreds, nullifier].map(x=>toU32StringArray(x)))
    const { witness, output } = globals.zokratesProvider.computeWitness(
        globals.leafgen, 
        [address, paddedCreds, nullifier].map(x=>toU32StringArray(x))
    );

    // console.log(
    //     "aijcnlska", 
    //     JSON.parse(output).map(x=>parseInt(x)),
    //     toU32StringArray(Buffer.concat([address, paddedCreds, nullifier])).map(x=>parseInt(x)),
    //     )
    console.log("abc", argsToU32CLIArgs([address, paddedCreds, nullifier]))
    
        
    return output;
}


app.get("/alfa/:leaf/:address/:creds/:nullifier/", async (req, res) => {
    const {leaf, address, creds, nullifier} = req.params;
    // const proof = alfa(
    //     Buffer.from(leaf.replace("0x", ""), "hex"),
    //     Buffer.from(address.replace("0x",""), "hex"), 
    //     Buffer.from(creds), 
    //     Buffer.from(nullifier.replace("0x",""), "hex")
    // );
    const proof = await alfaCLI(
        Buffer.from(leaf.replace("0x", ""), "hex"),
        Buffer.from(address.replace("0x",""), "hex"), 
        Buffer.from(creds), 
        Buffer.from(nullifier.replace("0x",""), "hex")
    );
    res.send(
        JSON.stringify(proof)
    );
})

app.get("/alcc/:leaf/:address/:creds/:msgSender/:nullifier/", async (req, res) => {
    const {leaf, address, creds, msgSender, nullifier} = req.params;
    // const proof = alcc(
    //     Buffer.from(leaf.replace("0x", ""), "hex"),
    //     Buffer.from(address.replace("0x",""), "hex"), 
    //     Buffer.from(creds), 
    //     Buffer.from(nullifier.replace("0x",""), "hex")
    // );
    const proof = await alccCLI(
        Buffer.from(leaf.replace("0x", ""), "hex"),
        Buffer.from(address.replace("0x",""), "hex"), 
        Buffer.from(creds), 
        Buffer.from(msgSender.replace("0x", ""), "hex"),
        Buffer.from(nullifier.replace("0x",""), "hex")
    );
    res.send(
        JSON.stringify(proof)
    );
})

app.get("/createLeaf/:address/:creds/:nullifier/", (req, res) => {
    const {address, creds, nullifier} = req.params;
    console.log(address, creds, nullifier, Buffer.from(address.replace("0x",""), "hex"))
    lfd = leafFromData(
        Buffer.from(address.replace("0x",""), "hex"), 
        Buffer.from(creds), 
        Buffer.from(nullifier.replace("0x",""), "hex")
    )
    res.send(
        lfd
    );
})


function toU32Array(bytes) {
    let u32s = chunk(bytes.toString('hex'), 8)
    return u32s.map(x=>parseInt(x, 16))
}

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

// Expects arguments of type bytes and returns an array of U32s -- all inputs concatenated/flattened, then split up into u32s 
// This is how ZoKrates CLI expects arguments
function argsToU32CLIArgs (args) {
    return toU32Array(Buffer.concat(args)).map(x=>parseInt(x)).join(" ")
}

// alfa sped up via CLI/compiled instead of js/interpereted 
async function alfaCLI(leaf, address, creds, nullifier) {
    assert(leaf.length == 32, `leaf must be 32 bytes but is ${address.length} bytes`);
    assert(address.length == 20, `address must be 20 bytes but is ${address.length} bytes`);
    assert(nullifier.length == 16, `nullifier must be 16 bytes but is ${nullifier.length} bytes `);
    // Pad creds to 28 bytes
    const paddedCreds = Buffer.concat([creds], 28)

    const tmpValue = randomBytes(16).toString("hex");
    const inFile = "alfa.out"
    const tmpWitnessFile = tmpValue + ".alfa.witness"
    const tmpProofFile = tmpValue + ".alfa.proof.json"
    // Execute the command
    try {
        const {stdout, stderr} = await exec(`zokrates compute-witness -i ${inFile} -o ${tmpWitnessFile} -a ${argsToU32CLIArgs([leaf, address, paddedCreds, nullifier])}; zokrates generate-proof -i ${inFile} -w ${tmpWitnessFile} -j ${tmpProofFile} -p alfa.proving.key; rm ${tmpWitnessFile}`);
        console.log("STDs", stdout, stderr);
    } catch(e) {
        console.error(e);
    }
    // Read the proof file, then delete it, then return it
    const retval = JSON.parse(fs.readFileSync(tmpProofFile));
    console.log("1269", retval);
    exec(`rm ${tmpProofFile}`);
    return retval
}

async function alccCLI(leaf, address, creds, msgSender, nullifier) {
    assert(leaf.length == 32, `leaf must be 32 bytes but is ${address.length} bytes`);
    assert(address.length == 20, `address must be 20 bytes but is ${address.length} bytes`);
    assert(msgSender.length == 20, `address must be 20 bytes but is ${address.length} bytes`);
    assert(nullifier.length == 16, `nullifier must be 16 bytes but is ${nullifier.length} bytes `);
    // Pad creds to 28 bytes
    const paddedCreds = Buffer.concat([creds], 28)

    const tmpValue = randomBytes(16).toString("hex");
    const inFile = "alcc.out"
    const tmpWitnessFile = tmpValue + ".alcc.witness"
    const tmpProofFile = tmpValue + ".alcc.proof.json"
    // Execute the command
    try {
        const {stdout, stderr} = await exec(`zokrates compute-witness -i ${inFile} -o ${tmpWitnessFile} -a ${argsToU32CLIArgs([leaf, address, paddedCreds, msgSender, nullifier])}; zokrates generate-proof -i ${inFile} -w ${tmpWitnessFile} -j ${tmpProofFile} -p alcc.proving.key; rm ${tmpWitnessFile}`);
        console.log("STDs", stdout, stderr);
    } catch(e) {
        console.error(e);
    }
    // Read the proof file, then delete it, then return it
    const retval = JSON.parse(fs.readFileSync(tmpProofFile));
    console.log("1269", retval);
    exec(`rm ${tmpProofFile}`);
    return retval
}


app.listen(port, () => {
    init();
    console.log(`Listening: Port ${port}`);
})

// [ '3364047903', '3473798754', '1070123245', '621169217', '1222218632' ]