/**
 * Helpful for testing TypeScript<>noir integration.
 * 
 * Forked from this Aztec dapp tutorial: https://docs.aztec.network/tutorials/codealong/js_tutorials/aztecjs-getting-started
 */
import { getDeployedTestAccountsWallets } from '@aztec/accounts/testing';
import { createLogger, createPXEClient, waitForPXE } from '@aztec/aztec.js';

import { format } from 'util';
import { type Logger, type Wallet } from '@aztec/aztec.js';

import { CleanHandsSBTContract } from './contract-interfaces/CleanHandsSBT.js'

export async function deployCleanHandsSBTContract(adminWallet: Wallet, logger: Logger) {
  logger.info(`Deploying CleanHandsSBT contract...`);
  const contract = await CleanHandsSBTContract.deploy(adminWallet, adminWallet.getAddress())
    .send()
    .deployed();

  logger.info('L2 contract deployed');

  return contract;
}

async function main() {
  console.log('CleanHandsSBTContract', CleanHandsSBTContract)

  ////////////// CREATE THE CLIENT INTERFACE AND CONTACT THE SANDBOX //////////////
  const logger = createLogger('e2e:token');
  // We create PXE client connected to the sandbox URL
  const PXE_URL = 'http://localhost:8080';

  const pxe = createPXEClient(PXE_URL);
  // Wait for sandbox to be ready
  await waitForPXE(pxe, logger);

  const nodeInfo = await pxe.getNodeInfo();

  logger.info(format('Aztec Sandbox Info ', nodeInfo));

  ////////////// LOAD SOME ACCOUNTS FROM THE SANDBOX //////////////
  // The sandbox comes with a set of created accounts. Load them
  const accounts = await getDeployedTestAccountsWallets(pxe);
  const aliceWallet = accounts[0];
  const bobWallet = accounts[1];
  const alice = aliceWallet.getAddress();
  const bob = bobWallet.getAddress();
  logger.info(`Loaded alice's account at ${alice.toString()}`);
  logger.info(`Loaded bob's account at ${bob.toString()}`);

  ////////////// DEPLOY CONTRACT //////////////

  const contractAlice = await deployCleanHandsSBTContract(aliceWallet, logger);

  ////////////// QUERYING THE CONTRACT //////////////
  let contractOwner = await contractAlice.methods.get_owner().simulate();
  logger.info(`contract owner ${contractOwner}`);

  ////////////// MINT SBT //////////////
  // Expire 365 days from now. Expressed in seconds
  const expiry = Math.floor((new Date().getTime() + 1000 * 60 * 60 * 24 * 365) / 1000);
  await contractAlice.methods.mint(
    aliceWallet.getAddress(),
    123456789,
    987654321, // In production, action nullifier is poseidon(userSecret, actionId)
    expiry,
  ).send().wait();

  ////////////// QUERYING THE CONTRACT FOR SBT //////////////
  let sbt = await contractAlice.methods.get_sbt_by_address(aliceWallet.getAddress()).simulate();
  console.log('sbt', sbt)
}

main();
