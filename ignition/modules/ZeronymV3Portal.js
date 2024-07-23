const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ZeronymV3Portal", (m) => {
  const routerAddress = "0x4d3a380A03f3a18A5dC44b01119839D8674a552E";

  const zeronymV3Portal = m.contract("ZeronymV3Portal", [[], routerAddress]);

  return { zeronymV3Portal };
});
