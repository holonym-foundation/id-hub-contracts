include "../../../node_modules/circomlib/circuits/poseidon.circom";
template Hash(n) {
    signal input in[n];
    signal output out;
    component hasher = Poseidon(n);
    for (var i = 0; i < n; i ++) {
        hasher.inputs[i] <== in[i];
    }
    out <== hasher.out;
}
// TODO: refactor
template Hash5() {
    signal input in[5];
    signal output out;
    component hasher = Poseidon(5);
    for (var i = 0; i < 5; i ++) {
        hasher.inputs[i] <== in[i];
    }
    out <== hasher.out;
}
template Hash6() {
    signal input in[6];
    signal output out;
    component hasher = Poseidon(6);
    for (var i = 0; i < 6; i ++) {
        hasher.inputs[i] <== in[i];
    }
    out <== hasher.out;
}