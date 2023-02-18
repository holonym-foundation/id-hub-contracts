// Allows direct testing of merkleproof.circom by exposing it through a main component interface
include "./merkleproof.circom";
component main {public [root, leaf, siblings, pathIndices]} = MerkleProof(14,5);