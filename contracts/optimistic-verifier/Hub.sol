// SPDX-License-Identifier: MIT

// This contract accepts a signed attestation from a certain Verifier that a ZKP has been recieved. The attestation SHOULD be verifiable with offchain methods
// After recieving a valid attestation and paying any required fee, the address given in the proof receives an SBT. 
// THE EXISTENCE OF AN SBT ALONE IS NOT SUFFICIENT TO VERIFY A USER in most cases - typically the SBT's publicValues must be checked as well.
// The existence of an SBT just shows the proof was verified and paid for but not that its public values are acceptable
// Note that getSBT() checks SBT expiry and only returns non-expired SBTs but using standard NFT methods to check for ownership do not check expiry or really anything meaningful
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./PaidProofV3.sol";
// import "hardhat/console.sol";
struct SBT {
    uint expiry; // A Unix timestamp in the same format as block.timestamp
    uint[] publicValues; // The proof's public values
}
contract Hub is PaidProofV3, ERC721URIStorage {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;
    
    address verifier;
    Counters.Counter private _tokenIds;
    
    /// For checking whether a nullifier has been used before
    mapping(uint => bool) public usedNullifiers;
    
    /// Mapping of (user, circuit) identifiers to the corresponding SBT timestamp and value which is an array of uints
    mapping(bytes32 => SBT) public sbtOwners;

    constructor(address v) ERC721("Holonym V3", "H3") {
        verifier = v;
    }

    /// NFT URL
    function _baseURI() internal pure override returns (string memory) {
        return "https://nft.holonym.io/nft-metadata/v3/";
    }
    function _transfer(address from, address to, uint256 tokenId) internal override {
        revert("Cannot transfer this type of token");
    }
    /// Gets an identifier for a (user, circuit) pair. 
    function getIdentifier(address user, bytes32 circuitId) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(user, circuitId));
    }


    /// `circuitId` is the ID of the circuit and also the SBT
    /// `proofIPFSCID` is a currently unused parameter set to the empty string. It can be used to check the proof oneself instead of trusting the verifier.
    /// `sbtReciever` is the address the verifier specifies to recieve the SBT. 
    /// `expiration` is an expiration date the verifier can set.
    /// `customFee` is a fee the verifier can set that the user must pay to submit the transaction.
    /// `nullifier` is an optional field (set to 0 if unused) which prevents the same ID from being used for >1 proof. Again this is given by the verifier but can be checked if the Verifier posts the proof to IPFS
    /// `publicValues` are the proofs' public inputs and outputs. They are stored with the SBT. Again, these can be checked if the proof is put in IPFS
    /// To migrate SBT owners from the previous contract, the initially centralized trusted verifier can simply add them one-by-one
    function sendSBT(
        bytes32 circuitId,
        // string calldata proofIPFSCID,
        uint sbtReciever, 
        uint expiration,
        uint customFee,
        uint nullifier, 
        uint[] calldata publicValues, 
        bytes memory signature
    ) public payable needsCustomFee(customFee) /* needsPayment(circuitId) */ {
        bool success = keccak256(
            abi.encodePacked(
                circuitId,
                // proofIPFSCID,
                sbtReciever, 
                expiration,
                customFee,
                nullifier,
                publicValues,
                block.chainid // Chain ID in signature prevents proof from being replayed on other chains for same native price
            )
        )
        .toEthSignedMessageHash()
        .recover(signature) == verifier;
        require(success, "The Verifier did not sign the provided arguments in the provided order");

        if(nullifier != 0) {
            require(!usedNullifiers[nullifier], "this is already been proven");
            usedNullifiers[nullifier] = true;
        }

        address receiver = address(uint160(sbtReciever));
        bytes32 identifier = getIdentifier(receiver, circuitId);

        // Set the SBT's data
        sbtOwners[identifier] = SBT(expiration, publicValues);

        // Call the ERC721's mint function
        _tokenIds.increment();
        uint tid = _tokenIds.current();
        _safeMint(receiver, tid);
        _setTokenURI(tid, Base64.encode(abi.encode(sbtOwners[identifier])));
    }

    /// IMPORTANT: make sure you check the public values such as actionId from this. Someone can forge a proof if you don't check the public values
    /// e.g., by using a different issuer or actionId
    function getSBT(address sbtOwner, bytes32 circuitId) public view returns (SBT memory sbt) {
        SBT memory s = sbtOwners[getIdentifier(sbtOwner, circuitId)];
        require(s.expiry >= block.timestamp, "SBT is expired");
        return s;
    }
}
