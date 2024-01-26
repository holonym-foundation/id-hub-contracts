pragma solidity ^0.8.1;
interface IPaidProofV3 {
    // function setFee(bytes32 circuitId, uint newFee) external;
    function collectFees() external;
}
