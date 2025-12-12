const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// Deploy command:
// npx hardhat ignition deploy ./ignition/modules/HumanIDPayments.js --network <your-network>
module.exports = buildModule("HumanIDPayments", (m) => {
  const Hub = "0x1F39402D34ea3024dC7f6afC6ADDDE198332A307";

  const HumanIDPayments = m.contract("HumanIDPayments", [Hub]);

  return { HumanIDPayments };
});

// Deployed on Optimism. Address: ...
// Deployed on Optimism Sepolia. Address: 0xF98798e9dAC28928F1E5EE6109d5eb2797152E92