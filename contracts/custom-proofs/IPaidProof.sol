pragma solidity ^0.8.0;
interface IPaidProof {
    function setPrice(uint newPrice) external;
    function collectPayments() external;
}
