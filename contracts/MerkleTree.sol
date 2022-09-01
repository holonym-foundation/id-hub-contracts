// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@zk-kit/incremental-merkle-tree.sol/IncrementalBinaryTree.sol";

contract MerkleTree is Ownable {
    using IncrementalBinaryTree for IncrementalTreeData;

    event LeafInserted(uint256 leaf, uint256 root);
    // event LeafUpdated(uint256 leaf, uint256 root);
    // event LeafRemoved(uint256 leaf, uint256 root);

    IncrementalTreeData public tree;

    uint256[] public leaves;

    address public hubAddress;

    /// @param _hubAddress Address of the Hub contract
    constructor(address _hubAddress) {
        // Create tree with depth 32 and use 0 as the value for null leaves
        tree.init(32, 0);
        
        hubAddress = _hubAddress;
    }

    modifier onlyHub() {
        require(msg.sender == hubAddress);
        _;
    }

    function setHubAddress(address newHubAddress) public onlyOwner {
        hubAddress = newHubAddress;
    }

    /// @dev Only the Hub contract should be able to call this function because
    ///      the leaf should be validated before being inserted.
    function insertLeaf(uint256 _leaf) public onlyHub {
        tree.insert(_leaf);
        leaves.push(_leaf);
        emit LeafInserted(_leaf, tree.root);
    }

    // function updateLeaf(
    //     uint256 _leaf,
    //     uint256[] calldata _proofSiblings,
    //     uint8[] calldata _proofPathIndices
    // ) external {
    //     tree.update(_leaf, _proofSiblings, _proofPathIndices);
    //     emit LeafUpdated(_leaf, tree.root);
    // }

    // function removeLeaf(
    //     uint256 _leaf,
    //     uint256[] calldata _proofSiblings,
    //     uint8[] calldata _proofPathIndices
    // ) external {
    //     tree.remove(_leaf, _proofSiblings, _proofPathIndices);
    //     emit LeafRemoved(_leaf, tree.root);
    // }

    function getLeaves() public view returns(uint256[] memory) {
        return leaves;
    }
}
