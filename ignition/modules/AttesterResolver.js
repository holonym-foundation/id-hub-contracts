const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// Deploy command:
// npx hardhat ignition deploy ./ignition/modules/AttesterResolver.js --network <your-network>
module.exports = buildModule("AttesterResolver", (m) => {
  const easContractAddress = "0x4200000000000000000000000000000000000021"; // Optimism v1.0.1
  const attesterAddress = "0xB1f50c6C34C72346b1229e5C80587D0D659556Fd";

  const attesterResolver = m.contract("AttesterResolver", [easContractAddress, attesterAddress]);

  return { attesterResolver };
});

// Deployed on Optimism. Address: 0xED072327690B5fb6A0651eC0484f35B94A303299