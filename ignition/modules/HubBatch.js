const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// Deploy command:
// npx hardhat ignition deploy ./ignition/modules/HubBatch.js --network <your-network>
module.exports = buildModule("HubBatch", (m) => {
  const Hub = "0x2AA822e264F8cc31A2b9C22f39e5551241e94DfB";

  const HubBatch = m.contract("HubBatch", [Hub]);

  return { HubBatch };
});

// Deployed on Optimism. Address: 0xef59aC90646fc09690ed4144741f3A884282ee77