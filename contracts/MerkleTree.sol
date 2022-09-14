// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@zk-kit/incremental-merkle-tree.sol/IncrementalBinaryTree.sol";

contract MerkleTree is Ownable {
    using IncrementalBinaryTree for IncrementalTreeData;
    uint8 constant DEPTH = 12;
    event LeafInserted(uint256 leaf, uint256 root);
    // event LeafUpdated(uint256 leaf, uint256 root);
    // event LeafRemoved(uint256 leaf, uint256 root);

    IncrementalTreeData public tree;

    uint256[] public leaves;
    mapping (uint256 => bool) public leafExists;
    
    address public hubAddress;

    /// @param _hubAddress Address of the Hub contract
    constructor(address _hubAddress) {
        // Create tree with depth DEPTH and use 0 as the value for null leaves
        tree.init(DEPTH, 0);
        
        hubAddress = _hubAddress;
    }

    modifier onlyHub() {
        require(msg.sender == hubAddress, "Only the Hub contract can call this function.");
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
        leafExists[_leaf] = true;
        emit LeafInserted(_leaf, tree.root);
    }

    function getLeaves() public view returns(uint256[] memory) {
        return leaves;
    }
}
