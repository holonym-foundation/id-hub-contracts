include "../../../node_modules/circomlib/circuits/poseidon.circom";
template Hash() {
    signal input in[5];
    signal output out;
    component hasher = Poseidon(5);
    for (var i = 0; i < 5; i ++) {
        hasher.inputs[i] <== in[i];
    }
    out <== hasher.out;
}