pragma solidity ^0.8.0;
import "./IPaidProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PaidProofV2 is IPaidProof, Ownable {
    uint public price; // Price in ETH to use a function with the needsPayment modifier
    mapping(uint => bool) public allowedIssuers; // Whitelist of issuers
    event PriceSet(uint newPrice);
    event IssuerAdded(uint issuerAddress);
    event IssuerRevoked(uint issuerAddress);

    constructor() {}

    function setPrice(uint newPrice) public onlyOwner {
        price = newPrice;
        emit PriceSet(newPrice);
    }

    function collectPayments() public onlyOwner {
        // payable(owner()).transfer(address(this).balance);
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Transfer failed.");
    }

    modifier needsPayment() {
        require(msg.value == price, "Missing payment");
        _;
    }

    function allowIssuers(uint[] memory issuerAddresses) public onlyOwner {
        uint8 i;
        for (i = 0; i < issuerAddresses.length; i++) {
            allowedIssuers[issuerAddresses[i]] = true;  
            emit IssuerAdded(issuerAddresses[i]);
        }
    }

    function revokeIssuers(uint[] memory issuerAddresses) public onlyOwner {
        uint8 i;
        for (i = 0; i < issuerAddresses.length; i++) {
            allowedIssuers[issuerAddresses[i]] = false;
            emit IssuerRevoked(issuerAddresses[i]);  
        }            
    }

    function isValidIssuer(uint issuerAddress) public view returns (bool) {
        return allowedIssuers[issuerAddress];       
    }
}
