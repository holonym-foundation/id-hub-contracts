const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// Deploy command:
// npx hardhat ignition deploy ./ignition/modules/DefaultPortal.js --network <your-network>
module.exports = buildModule("ZeronymV3PortalV2", (m) => {
  const routerAddress = "0x4d3a380A03f3a18A5dC44b01119839D8674a552E";

  const defaultPortal = m.contract("ZeronymV3PortalV2", [[], routerAddress]);

  return { defaultPortal };
});
