// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
pragma solidity ^0.8.0;
import "./PairingAndProof.sol";

contract OnAddLeaf {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alpha;
        Pairing.G2Point beta;
        Pairing.G2Point gamma;
        Pairing.G2Point delta;
        Pairing.G1Point[] gamma_abc;
    }
    function verifyingKey() pure internal returns (VerifyingKey memory vk) {
        vk.alpha = Pairing.G1Point(uint256(0x193e22c4311c3609eb91e7138ac6d29b9dd8bd2f074f6be04fa42c02ca036053), uint256(0x295745b73ac6fc210aa6bc3e0b8d789b6404a259dff1ac60c722848920e5f87f));
        vk.beta = Pairing.G2Point([uint256(0x213d8635a997818eb1c13707bb04ccd95e69ff60c6b9ccaea869cdc71890b6c1), uint256(0x2719f14a0ab6d68f531559d2cd432b2e901c00ff3840764e1c552c773189677b)], [uint256(0x0e14bc64efd9ded08e799a666e1745df6aec82d0761b22777772eb94eb221c9f), uint256(0x03d175bb6309fca6d740df37d61d959922ebdba6877ee305522e81b6d7ae332c)]);
        vk.gamma = Pairing.G2Point([uint256(0x1a06e23ec4935b54c0597f3b467b0a6387a7c3b0601b6e7371438af61f7bc265), uint256(0x1fe80dada06db006ba66ef4db82d3ee74832414d3b53f4626a06f7f8750c15c4)], [uint256(0x08dcab2e5abd9809c60e25037c3b916fe834388bcd5c78e3709e6aeb2e3cc57e), uint256(0x03e1fc33cdcf73fc1d82e36fae31748c781fa4226b30e7601a2bda0e8a56b12a)]);
        vk.delta = Pairing.G2Point([uint256(0x1772a892dc0d131f5d709f8060c57da955692ff581ab41a36a3c0d0daf207a48), uint256(0x16c6fcd0a249a5dab4911e6d2d3f5c95f4a36245a6117120f631ae029c39aeb9)], [uint256(0x0087271d18ff6303d104536f890649b4b420d49c747e192d780c66cd2c964b29), uint256(0x00a890a9980461c6da9125d63bc6b3c996bb6985432fb38dabb7d3ddca844be9)]);
        vk.gamma_abc = new Pairing.G1Point[](4);
        vk.gamma_abc[0] = Pairing.G1Point(uint256(0x0c985a310d66b2f4f974c21d8e4d2be8df76394ba894c8307c6f01ec5d9f8734), uint256(0x193c8d425f2fb2e4b227368edadb05f282ae2750c60e1a056dc7fdb028088b4f));
        vk.gamma_abc[1] = Pairing.G1Point(uint256(0x1197eca1c597fd28d76a01664204e6144a92366a06e5642721af18e24ad08e1e), uint256(0x23cc59ae89cb3c9cb359d3e7610912167dd54eba8db12de9161e1198ca298842));
        vk.gamma_abc[2] = Pairing.G1Point(uint256(0x13cdef780266d604b254108f00b50c19e0293103d68fe04dd5e76e593f1d19bf), uint256(0x0f0089538a39d0f144f4c8ca57c0cc3f63a4174f6f9d17d5b0ee563cf8708e33));
        vk.gamma_abc[3] = Pairing.G1Point(uint256(0x20b55fc8eb393034d47a78c00f394cf68769592e0b1343d92e5d0c64b9629902), uint256(0x22665571d9d730edcf00aff2ef5e39d90f67497b149e6817dc5e62f23ecd6306));
    }
    function verify(uint[] memory input, Proof memory proof) internal view returns (uint) {
        uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        VerifyingKey memory vk = verifyingKey();
        require(input.length + 1 == vk.gamma_abc.length);
        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);
        for (uint i = 0; i < input.length; i++) {
            require(input[i] < snark_scalar_field);
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.gamma_abc[i + 1], input[i]));
        }
        vk_x = Pairing.addition(vk_x, vk.gamma_abc[0]);
        if(!Pairing.pairingProd4(
             proof.a, proof.b,
             Pairing.negate(vk_x), vk.gamma,
             Pairing.negate(proof.c), vk.delta,
             Pairing.negate(vk.alpha), vk.beta)) return 1;
        return 0;
    }
    function verifyTx(
            Proof memory proof, uint[3] memory input
        ) public view returns (bool r) {
        uint[] memory inputValues = new uint[](3);
        
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof) == 0) {
            return true;
        } else {
            return false;
        }
    }
}
