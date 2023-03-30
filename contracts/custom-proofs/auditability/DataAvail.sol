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
    event TagAdded(bytes32 tagId, Tag tag);
    mapping(bytes32 => Tag) tagForAvailID;
    constructor() {
    }

    function storeData(/*proof, publicSignals*/) public {
        // require(verifier.verify(proof, publicSignals, "failed to verify proof of correct encryption");
        // Tag tag = signalsToTag(publicSignals);
        // tagId = getTagId(tag);
        // require(tagForAvailID[tagId] "Please use a new tagId / commitment");
        // tagForAvailID[tagId] = tag;
    }

    // Gets the availID for a tag, which helps check whether the tag has been stored:
    function getAvailID(Tag memory tag) public pure returns (bytes32 id) {
        return getAvailID(tag.commitment, tag.accessControlLogic);
    }

    // getAvailID override with smaller arguments:
    function getAvailID(Point memory dataCommitment, address accessControlLogic) public pure returns (bytes32 id) {
        return keccak256(abi.encodePacked(
            dataCommitment.x,
            dataCommitment.y,
            accessControlLogic
        ));
    }

    // Checks a tag has been stored:
    function checkDataAvailability(Point memory dataCommitment, address accessControlLogic) public view returns (bool available) {
        bytes32 id = getAvailID(dataCommitment, accessControlLogic);
        // This line works because if tagForAvailID[id] is uninitialized, the accessControlLogic will be the zero address
        return (tagForAvailID[id].accessControlLogic == accessControlLogic) && (accessControlLogic != address(0));
    }
    
}
