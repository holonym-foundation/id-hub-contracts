require("@nomicfoundation/hardhat-toolbox");
// require("@nomicfoundation/hardhat-verify");
require("hardhat-abi-exporter");
require("dotenv").config();
require("./tasks/deployMerkleTree");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});
const COMRPOMISED_TEST_PRIVATE_KEY = "0x8ebd807b1973800dcf0eea7f299166c574d9d777e3b3df0804dcafae9286c68b";

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  // solidity: "0.8.9",
  solidity: {
    compilers: [
      {
        version: "0.8.21",
      },
      {
        version: "0.8.9",
      },
      {
        version: "0.8.4",
      },
      {
        version: "0.6.11",
      },
    ],
  },

  sourcify: {
    enabled: true,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  
  abiExporter: {
    path: "./data/abi",
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
      from: "0x51fEb8C526F40825953912d572f6b64B4897D073", // Send transactions from this address by default
      accounts: [
        { privateKey: process.env.TEST_PRIVATE_KEY, balance: "2110000000000000000000000" },
        {
          privateKey:
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
          balance: "10000000000000000000000",
        },
        {
          privateKey:
            "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
          balance: "15100000000000000000000",
        },
        // Compromised test private key: DO NOT USE IN PRODUCTION. Also don't use any of the above in production but this one is especially bad.
        {
          privateKey: COMRPOMISED_TEST_PRIVATE_KEY,
          balance: "15100000000000000000000",
        },


      ],
      // forking: {
      //   url: "https://xdai-archive.blockscout.com/",
      //   blockNumber: 21908151,
      // },
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_MUMBAI_APIKEY}`,
      accounts: [process.env.TEST_PRIVATE_KEY],
      // gas: 2100000,
      // gasPrice: 2000000000,
    },
    polygonMainnet: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_POLYGONMAINNET_APIKEY}`,
      accounts: [process.env.TEST_PRIVATE_KEY]
    },
    zkSyncTest: {
      url: "https://zksync2-testnet.zksync.dev",
      accounts: [process.env.TEST_PRIVATE_KEY]
    },
    zkSync: {
      url: "https://zksync2-testnet.zksync.dev",
      accounts: [process.env.TEST_PRIVATE_KEY]
    },
    mantle: {
      url: "https://rpc.ankr.com/mantle_testnet",
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    bscTest: {
      url: "https://data-seed-prebsc-1-s3.binance.org:8545",
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    bnbSmartChain: {
      url: "https://bsc-dataseed.binance.org/",
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    harmony: {
      url: "https://api.s0.b.hmny.io",
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    arbitrum: {
      url: "https://rinkeby.arbitrum.io/rpc",
      accounts: [process.env.TEST_PRIVATE_KEY],
      gas: 2100000,
      gasPrice: 2000000000,
    },
    optimismGoerli: {
      url: `https://opt-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_OPTIMISMGOERLI_APIKEY}`,
      accounts: [process.env.TEST_PRIVATE_KEY],

    },
    avalanche: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    ethereum: {
      url: "https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      accounts: [process.env.TEST_PRIVATE_KEY],
      gas: 2100000,
      gasPrice: 2000000000,
    },
    fantom: {
      url: "https://rpc.testnet.fantom.network",
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    gnosis: {
      // url: "https://rpc.gnosischain.com",
      url: "https://poa-xdai.gateway.pokt.network/v1/lb/60b13899d3279c22da2a444d",
      accounts: [process.env.TEST_PRIVATE_KEY],
      // gas: 10000000000,
      gasPrice: 1500000000,
    },
    arbitrumOne: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: [process.env.TEST_PRIVATE_KEY],
    },
    optimismMainnet: {
      url: "https://rpc.ankr.com/optimism",
      accounts: [process.env.TEST_PRIVATE_KEY], //[process.env.TEST_PRIVATE_KEY],
      forking: {
        url: "https://mainnet.chainnodes.org/9643f26d-a67d-400a-ae95-9646a6fc881d",
        blockNumber: 106887390,
      },
    },
    linea: {
      url: "https://rpc.linea.build",
      accounts: [process.env.TEST_PRIVATE_KEY],
    }
  },
};
