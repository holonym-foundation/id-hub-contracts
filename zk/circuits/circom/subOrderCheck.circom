include "../../../node_modules/circomlib/circuits/bitify.circom";
include "../../../node_modules/circomlib/circuits/escalarmulany.circom";

// Checks that a point is in the subgroup. Assumes point is on the curve
// Note: this could be more by replacing EScalarMulAny with a new template that multiples a fixed scalar by any point
template SubOrderCheck() {
    
    signal input point[2];
    // 2736030358979909402780800718157159386076813972158567259200215660948447373041 in binary:
    signal subOrder[251] <== [1,0,0,0,1,1,1,1,0,1,1,0,0,1,0,0,1,0,0,0,0,1,0,0,1,0,0,1,1,1,0,0,0,0,1,1,1,0,1,1,1,1,1,0,1,0,0,1,0,1,0,0,1,1,1,0,1,1,1,0,0,1,1,0,0,1,0,1,0,0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0,1,0,0,1,0,0,1,1,1,0,0,0,0,0,1,1,1,0,1,1,0,1,1,0,1,1,1,0,1,1,1,1,1,0,0,1,1,0,1,0,1,0,1,1,1,0,1,0,0,0,0,1,1,0,1,0,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,0,1,1,0,1,1,0,1,1,0,1,0,0,0,1,0,0,0,0,0,1,0,1,0,0,0,0,1,1,1,0,1,1,0,0,1,0,1,0,0,0,0,0,0,0,1,0,1,1,0,0,0,1,1,0,0,1,0,0,0,0,1,1,1,0,1,0,0,1,1,1,0,0,1,1,1,0,0,1,0,0,0,1,0,0,1,1,0,0,0,0,0,1,1];
    component orderCheck = EscalarMulAny(251);
    
    orderCheck.e <== subOrder;
    orderCheck.p <== point;

    log("order check");
    log(orderCheck.out[0]);
    log(orderCheck.out[1]);

    orderCheck.out === [0,1];
}

// component main = SubOrderCheck();