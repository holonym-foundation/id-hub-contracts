const { poseidonContract } = require("circomlibjs");
const { Contract } = require("ethers");
const { task, types } = require("hardhat/config");

task("deploy:merkle-tree", "Deploy an example MerkleTree contract")
  .addOptionalParam("logs", "Print the logs", true, types.boolean)
  .setAction(async ({ logs }, { ethers }) => {
    const poseidonT3ABI = poseidonContract.generateABI(2);
    const poseidonT3Bytecode = poseidonContract.createCode(2);

    const [signer] = await ethers.getSigners();

    const PoseidonLibT3Factory = new ethers.ContractFactory(
      poseidonT3ABI,
      poseidonT3Bytecode,
      signer
    );
    const poseidonT3Lib = await PoseidonLibT3Factory.deploy();

    await poseidonT3Lib.deployed();

    logs &&
      console.log(`PoseidonT3 library has been deployed to: ${poseidonT3Lib.address}`);

    const IncrementalBinaryTreeLibFactory = await ethers.getContractFactory(
      "IncrementalBinaryTree",
      {
        libraries: {
          PoseidonT3: poseidonT3Lib.address,
        },
      }
    );
    const incrementalBinaryTreeLib = await IncrementalBinaryTreeLibFactory.deploy();

    await incrementalBinaryTreeLib.deployed();

    logs &&
      console.log(
        `IncrementalBinaryTree library has been deployed to: ${incrementalBinaryTreeLib.address}`
      );

    const ContractFactory = await ethers.getContractFactory("MerkleTree", {
      libraries: {
        IncrementalBinaryTree: incrementalBinaryTreeLib.address,
      },
    });

    const contract = await ContractFactory.deploy(
      "0x0000000000000000000000000000000000000000"
    );

    await contract.deployed();

    logs &&
      console.log(`MerkleTree contract has been deployed to: ${contract.address}`);

    return contract;
  });
