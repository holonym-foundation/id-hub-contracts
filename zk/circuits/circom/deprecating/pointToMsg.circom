template pointToMsg() {
    signal input point[2];
    signal output out;
    out <== point[0] \ 1024;
}