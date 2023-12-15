pragma solidity ^0.8.0;
import "./IPaidProofV3.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PaidProofV3 is IPaidProofV3, Ownable {
    mapping(bytes32 => uint) public fees; // Fee in ETH to use a particular circuit

    constructor() {}

    function setFee(bytes32 circuitId, uint newFee) public onlyOwner {
            fees[circuitId] = newFee;
    }

    function collectFees() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    modifier needsPayment(bytes32 circuitId) {
        require(msg.value == fees[circuitId], "Missing payment");
        _;
    }
}
