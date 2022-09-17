const { poseidonContract } = require("circomlibjs");
const { Contract } = require("ethers");
const { task, types } = require("hardhat/config");

task("deploy:MerkleTree", "Deploy the MerkleTree contract to local hardhat node")
  .addOptionalParam("logs", "Print the logs", true, types.boolean)
  .setAction(async ({ logs }, { ethers }) => {
    // const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    // const privateKey = process.env.PRIVATE_KEY;
    // const wallet = new ethers.Wallet(privateKey, provider);

    const [signer] = await ethers.getSigners();

    const poseidonT3ABI = poseidonContract.generateABI(2);
    const poseidonT3Bytecode = poseidonContract.createCode(2);

    const PoseidonLibT3Factory = new ethers.ContractFactory(
      poseidonT3ABI,
      poseidonT3Bytecode,
      // wallet
      signer
    );
    const poseidonT3Lib = await PoseidonLibT3Factory.deploy();

    await poseidonT3Lib.deployed();

    logs &&
      console.log(`PoseidonT3 library has been deployed to: ${poseidonT3Lib.address}`);

    const IncrementalBinaryTreeLibFactory = await ethers.getContractFactory(
      "IncrementalBinaryTree",
      {
        // signer: wallet,
        signer: signer,
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
      // signer: wallet,
      signer: signer,
      libraries: {
        IncrementalBinaryTree: incrementalBinaryTreeLib.address,
        PoseidonT3: poseidonT3Lib.address,
      },
    });

    // const merkleTreeContract = await ContractFactory.deploy(wallet.address);
    const merkleTreeContract = await ContractFactory.deploy(signer.address);

    await merkleTreeContract.deployed();

    logs &&
      console.log(
        `MerkleTree contract has been deployed to: ${merkleTreeContract.address}`
      );

    // Simple test 1
    // const leaf = ethers.BigNumber.from(
    //   "136105276540294020436052206300466854914237731297649945605086317200254030834"
    // );
    // await merkleTreeContract.insertLeaf(1);
    // await merkleTreeContract.insertLeaf(leaf);
    // await merkleTreeContract.insertLeaf(leaf);
    // const leaves = await merkleTreeContract.getLeaves();
    // console.log(leaves);
    const tree = await merkleTreeContract.tree();
    console.log(tree.root);

    return merkleTreeContract;
  });
