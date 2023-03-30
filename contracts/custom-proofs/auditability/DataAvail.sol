// SPDX-License-Identifier: MIT

/* This is the data availabilty part of zkEscrow. It stores encrypted user data, given by the zk-escrow npm package.
 * It allows for statements of the form "I have stored properly-encrypted data to this contract, and the commitment to my data is X"
 * Then, users can do arbitrary proofs of the data by opening the commitment in a zksnark. 
 * Neither the ciphertext and the commitment stored here can be broken by quantum computers, nor lost in a data breach of a single master key.
*/
pragma solidity ^0.8.9;

struct Point {
    uint x;
    uint y;
}

struct ElGamalCiphertext {
    Point c1;
    Point c2;
}

// A tag is given in the proof of correct encryption, as the public signals. It is all the information that will be needed to recover the plaintext.
// Notably, it has a Pedersen commitment to the plaintext data. That way, once data is stored in this contract, a user can open the commitment in another
// zksnark to prove facts about it. 
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
