// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
pragma solidity ^0.8.0;
import "./PairingAndProof.sol";

contract ProofOfCountry {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alpha;
        Pairing.G2Point beta;
        Pairing.G2Point gamma;
        Pairing.G2Point delta;
        Pairing.G1Point[] gamma_abc;
    }
    function verifyingKey() pure internal returns (VerifyingKey memory vk) {
        vk.alpha = Pairing.G1Point(uint256(0x16cfa5d9c055b645ced836f01363ef6a990d2a91220d523bcf554b67d3228709), uint256(0x1dde318987d426cf90474c4614c3f8497e5d20429324f1cd26243e93829c65ff));
        vk.beta = Pairing.G2Point([uint256(0x1b9e5ff6c3e11319b90908191cca43225cf40b54967688df9ad0494b0fe513e3), uint256(0x2035c2e93acaec5d668786b90e2d5190523f6e5186cdd0746aca591013dc98b5)], [uint256(0x073b3a92dd3a602e3a1317e41bb58e59b647d85dae6a1c63e4087309df715e9d), uint256(0x1c2e19de2db9b8537432b337a78f9d12dba71c2b5356f9450ad5c27b7d1df943)]);
        vk.gamma = Pairing.G2Point([uint256(0x199b65f7dc1454009818087dc02ba53089a3f2e026968bab5c31295bae43c64c), uint256(0x1f0c9b73f64ed9c974ccd1837e1aaee01bf5b514793f15d5bf6a359c55c21c79)], [uint256(0x1f2241ed48fc23a0288543bc52e05ec7c599cbc64004b4cfb6bc456e1b30ce6f), uint256(0x0849075679d2409671b1f87b0604cdbf298f1b12dce2d72e2999ed134493348e)]);
        vk.delta = Pairing.G2Point([uint256(0x09ab50b171a436c0fd9205c6d2f0c3d1914fd84bb192e219c5845af9f0b51bf4), uint256(0x24486826aee1ab052f585f3db7ebad4d3cc39887761079efc44c1eba3cb8170a)], [uint256(0x2e50deeb473cb95f8028343ff932528111a72a9306dcb0b54d392e462a24cf91), uint256(0x1544baa826ecd9a7b84f25a09abddc8b0853929053a901aa6c7a9c8d77fcd0b5)]);
        vk.gamma_abc = new Pairing.G1Point[](4);
        vk.gamma_abc[0] = Pairing.G1Point(uint256(0x17f434bbe35b7680cd3b99997b6240bd68a6c3945dcee5ae4759d9e607079b42), uint256(0x04e6d4d158f24103a7d21f3a1aeddb5140aa293998007f277a26a90cac1ba43c));
        vk.gamma_abc[1] = Pairing.G1Point(uint256(0x179dddcaf04e3fe2e175524eb0dc36aa9b98d2e6c298fad1f4e1796d627c652d), uint256(0x046eb3e13be88242f30e8bf794ea06e73302df70ccd6b550b1f26a8eed19f6c2));
        vk.gamma_abc[2] = Pairing.G1Point(uint256(0x10b75c2f077a57eb092120e48e07413a8c54389067b3e63eab22eba78195a844), uint256(0x0040a762536baab892cbdfd11eeb1d1ca52818b4c00a0fb311233fd9f5750e25));
        vk.gamma_abc[3] = Pairing.G1Point(uint256(0x0dffce9892586fae03a9ff80d199be4cfd1626f4ea14454e84ddd50e5a44119c), uint256(0x1e31e8fb2cb40e052e0aa5abdb7655bb4efd91a03a131e6051ffd2a562801966));
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

    function verifyEncoded(Proof calldata proof, uint[] calldata input_) public view returns (bool r) {
        // (Proof memory proof, uint[25] memory input) = abi.decode(b, (Proof, uint[25]));
        uint[3] memory input;
        for (uint i = 0; i < 2; i++) {
            input[i] = input_[i];
        }
        return verifyTx(proof, input);
    }
}
