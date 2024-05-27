pragma circom 2.0.0;

include "../../../node_modules/circomlib/circuits/bitify.circom";
include "../../../node_modules/circomlib/circuits/pointbits.circom";
include "../../../node_modules/circomlib/circuits/escalarmulfix.circom";
include "../../../node_modules/circomlib/circuits/escalarmulany.circom";
include "../../../node_modules/circomlib/circuits/babyjub.circom";
include "./subOrderCheck.circom";

/* 
ElGamal encryption on BabyJubJub curve 
--------------------------------------
Inputs: 
    h: public key to encrypt to. equivalent to g^x, where x is the private key of the receiving party.
    yBits: a secret random string of bits used to create a shared secret with the receiving party
    m: a point representing the message to encrypt
*/

template EncryptElGamal() {
    signal input pubkey[2];
    signal input y;
    // signal input m;
    signal input messageAsPoint[2];
    signal output c1[2];
    signal output c2[2];

    component toBitsY = Num2Bits(254);
    toBitsY.in <== y;

    // component toBitsM = Num2Bits(256);
    // toBitsM.in <== m;

    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];
    
    var i;

    // Prevent invalid curve attacks
    component checkOnCurve = BabyCheck();
    checkOnCurve.x <== messageAsPoint[0];
    checkOnCurve.y <== messageAsPoint[1];

    // Make sure msg in the subgroup to preserve semantic security
    component checkInSubgroup = SubOrderCheck();
    checkInSubgroup.point <== messageAsPoint;
    
    component getPubkey = EscalarMulFix(254, BASE8);
    for (i=0; i<254; i++) {
        getPubkey.e[i] <== toBitsY.out[i];
    }
    
    c1 <== getPubkey.out;

    component getSharedSecret = EscalarMulAny(254);
    getSharedSecret.p <== pubkey;
    for (i=0; i<254; i++) {
        getSharedSecret.e[i] <== toBitsY.out[i];
    }

    component msgPlusSecret = BabyAdd();
    msgPlusSecret.x1 <== messageAsPoint[0]; // messageToPoint.out[0];
    msgPlusSecret.y1 <== messageAsPoint[1]; // messageToPoint.out[1];
    msgPlusSecret.x2 <== getSharedSecret.out[0];
    msgPlusSecret.y2 <== getSharedSecret.out[1];    
    
    c2 <== [msgPlusSecret.xout, msgPlusSecret.yout];

        
}

// component main = EncryptElGamal();
