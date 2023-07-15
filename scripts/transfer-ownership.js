const { ethers, network } = require("hardhat");
const ethProvider = require('eth-provider');
const frame = ethProvider('frame');
// Frame.sh runs on port 1248:
// const frame = new ethers.providers.JsonRpcProvider( [ "http://127.0.0.1:1248"] );
const assert = require("assert");

const testing = true;

const ETH = 1000000000n;
const LEDGER_ADDR = "0xbe20d0a27b79ba2e53c9df150badaa21d4783d42";
const MINTER_ADDR = "0x457200042dfa5dd202897aFe9DBb5e26D4448Aea";
const SYBIL_ID_ADDR = "0xdD748977BAb5782625AF1466F4C5F02Eb92Fce31";
const SYBIL_PHONE_ADDR = "0xA40C8AAF7F47B18c1eDdBe7855b580f828eD9711";
const RESIDENCY_ADDR = "0x7497636F5E657e1E7Ea2e851cDc8649487dF3aab";
const NFT_ADDR = "0xaeb9b145fa1b6d1534f98f7f85815eb88845851d";

async function sendOptimismFromLedger(tx) {
    tx.from = LEDGER_ADDR;
    tx.chainId = "10";
    console.log("tx", tx);
    return await frame.request({
        method: 'eth_sendTransaction',
        params: [tx]
    });
}



async function main() {

    // const nftDeployer = (await ethers.getContractFactory("HolonymUniqueGovIDNFT")).getDeployTransaction();
    // console.log(await sendOptimismFromLedger(nftDeployer));

    const nft = await ethers.getContractAt("HolonymUniqueGovIDNFT", NFT_ADDR);
    console.log("owner", await nft.owner());
    console.log(await sendOptimismFromLedger(await nft.populateTransaction.transferOwnership(MINTER_ADDR)));
    console.log("owner", await nft.owner());

    // const contract = await ethers.getContractAt("IsUSResident", RESIDENCY_ADDR);
    // console.log("owner", await con.owner());

    


    // const uniqueness = await ethers.getContractAt("HolonymUniqueGovIDNFT", NFT_ADDR);
    // let transferOwnershipTx = await nft.populateTransaction.transferOwnership(MINTER_ADDR);
    // console.log(await sendOptimismFromLedger(transferOwnershipTx));
    
    // console.log("accounts", await frame.request({ method: 'eth_requestAccounts' }))

    // const [compromised] = await ethers.getSigners();
    // console.log("compromised", compromised);
    // Fund the ledger with some ETH on hardhat
    // await network.provider.send("hardhat_setBalance", [
    //     compromised.address,
    //     "1000",
    //   ]);
    
    // await compromised.sendTransaction({
    //     to: LEDGER_ADDR,
    //     value: ethers.utils.parseEther("0.005"), 
    //   })

    // console.log("abc", await frame.request(
    //     {
    //         method: 'wallet_addEthereumChain',
    //         params: [
    //           {
    //             chainId: '0x31337',
    //             chainName: 'hard Hat',
    //             rpcUrls: ['http://127.0.0.1:8545'],
    //             nativeCurrency: {  
    //                 name: 'Ethereum',
    //                 symbol: 'ETH',
    //                 decimals: 18,
    //             }
    //           },
    //         ],
    //       })
    // );

    // const contractDeployer = await (await ethers.getContractFactory("SybilGovID")).connect(compromised).getDeployTransaction(
    //     ethers.constants.AddressZero, [0], 0, ethers.constants.AddressZero
    // );
    // console.log(contractDeployer.chainId)
    // // Set to hardware wallet address
    // contractDeployer.from = LEDGER_ADDR;
    // // contractDeployer.chainId = "31337";
    // const deployed = await frame.request({ method: 'eth_sendTransaction', params: [contractDeployer] });
    // console.log("accounts", await frame.request({ method: 'eth_requestAccounts' }))

    // assert.equal(await contract.owner(), "0xC8834C1FcF0Df6623Fc8C8eD25064A4148D99388");
    // assert.equal(await contract.price(), 0n);

    // await contract.connect(compromised).transferOwnership(ledger.getAddress());
    // await contract.connect(ledger).setPrice(4n * eth);

    // assert.equal(await contract.owner(), "0x1669e8868b1355edAF002291BD30e2Ff6A7513E8");
    // assert.equal(await contract.price(), 4n * eth);
    
    
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  