pragma solidity ^0.8.1;
import "./IPaidProofV3.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PaidProofV3 is IPaidProofV3, Ownable {
    constructor() {}

    function collectFees() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    modifier needsCustomFee(uint customFee) {
        require(msg.value == customFee, "Missing Fee");
        _;
    }
}
