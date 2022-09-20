// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
pragma solidity ^0.8.0;
import "./PairingAndProof.sol";

contract QuinaryMerkleProof {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alpha;
        Pairing.G2Point beta;
        Pairing.G2Point gamma;
        Pairing.G2Point delta;
        Pairing.G1Point[] gamma_abc;
    }
    function verifyingKey() pure internal returns (VerifyingKey memory vk) {
        vk.alpha = Pairing.G1Point(uint256(0x16cc177ccf780ed9a55fbe9b6b97d92cce57ed557ad04d0bfa5e7da586fa38cf), uint256(0x1a37f68b291d664cb1bf2409b20b40003bdc72cfb3bba3b467d180ebdd653eff));
        vk.beta = Pairing.G2Point([uint256(0x05022ffecd6893ebc202b0de9f1360f483d5bc7b6391116ef9c548821f9e72b0), uint256(0x153e0ddd02880f4b27a2f9715dbffd902cb34d4b77a225a942c63c031b8f5dde)], [uint256(0x152aa557bb042003a1b3078d2591b5d4da02cce99b25ec986f9add8ba930bcb2), uint256(0x2b5e710aff538583cab64dbe160004b552e6b4f37911d24ad4db063b6c99f437)]);
        vk.gamma = Pairing.G2Point([uint256(0x187478128eb6857346eb544a19b9b4cc09b96ba908ede39224cf778eeb1667d7), uint256(0x08d8184752ffc9952a4ed5af99f65fedb255b7e92303dd32f833fdd2ca1f2485)], [uint256(0x2a9991df7388ebe8e12ea47ac248819a3461459388dd28b0b39f73a592ddd8f6), uint256(0x2aa454db3370ea4189603596958067041e3f29e7587c910007b5a19d08e64942)]);
        vk.delta = Pairing.G2Point([uint256(0x0096ffbc8e451d21c4b210cec41258423ed84b7456b0367d2e022f3ef310f266), uint256(0x1c5ef64ce6c9c488dd0c35c033b4d210895c06a4799bd67fea2873db32486ae4)], [uint256(0x25ea0a8a2803ccc7514a8a1456db1bec11cd0946af4e68bbb8ae0fe620ec4701), uint256(0x13913551597c343326226913a2d00e5b96a10f454e625216375b2d9ee5920bed)]);
        vk.gamma_abc = new Pairing.G1Point[](3);
        vk.gamma_abc[0] = Pairing.G1Point(uint256(0x2d63261fb6e9a0d3cbe1a46168778f26d9a3e0c011fe42b8ead4e7b0d70d51df), uint256(0x23fb61b10009704b560c49c197215721cac282426bdb1dd3de9ff99538b4ad63));
        vk.gamma_abc[1] = Pairing.G1Point(uint256(0x14ed3e92b5d27d090e132cc526e6f3cb4e225aae62c91eabcdcfdc2b4bbe56ee), uint256(0x0d442f9b5e4d614ae2e17d8b96a678697cab0715186737c3dedbf8b8040e6f41));
        vk.gamma_abc[2] = Pairing.G1Point(uint256(0x0c535aa4ad99d1b5450144133cb93e14e30987404dbc36fca8e79fab03be5e71), uint256(0x046a538db898a99bc7a3144d34110dbc322ac967ee98ad2f47b6df7efbe403fd));
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
            Proof memory proof, uint[2] memory input
        ) public view returns (bool r) {
        uint[] memory inputValues = new uint[](2);
        
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof) == 0) {
            return true;
        } else {
            return false;
        }
    }

    function verifyEncoded(Proof calldata proof, uint[] calldata input_) public view returns (bool r) {
        // (Proof memory proof, uint[25] memory input) = abi.decode(b, (Proof, uint[25]));
        uint[2] memory input;
        for (uint i = 0; i < 2; i++) {
            input[i] = input_[i];
        }
        return verifyTx(proof, input);
    }
}
