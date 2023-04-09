const snarkjs = require("snarkjs");
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
        this.da = (new ethers.getContractFactory("DataAvail")).deploy();
    });
    it("Should be able to encrypt and decrypt", async function () {
        const msgsToEncrypt = ["12345678987654321"];
        const { encryption, proof } = await encryptAndProve(msgsToEncrypt);
    });
});