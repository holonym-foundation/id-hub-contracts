const { buildEddsa, buildBabyjub } = require("circomlibjs");
const { randomBytes } = require("ethers/lib/utils");

let eddsa; 
let bjj; 
TEST_EDDSA_PRIVATE_KEY = randomBytes(64);

async function init() { 
    bjj = await buildBabyjub(); 
    eddsa = await buildEddsa();
}

init().then(function() {
    let message = Buffer.from("123456789.123456789.123456789.12"); //Must be 32 bytes
    let sig = eddsa.signPoseidon(TEST_EDDSA_PRIVATE_KEY, message);
    console.log("sig is ", sig);

});