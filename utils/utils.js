const { poseidonContract } = require("circomlibjs");
const abiPoseidon = poseidonContract.generateABI(5);
const bytecodePoseidon = poseidonContract.createCode(5);
const { ethers } = require("hardhat");
const { readFileSync } = require("fs");
const util = require("util");
const { randomBytes } = require("crypto");
const exec = util.promisify(require("child_process").exec);

// All inputs should be in field format (i.e., an integer modulo the 254-bit prime)
const createLeaf = async (address, secret, countryCode, subdivision, completedAt, birthdate) => {
  const r = randomBytes(16).toString("hex"); // Random bytes in the tmp filename so it won't be overwritten by another process runnign in parallel
  const cliArgs = [address, secret, countryCode, subdivision, completedAt, birthdate].join(" ");
  await exec(`zokrates compute-witness -a ${cliArgs} -i zk/compiled/createLeaf.out -o zk/tmp/${r}.tmp.witness`);
  // Format output to just get witness:
  return readFileSync(`zk/tmp/${r}.tmp.witness`).toString().split("\n")[0].split(" ")[1];
}

// All inputs should be in field format (i.e., an integer modulo the 254-bit prime)
const createLeafAdditionProof = async (address, countryCode, subdivision, completedAt, birthdate, oldSecret, newSecret) => {
    const r = randomBytes(16).toString("hex"); // Random bytes in the tmp filename so it won't be overwritten by another process runnign in parallel
    const oldLeaf = await createLeaf(address, oldSecret, countryCode, subdivision, completedAt, birthdate);
    const newLeaf = await createLeaf(address, newSecret, countryCode, subdivision, completedAt, birthdate);
    const cliArgs = [oldLeaf, newLeaf, address, countryCode, subdivision, completedAt, birthdate, oldSecret, newSecret].join(" ");
    await exec(`zokrates compute-witness -a ${cliArgs} -i zk/compiled/onAddLeaf.out -o zk/tmp/${r}.tmp.witness`);
    await exec(`zokrates generate-proof -i zk/compiled/onAddLeaf.out -w zk/tmp/${r}.tmp.witness -p zk/pvkeys/onAddLeaf.proving.key -j zk/tmp/${r}.proof.json`);
    
    return JSON.parse(readFileSync(`zk/tmp/${r}.proof.json`));
}

const deployPoseidon = async () => {
    const [account] = await ethers.getSigners();
    const PoseidonContractFactory = new ethers.ContractFactory(
        abiPoseidon,
        bytecodePoseidon,
        account
    );
    return await PoseidonContractFactory.deploy();
}

// gets a Posiedon contract at address
const attachPoseidon = async (address) => {
    const [account] = await ethers.getSigners();
    const PoseidonContractFactory = new ethers.ContractFactory(
        abiPoseidon,
        bytecodePoseidon,
        account
    );
    return await PoseidonContractFactory.attach(address);
}
exports.createLeaf = createLeaf; 
exports.createLeafAdditionProof = createLeafAdditionProof; 
exports.attachPoseidon = attachPoseidon;
exports.deployPoseidon = deployPoseidon;