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
}) => {
    fs.readFile(args.mainPath, (err, data) => {
        if(err) {
            console.error("Error: could not find proveCredential.zok");
        } else {
            let source = data.toString();
            // Initialize ZoKrates:
            initialize().then((zokratesProvider) => {
                globals.zokratesProvider = zokratesProvider;
                // Compilation
                globals.artifacts = zokratesProvider.compile(source);//, options);
                // Setup
                // keypair = zokratesProvider.setup(globals.artifacts.program);
                globals.provingKey = fs.readFileSync(args.provingKeyPath);
                console.log(generateProof(["1"]))
            })
        }
    })
}

// const options = {
//     location: "./proveCredential.zok", // location of the root module
//     resolveCallback: (from, to) => {
//         console.error('a;lkfna;dklvma;sdlkvnmasd;lkcmas;dlkvmasd;lfams;dlf;lfksm')
//         const location = path.resolve(path.dirname(path.resolve(from)), to);
//         const source = fs.readFileSync(location).toString();
//         // return { source, location };
//         return {
//             source: "def main(): return", 
//             location: to
//         }
//       }
// };

// app.get('/', (req, res) => {
//     res.send('Hello World!')
//   })
  
//   app.listen(port, () => {
//     console.log(`Example app listening on port ${port}`)
//   })


function generateProof(args) {
    const { witness, output } = globals.zokratesProvider.computeWitness(globals.artifacts, args);
    const proof = globals.zokratesProvider.generateProof(globals.artifacts.program, witness, globals.provingKey);
    return proof;
}

init()

// setTimeout(()=>console.log(source, globals.artifacts, keypair), 1000)



// const args = [
//     [["1702447730","1633112425","1332300406","1498899546","1231958062","1702447722","1668109931","1668892982","1231831673","1647530614","1496463731","1446204013","1231648617","1498961515","1231712105","1513239926"],["1664248954","1231648617","1668105845","1514359094","1231834490","1395738931","1464300646","1433101107","1378907202","1500272200","1362250345","1313362228","1634495537","1433102412","1450012782","1664108116"],["1699109239","1296382330","1496405353","1279478380","1699234153","1332300152","1315591544","1299863857","1298814330","1231958144","0","0","0","0","0","1336"]],
//     ["255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","0","0","0","0"],
//     ["73","105","119","105","89","88","86","107","73","106","111","105","90","50","53","118","99","50","108","122","0","0","0","0"],
//     "48",
//     ["255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],
//     ["101","121","74","106","99","109","86","107","99","121","73","54","73","108","66","121","98","51","82","118","89","50","57","115","86","51","82","109","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],
//     "20",
//     ["255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255","255"],
//     ["76","67","74","108","101","72","65","105","79","105","73","120","78","106","85","120","77","122","89","49","77","106","85","122"],
//     "140"
// ]
    
// initialize().then((zokratesProvider) => {
//     // try {

//         // computation
//         const { witness, output } = zokratesProvider.computeWitness(globals.artifacts, args);

//         // generate proof
//         const proof = zokratesProvider.generateProof(globals.artifacts.program, witness, keypair.pk);

//         // export solidity verifier
//         // const verifier = zokratesProvider.exportSolidityVerifier(keypair.vk);
        
//         // or verify off-chain
//         // const isVerified = zokratesProvider.verify(keypair.vk, proof);

//         // console.log(isVerified)
//     // } catch(e) {
//     //     console.error(e)
//     //     return
//     // }
// });