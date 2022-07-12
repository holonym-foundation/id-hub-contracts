const { initialize } = require("zokrates-js");
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 8080;

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
                globals.artifacts = zokratesProvider.compile(source);//, options);
                // Setup
                globals.provingKey = fs.readFileSync(args.provingKeyPath);
            })
        }
    })
}

// Takes arguments to main function, then generates witness + proof, and returns proof
function generateProof(args) {
    const { witness, output } = globals.zokratesProvider.computeWitness(globals.artifacts, args);
    const proof = globals.zokratesProvider.generateProof(globals.artifacts.program, witness, globals.provingKey);
    return proof;
}

app.get("/prove/:args", (req, res) => {
    res.send(generateProof(JSON.parse(req.params.args)))
})

app.listen(port, () => {
    init();
    console.log(`Listening: Port ${port}`);
})