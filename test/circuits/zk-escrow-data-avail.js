const { groth16 } = require("snarkjs");
// const { encryptAndProve } = require("../../utils/packages/zk-escrow/lib/main");
const { readFileSync } = require("fs");
const { encryptAndProve } = require("zk-escrow");
const { Proofs } = require("../../utils/proofs");
const { ethers } = require("hardhat");
// const { expect } = require("chai");
// const { Proofs } = require("../../utils/proofs");
// const { Utils } = require("threshold-eg-babyjub");
// // const { Tree } = require("holo-merkle-utils");
// const { AuditLayerSimulator } = require("../../utils/threshold");
// const { randomBytes } = require("crypto");
// const { rejects } = require("assert");


describe.only("DataAvail contract", function (){
    before(async function (){
        this.da = await (await ethers.getContractFactory("DataAvail")).deploy();
    });
    it("Should be able to encrypt and decrypt", async function () {
        const msgsToEncrypt = ["12345678987654321"];
        const [provableEncryption, commitmentData] = await encryptAndProve("1234", ["99999999999999999999999999999987654321"]);
        // const { encryption, proof } = 
        // let p = provableEncryption.proof
        // // console.log(p.proof.pi_a, p.proof.pi_b, p.proof.pi_c)
        // console.log(...[p.proof.pi_a, p.proof.pi_b, p.proof.pi_c].map(arr=>[arr[0], arr[1]]), p.publicSignals)
        // // console.log([p.proof.pi_a[0], p.proof.pi_a[1]], p.proof.pi_b, [p.proof.pi_c[0], p.proof.pi_c[1]]);
        // await this.da.storeData(...[p.proof.pi_a, p.proof.pi_b, p.proof.pi_c].map(arr=>[arr[0], arr[1]]), p.publicSignals);
        // await this.da.storeData([p.proof.pi_a[0], p.proof.pi_a[1]], [p.proof.pi_b[0],p.proof.pi_b[1]], [p.proof.pi_c[0], p.proof.pi_c[1]], p.publicSignals);
        const calldata = await groth16.exportSolidityCallData(provableEncryption.proof.proof, provableEncryption.proof.publicSignals);
        await this.da.storeData(...JSON.parse(`[${calldata}]`));
    });
});