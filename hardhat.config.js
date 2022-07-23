require("@nomicfoundation/hardhat-toolbox");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.9",

  abiExporter: {
  path: './data/abi',
  runOnCompile: true,
  clear: true,
  flat: true,
  only: [],
  spacing: 2,
  pretty: true,
},

  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      from : "0xC8834C1FcF0Df6623Fc8C8eD25064A4148D99388", // Send transactions from this address by default
      accounts : [
        {privateKey: process.env.PRIVATE_KEY, balance: "2110000000000000000000000"},
        {privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', balance: "10000000000000000000000"},
        {privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', balance: "15100000000000000000000"},
        
      ], // Private key for the above address
      forking: {
        url: "https://xdai-archive.blockscout.com/", 
        blockNumber: 21908151
      }
    },
    mumbai: {
      url: "https://speedy-nodes-nyc.moralis.io/a1167200f0a0e81dd757304e/polygon/mumbai",
      accounts: [process.env.PRIVATE_KEY],
      gas: 2100000,
      gasPrice: 2000000000
    },
    harmony: {
      url: "https://api.s0.b.hmny.io",
      accounts: [process.env.PRIVATE_KEY],
    },
    arbitrum: {
      url: "https://rinkeby.arbitrum.io/rpc",
      accounts: [process.env.PRIVATE_KEY],
      gas: 2100000,
      gasPrice: 2000000000
    },
    avalanche: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: [process.env.PRIVATE_KEY],
    },
    ethereum: {
      url: "https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      accounts: [process.env.PRIVATE_KEY],
      gas: 2100000,
      gasPrice: 2000000000
    },
    fantom: {
      url: "https://rpc.testnet.fantom.network",
      accounts: [process.env.PRIVATE_KEY],
    },
    gnosis: {
      // url: "https://rpc.gnosischain.com",
      url: "https://poa-xdai.gateway.pokt.network/v1/lb/60b13899d3279c22da2a444d",
      accounts: [process.env.PRIVATE_KEY],
      // gas: 10000000000,
      gasPrice: 1500000000
    },
    arbitrumOne : {   
      url: "https://arb1.arbitrum.io/rpc",
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
