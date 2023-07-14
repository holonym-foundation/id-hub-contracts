// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HolonymUniqueGovID is ERC721, Ownable {
    constructor() ERC721("HolonymUniqueGovID", "HUGI") {}

    function _baseURI() internal pure override returns (string memory) {
        return "https://www.holonym.id/images/Holo-anon.jpg";
    }

    function safeMint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}
