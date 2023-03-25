include "../../../node_modules/circomlib/circuits/escalarmulfix.circom";

// template PedersenCommit() {
    
// }

// A and B are two *random* predetermined points aG and bG, where a and b are unknown
// TODO: compute some random A and B values via MPC where we can trust a and b are unknown
template PedersenCommitFixed(A, B) {
    signal output commitment[2];

    signal input msg;
    signal input rnd;  

    component msgToBits = Num2Bits(254);
    msgToBits.in <== msg;
    component rndToBits = Num2Bits(254);
    rndToBits.in <== rnd;


    component mulA = EscalarMulFix(254, A);
    component mulB = EscalarMulFix(254, B);
    var i;
    for (i=0; i<254; i++) {
        mulA.e[i] <== msgToBits.out[i];
        mulB.e[i] <== rndToBits.out[i];
    }
    
    component adder = BabyAdd();
    adder.x1 <== mulA.out[0];
    adder.y1 <== mulA.out[1];
    adder.x2 <== mulB.out[0];
    adder.y2 <== mulB.out[1];

    commitment <== [adder.xout, adder.yout];

}

// component main = PedersenCommitFixed([69,69], [100,123]);