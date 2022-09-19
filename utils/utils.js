const { poseidonContract } = require("circomlibjs");
const abiPoseidon = poseidonContract.generateABI(5);
const bytecodePoseidon = poseidonContract.createCode(5);
const { ethers } = require("hardhat");

exports.deployPoseidon = async () => {
    const [account] = await ethers.getSigners();
    const PoseidonContractFactory = new ethers.ContractFactory(
        abiPoseidon,
        bytecodePoseidon,
        account
    );
    return await PoseidonContractFactory.deploy();
}

