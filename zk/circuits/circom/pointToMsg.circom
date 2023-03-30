include "../../../node_modules/circomlib/circuits/bitify.circom";

// Removes last 10 bits of point's x-coordinate to convert it to a message 

/* There's a more efficient way to do this, just one line:
 * signal msg = point[0] \ 1024
 * However, there is a bug with circom making that not work for now :/
*/

template PointToMsg() {
    signal input point[2];
    signal output msg;

    // I don't see any problem with using Num2Bits instead of Num2Bits_strict, but should return to this when not tired!!!
    component toBits = Num2Bits(254);
    component toNum = Bits2Num(244);

    toBits.in <== point[0];

    var i = 0;
    for (i=10; i<254; i++) {
        toNum.in[i-10] <== toBits.out[i];
    }
    msg <== toNum.out;
}