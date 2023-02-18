pragma circom 2.0.0;
include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
// Should test all permutations of
// leaf: [GOOD, BAD]
// root: [GOOD, BAD]
// path: [GOOD, BAD]
// indices: [GOOD, BAD]
// and ensure it only succeeds when 
// leaf = GOOD, root = GOOD, path = GOOD, indices = GOOD
// This doesn't cover all edge cases of why the elements could be bad...probably worth auditing!


// /* Modified from PSE IQT https://github.com/privacy-scaling-explorations/incrementalquintree/blob/master/circom/incrementalQuinTree.circom
//  * Given a list of sister nodes and an index, output whether shouldBeAt at idx is equal to array 
//  */
// template SistersHaveElementAtIdx(choices) {
//     signal input array[choices];
//     signal input idx;
//     signal input shouldBeAtIdx;
//     signal output out;
    
//     // Ensure that index < choices
//     component lessThan = LessThan(3);
//     lessThan.in[0] <== index;
//     lessThan.in[1] <== choices;
//     lessThan.out === 1;

//     component calcTotal = CalculateTotal(choices);
//     component eqs[choices];

//     var acc;
//     // For each item, check whether its index equals the input index.
//     for (var i = 0; i < choices; i ++) {
//         eqs[i] = IsEqual();
//         eqs[i].in[0] <== i;
//         eqs[i].in[1] <== index;

//         // eqs[i].out is 1 if the index matches. As such, at most one input to
//         // calcTotal is not 0.
//         calcTotal.nums[i] <== eqs[i].out * in[i];
//     }

//     // Returns 0 + 0 + ... + item
//     out <== calcTotal.sum;
// }

/* FROM: PSE IncrementalQuinTree https://github.com/privacy-scaling-explorations/incrementalquintree/blob/master/circom/calculateTotal.circom */
// This circuit returns the sum of the inputs.
// n must be greater than 0.
template CalculateTotal(n) {
    signal input nums[n];
    signal output sum;

    signal sums[n];
    sums[0] <== nums[0];

    for (var i=1; i < n; i++) {
        sums[i] <== sums[i - 1] + nums[i];
    }

    sum <== sums[n - 1];
}

/* FROM: PSE IncrementalQuinTree https://github.com/privacy-scaling-explorations/incrementalquintree/blob/master/circom/incrementalQuinTree.circom
 * Given a list of items and an index, output the item at the position denoted
 * by the index. The number of items must be less than 8, and the index must
 * be less than the number of items.
 */
template QuinSelector(choices) {
    signal input in[choices];
    signal input index;
    signal output out;
    
    // Ensure that index < choices
    component lessThan = LessThan(3);
    lessThan.in[0] <== index;
    lessThan.in[1] <== choices;
    lessThan.out === 1;

    component calcTotal = CalculateTotal(choices);
    component eqs[choices];

    // For each item, check whether its index equals the input index.
    for (var i = 0; i < choices; i ++) {
        eqs[i] = IsEqual();
        eqs[i].in[0] <== i;
        eqs[i].in[1] <== index;

        // eqs[i].out is 1 if the index matches. As such, at most one input to
        // calcTotal is not 0.
        calcTotal.nums[i] <== eqs[i].out * in[i];
    }

    // Returns 0 + 0 + ... + item
    out <== calcTotal.sum;
}

template Hash() {
    signal input in[5];
    signal output out;
    component hasher = Poseidon(5);
    for (var i = 0; i < 5; i ++) {
        hasher.inputs[i] <== in[i];
    }
    out <== hasher.out;
}

template MerkleProof(depth, arity) {
    signal input root;
    signal input leaf;
    signal input elements[depth][arity];
    signal input indices[depth];
    
    // To refer to all the different Hash and QuinSelector components that will be used per level
    component h[depth];
    component s[depth];

    var level; 
    var idx = indices[0];

    // Check that elements[indices[0]] == leaf
    component leafWasSupplied = QuinSelector(5);
    leafWasSupplied.in <== elements[0];
    leafWasSupplied.index <== idx;
    leafWasSupplied.out === leaf;

    // Accumulator tracks what the index should point to: either the leaf for iteration 0, or the hash of previous elements for iteration > 0
    signal acc[depth+1];
    acc[0] <== leaf;
    
    for (level = 0; level < depth; level++) {
        idx = indices[level];
        // Check the accumulator of this level was included in elements[level]
        s[level] = QuinSelector(5);
        s[level].in <== elements[level];
        s[level].index <== idx;
        s[level].out  === acc[level];

        // Set the accumulator of the next level:
        h[level] = Hash();
        h[level].in <== elements[level];
        acc[level+1] <== h[level].out;

    }

    root === acc[depth-1];

}

component main = MerkleProof(14,5);