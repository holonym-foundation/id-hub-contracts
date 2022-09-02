const { poseidonContract } = require("circomlibjs");
const { Contract } = require("ethers");
const { task, types } = require("hardhat/config");

task("deploy:MerkleTree", "Deploy the MerkleTree contract to local hardhat node")
  .addOptionalParam("logs", "Print the logs", true, types.boolean)
  .setAction(async ({ logs }, { ethers }) => {
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    const privateKey = process.env.PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey, provider);

    const poseidonT3ABI = poseidonContract.generateABI(2);
    const poseidonT3Bytecode = poseidonContract.createCode(2);

    const PoseidonLibT3Factory = new ethers.ContractFactory(
      poseidonT3ABI,
      poseidonT3Bytecode,
      wallet
    );
    const poseidonT3Lib = await PoseidonLibT3Factory.deploy();

    await poseidonT3Lib.deployed();

    logs &&
      console.log(`PoseidonT3 library has been deployed to: ${poseidonT3Lib.address}`);

    const IncrementalBinaryTreeLibFactory = await ethers.getContractFactory(
      "IncrementalBinaryTree",
      {
        signer: wallet,
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
      signer: wallet,
      libraries: {
        IncrementalBinaryTree: incrementalBinaryTreeLib.address,
      },
    });

    const merkleTreeContract = await ContractFactory.deploy(wallet.address);

    await merkleTreeContract.deployed();

    logs &&
      console.log(
        `MerkleTree contract has been deployed to: ${merkleTreeContract.address}`
      );

    // For tests
    // await merkleTreeContract.insertLeaf(1);
    // const leaves = await merkleTreeContract.getLeaves();
    // console.log(leaves);

    return merkleTreeContract;
  });
