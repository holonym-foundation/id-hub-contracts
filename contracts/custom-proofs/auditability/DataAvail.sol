// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

struct Point {
    uint x;
    uint y;
}

struct ElGamalCiphertext {
    Point c1;
    Point c2;
}

struct Tag {
    address accessControlLogic;
    Point commitment;
    ElGamalCiphertext ciphertext;
    uint prfIn;
}

contract DataAvail {

    mapping(bytes32 => Tag) tagForId;
    constructor() {
    }

    function store(/*proof*/) public {
        // require(TODO: Verify proof)
        // Tag tag = signalsToTag(publicSignals);
        // tagId = getTagId(tag);
        // require(tagForId[tagId] "Please use a new tagId / commitment");
        // tagForId[tagId] = tag;
    }

    // function dataExists(/*data or hash of data*/) public view returns (bool e) {}

    // Converts the daEncrypt proof's public signals to a Tag struct
    // function signalsToTag(uint[] memory publicSignals) public view returns (Tag memory t) {}

    // function tagToSignals(Tag memory tag) public view returns (uint[] memory s) {}

    function getAvailabilityID(Point memory dataCommitment, address accessControlLogic) public pure returns (bytes32 id) {
        
        return keccak256(abi.encodePacked(
            dataCommitment.x,
            dataCommitment.y,
            accessControlLogic
        ));
    }

    function getAvailabilityID(Tag memory tag) public pure returns (bytes32 id) {
        return getAvailabilityID(tag.commitment, tag.accessControlLogic);
    }

    function checkDataAvailability(Point memory dataCommitment, address accessControlLogic) public view returns (bool available) {
        bytes32 id = getAvailabilityID(dataCommitment, accessControlLogic);
        // This line works because if tagForId[id] is uninitialized, the accessControlLogic will be the zero address
        return (tagForId[id].accessControlLogic == accessControlLogic) && (accessControlLogic != address(0));
    }
}
