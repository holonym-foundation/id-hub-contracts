const { initialize } = require("zokrates-js");
const express = require("express");
const fs = require("fs");
const path = require("path");

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

app.get("/prove/:args", (req, res) => {
    res.send(generateProof(JSON.parse(req.params.args)))
})

app.get("/hash/:args", (req, res) => {
    res.send(hash(JSON.parse(req.params.args)))
})

app.listen(port, () => {
    init();
    console.log(`Listening: Port ${port}`);
})