pragma solidity ^0.8.0;
import "./IPaidProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract PaidProof is IPaidProof, Ownable {
    uint public price;

    constructor() {
        console.log("owner", owner(), msg.sender);
    }

    function setPrice(uint newPrice) public onlyOwner {
            price = newPrice;
    }

    function collectPayments() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    modifier needsPayment() {
        require(msg.value >= price, "Missing payment");
        _;
    }
}
