// Converts between twisted and untwisted BabyJubJub coordinates using the mapping given by https://eprint.iacr.org/2008/013.pdf

// BabyJubJub Twisted Edwards' a = 168700
// sqrt(a) = 7214280148105020021932206872019688659210616427216992810330019057549499971851
// 1 / sqrt(a) = 2957874849018779266517920829765869116077630550401372566248359756137677864698   

include "../../../node_modules/circomlib/circuits/babyjub.circom";

template TwistedToUntwisted() {
    signal input in[2];
    signal output out[2];
    var sqrt_a = 7214280148105020021932206872019688659210616427216992810330019057549499971851;

    out[0] <== in[0] * sqrt_a;
    out[1] <== in[1];
}

template UntwistedToTwisted() {
    signal input in[2];
    signal output out[2];
    var inv_sqrt_a = 2957874849018779266517920829765869116077630550401372566248359756137677864698;

    out[0] <== in[0] * inv_sqrt_a;
    out[1] <== in[1];
}

template Test() {
    // A valid point in Edwards representation
    var untwisted_x = 535593336793637676479053006008715741038479202311237693774606504536042252795;
    var untwisted_y = 23469575780919401;

    component toTwisted = UntwistedToTwisted();
    component fromTwisted = TwistedToUntwisted();
    component onCurve = BabyCheck();

    toTwisted.in[0] <== untwisted_x;
    toTwisted.in[1] <== untwisted_y;

    onCurve.x <== toTwisted.out[0];
    onCurve.y <== toTwisted.out[1];
    
    fromTwisted.in[0] <== toTwisted.out[0];
    fromTwisted.in[1] <== toTwisted.out[1];

    fromTwisted.out[0] === untwisted_x;
    fromTwisted.out[1] === untwisted_y;
}