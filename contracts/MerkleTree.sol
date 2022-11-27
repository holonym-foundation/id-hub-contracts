// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@zk-kit/incremental-merkle-tree.sol/IncrementalQuinTree.sol";

contract MerkleTree is Ownable {
    using IncrementalQuinTree for IncrementalTreeData;
    uint8 public constant DEPTH = 14;
    uint8 public constant ROOT_HISTORY_SIZE = 10;
    uint256[ROOT_HISTORY_SIZE] public recentRootsList;
    mapping(uint256 => bool) public recentRootsMap;

    event LeafInserted(uint256 leaf, uint256 root);


    IncrementalTreeData public tree;

    uint256 public root;
    uint256[] public leaves;
    mapping (uint256 => bool) public leafExists;
    
    address public hubAddress;

    uint256[] internal emptyArray;

    /// @param _hubAddress Address of the Hub contract
    constructor(address _hubAddress) {
        console.log("WARNING: INCRASE ROOT_HISTORY_SIZE TO AT LEAST 30 BEFORE PRODUCTION, AND REMOVE HARDHAT/CONSOLE.SOL");

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
        // Insert the leaf
        tree.insert(_leaf);
        leaves.push(_leaf);
        leafExists[_leaf] = true;
        // Replace an element of recentRootsList to make room for new root:
        uint256 insertAt = (tree.numberOfLeaves-1) % ROOT_HISTORY_SIZE; //number of leaves is a the same as number of roots ever made
        recentRootsMap[recentRootsList[insertAt]] = false;
        recentRootsMap[tree.root] = true;
        recentRootsList[insertAt] = tree.root;

        emit LeafInserted(_leaf, tree.root);
    }

    function mostRecentRoot() public view returns (uint256) {
        return tree.root;
    }
    function rootIsRecent(uint256 r) public view returns (bool) {
        return recentRootsMap[r];
    }
    function getLeaves() public view returns(uint256[] memory) {
        return leaves;
    }
    // Returns all new leaves, starting at idx (this is called off-chain to update a local state cache with new leaves)
    function getLeavesFrom(uint idx) public view returns(uint256[] memory) {
        if(leaves.length <= idx) { return emptyArray; }
        uint256[] memory leavesFrom = new uint256[](leaves.length - idx);
        uint256 j = 0;
        for(uint i=idx; i<leaves.length; i++) {
            leavesFrom[j] = leaves[i];
            j++;
        }
        return leavesFrom;
    }
}
