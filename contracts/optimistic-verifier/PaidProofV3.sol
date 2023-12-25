pragma solidity ^0.8.0;
import "./IPaidProofV3.sol";
import "hardhat/console.sol";
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

    // modifier needsFee(bytes32 circuitId) {
    //     require(msg.value == fees[circuitId], "Missing Feeeee");
    //     _;
    // }

    modifier needsCustomFee(uint customFee) {
        require(msg.value == customFee, "Missing Fee");
        _;
    }
}
