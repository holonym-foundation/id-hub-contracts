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
var globals = {};
const init = () => 
{
    // Initialize ZoKrates:
    initialize().then((zokratesProvider) => {
        globals.zokratesProvider = zokratesProvider;

        globals.leafgen = zokratesProvider.compile(`${fs.readFileSync("createLeaf.zok")}`);

       
        globals.addLeafBig = zokratesProvider.compile(`${fs.readFileSync("./onAddCredentialBig.zok")}`);
        globals.addLeafBigKey = fs.readFileSync("./alb.proving.key");

        globals.alcc = zokratesProvider.compile(`${fs.readFileSync("./onAddCredentialBig.zok")}`);
        globals.alccKey = fs.readFileSync("./alb.proving.key");


    })
}

function leafFromData(address, creds, secret) {
    assert(address.length == 20, `address must be 20 bytes but is ${address.length} bytes`);
    assert(secret.length == 16, `secret must be 16 bytes but is ${secret.length} bytes `);
    // Pad creds to 28 bytes
    const paddedCreds = Buffer.concat([creds], 28)

    const { witness, output } = globals.zokratesProvider.computeWitness(
        globals.leafgen, 
        [address, paddedCreds, secret].map(x=>toU32StringArray(x))
    );
    return output;
}

app.get("/createLeaf/:address/:creds/:secret/", (req, res) => {
    const {address, creds, secret} = req.params;
    console.log(address, creds, secret, Buffer.from(address.replace("0x",""), "hex"))
    lfd = leafFromData(
        Buffer.from(address.replace("0x",""), "hex"), 
        Buffer.from(creds), 
        Buffer.from(secret.replace("0x",""), "hex")
    )
    res.send(
        lfd
    );
})


app.get("/onAddCredentialSmall/:leaf/:address/:creds/:secret/:newSecret", async (req, res) => {
    const {leaf, address, creds, secret, newSecret} = req.params;
    const proof = await addLeafSmallCLI(
        Buffer.from(leaf.replace("0x", ""), "hex"),
        Buffer.from(address.replace("0x",""), "hex"), 
        Buffer.from(creds), 
        Buffer.from(secret.replace("0x",""), "hex"),
        Buffer.from(newSecret.replace("0x",""), "hex")
    );
    res.send(
        JSON.stringify(proof)
    );
})


// Expects arguments of type bytes and returns an array of U32s -- all inputs concatenated/flattened, then split up into u32s 
// This is how ZoKrates CLI expects arguments
function argsToU32CLIArgs (args) {
    return toU32Array(Buffer.concat(args)).map(x=>parseInt(x)).join(" ")
}

// sped up via CLI/compiled instead of js/interpereted 
async function addLeafSmallCLI(signedLeaf, address, creds, secret, newSecret) {
    assert(signedLeaf.length == 32, `signedLeaf must be 32 bytes but is ${address.length} bytes`);
    // assert(newLeaf.length == 32, `newLeaf must be 32 bytes but is ${address.length} bytes`);
    assert(address.length == 20, `address must be 20 bytes but is ${address.length} bytes`);
    assert(secret.length == 16, `secret must be 16 bytes but is ${secret.length} bytes `);
    const lfd = JSON.parse(leafFromData(address, creds, newSecret));
    const newLeaf = Buffer.from(
                        lfd.join("").replaceAll("0x",""),
                        "hex");
    assert(newLeaf.length == 32, `signedLeaf must be 32 bytes but is ${newLeaf.length} bytes`);

    // Pad creds to 28 bytes
    const paddedCreds = Buffer.concat([creds], 28);
    
    // Create a temporary name for current tasks to be deleted once CLI execution is done:
    const tmpValue = randomBytes(16).toString("hex");
    const inFile = "als.out";
    const tmpWitnessFile = tmpValue + ".als.witness";
    const tmpProofFile = tmpValue + ".als.proof.json";

    // Execute the command
    try {
        const {stdout, stderr} = await exec(`zokrates compute-witness -i ${inFile} -o ${tmpWitnessFile} -a ${argsToU32CLIArgs([signedLeaf, newLeaf, address, paddedCreds, secret, newSecret])}; zokrates generate-proof -i ${inFile} -w ${tmpWitnessFile} -j ${tmpProofFile} -p als.proving.key; rm ${tmpWitnessFile}`);
    } catch(e) {
        console.error(e);
    }

    // Read the proof file, then delete it, then return it
    const retval = JSON.parse(fs.readFileSync(tmpProofFile));
    exec(`rm ${tmpProofFile}`);
    return retval
}


app.listen(port, () => {
    init();
    console.log(`Listening: Port ${port}`);
});
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

// Takes arguments to main function, then generates witness + proof, and returns proof
// function generateProof(args) {
//     const { witness, output } = globals.zokratesProvider.computeWitness(globals.mainCompiled, args);
//     console.log(output)
//     const proof = globals.zokratesProvider.generateProof(globals.mainCompiled.program, witness, globals.provingKey);
//     return proof;
// }

// function alfa(leaf, address, creds, secret) {
//     assert(leaf.length == 32, `leaf must be 32 bytes but is ${address.length} bytes`);
//     assert(address.length == 20, `address must be 20 bytes but is ${address.length} bytes`);
//     assert(secret.length == 16, `secret must be 16 bytes but is ${secret.length} bytes `);
//     // Pad creds to 28 bytes
//     const paddedCreds = Buffer.concat([creds], 28);
//     const { witness, output } = globals.zokratesProvider.computeWitness(
//         globals.alfa, 
//         [leaf, address, paddedCreds, secret].map(x=>toU32StringArray(x))
//     );
//     console.log("Calculating proof...");
//     let time_ = Date.now();
//     const proof = globals.zokratesProvider.generateProof(globals.alfa.program, witness, globals.alfaKey);
//     console.log("Proof", proof, Date.now()-time_)
//     return proof;
// }

// // alfa sped up via CLI/compiled instead of js/interpereted 
// async function alfaCLI(leaf, address, creds, secret) {
//     assert(leaf.length == 32, `leaf must be 32 bytes but is ${address.length} bytes`);
//     assert(address.length == 20, `address must be 20 bytes but is ${address.length} bytes`);
//     assert(secret.length == 16, `secret must be 16 bytes but is ${secret.length} bytes `);
//     // Pad creds to 28 bytes
//     const paddedCreds = Buffer.concat([creds], 28)

//     const tmpValue = randomBytes(16).toString("hex");
//     const inFile = "alfa.out"
//     const tmpWitnessFile = tmpValue + ".alfa.witness"
//     const tmpProofFile = tmpValue + ".alfa.proof.json"
//     // Execute the command
//     try {
//         const {stdout, stderr} = await exec(`zokrates compute-witness -i ${inFile} -o ${tmpWitnessFile} -a ${argsToU32CLIArgs([leaf, address, paddedCreds, secret])}; zokrates generate-proof -i ${inFile} -w ${tmpWitnessFile} -j ${tmpProofFile} -p alfa.proving.key; rm ${tmpWitnessFile}`);
//         console.log("STDs", stdout, stderr);
//     } catch(e) {
//         console.error(e);
//     }
//     // Read the proof file, then delete it, then return it
//     const retval = JSON.parse(fs.readFileSync(tmpProofFile));
//     exec(`rm ${tmpProofFile}`);
//     return retval
// }

// app.get("/alcc/:leaf/:address/:creds/:msgSender/:secret/", async (req, res) => {
//     const {leaf, address, creds, msgSender, secret} = req.params;
//     const proof = await alccCLI(
//         Buffer.from(leaf.replace("0x", ""), "hex"),
//         Buffer.from(address.replace("0x",""), "hex"), 
//         Buffer.from(creds), 
//         Buffer.from(msgSender.replace("0x", ""), "hex"),
//         Buffer.from(secret.replace("0x",""), "hex")
//     );
//     res.send(
//         JSON.stringify(proof)
//     );
// })

// async function alccCLI(leaf, address, creds, msgSender, secret) {
//     assert(leaf.length == 32, `leaf must be 32 bytes but is ${address.length} bytes`);
//     assert(address.length == 20, `address must be 20 bytes but is ${address.length} bytes`);
//     assert(msgSender.length == 20, `address must be 20 bytes but is ${address.length} bytes`);
//     assert(secret.length == 16, `secret must be 16 bytes but is ${secret.length} bytes `);
//     // Pad creds to 28 bytes
//     const paddedCreds = Buffer.concat([creds], 28)

//     const tmpValue = randomBytes(16).toString("hex");
//     const inFile = "alcc.out"
//     const tmpWitnessFile = tmpValue + ".alcc.witness"
//     const tmpProofFile = tmpValue + ".alcc.proof.json"
//     // Execute the command
//     try {
//         const {stdout, stderr} = await exec(`zokrates compute-witness -i ${inFile} -o ${tmpWitnessFile} -a ${argsToU32CLIArgs([leaf, address, paddedCreds, msgSender, secret])}; zokrates generate-proof -i ${inFile} -w ${tmpWitnessFile} -j ${tmpProofFile} -p alcc.proving.key; rm ${tmpWitnessFile}`);
//         console.log("STDs", stdout, stderr);
//     } catch(e) {
//         console.error(e);
//     }
//     // Read the proof file, then delete it, then return it
//     const retval = JSON.parse(fs.readFileSync(tmpProofFile));
//     exec(`rm ${tmpProofFile}`);
//     return retval
// }

// [ '3364047903', '3473798754', '1070123245', '621169217', '1222218632' ]