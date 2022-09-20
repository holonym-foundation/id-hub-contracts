// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
pragma solidity ^0.8.0;
import "./PairingAndProof.sol";

contract Verifier {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alpha;
        Pairing.G2Point beta;
        Pairing.G2Point gamma;
        Pairing.G2Point delta;
        Pairing.G1Point[] gamma_abc;
    }
    struct Proof {
        Pairing.G1Point a;
        Pairing.G2Point b;
        Pairing.G1Point c;
    }
    function verifyingKey() pure internal returns (VerifyingKey memory vk) {
        vk.alpha = Pairing.G1Point(uint256(0x288810179e5c0b5f6d3434267dd6c902569bae34efef6cf6906d28cd135f8f94), uint256(0x2ce220883ae650a7decbd8a5d0a30cb6578e046e8c5694783b26b5b8e0c4d6a8));
        vk.beta = Pairing.G2Point([uint256(0x0006130fd022fd5f14fc310b6a73f8561bd41280c820a54cb02ddde162721239), uint256(0x2969ff4d2244eb19b43346f361d109a8b3b6579c29159f82240f00eb797ca7d5)], [uint256(0x0f0ac52851a302299c2177e609728c7275c020423512e13e63b91232d8fa9370), uint256(0x2b6406303abdee7f601adcb1f6c5316404818a627715180d9eb4200b4cde90db)]);
        vk.gamma = Pairing.G2Point([uint256(0x1c7b68c933ff69a2a9688b261ac3db4d18420ddf44fac4fd27da8398f1125e60), uint256(0x298569c4970f5dc222147746e1ce4657d2a854d476d58948cf10c26ddf63db20)], [uint256(0x11ad1d09058e47111fdfb9bbd2019f0c6b80881c6915b8abfcf27a90d83b3d12), uint256(0x134b2805b5852c2d145aeaaaea694927087b45a708a468a02c9e59b06b832ec5)]);
        vk.delta = Pairing.G2Point([uint256(0x10e66c82556f90357a929b00bc99f05c1946667ebbcf2e84ca5fe50ec776e79c), uint256(0x2b71d14af2ecd0b2485af209a794eb9d1119ecee400b9b0a60b4b352eabf951d)], [uint256(0x20e03bb0ea811c9737cba3b48db91fae5a9d00f321bd893483ee330ac1af3e26), uint256(0x153299980ea3eb0fda11e754bab8883f814d3be2781fa539e806d7361f0921f0)]);
        vk.gamma_abc = new Pairing.G1Point[](4);
        vk.gamma_abc[0] = Pairing.G1Point(uint256(0x20831093feddfee3abc9a72757762e8fd59493fde24951e1c214721c355a5103), uint256(0x1c523464049473618aed4b9634c506c3ee3136af6d912f8f2477cbcd8c088e20));
        vk.gamma_abc[1] = Pairing.G1Point(uint256(0x17e525d8c39d71d0d9c3ba47e911cc9c63edcd36b47298c0aa8f935097b9fd90), uint256(0x2aa3816ce1ad01581f99bf5511427d0feefbcc93617cf761dece4d196a7d7b10));
        vk.gamma_abc[2] = Pairing.G1Point(uint256(0x02a5ca3a4c4ae133d4a3659d09abf55e90f3d700b9db3323453fdd0a92431fd7), uint256(0x24ec733b6d01bd0f4cd29fff45428302d966a458b68396f656be021d26f77eac));
        vk.gamma_abc[3] = Pairing.G1Point(uint256(0x161232b36bd7759b8a95bbbceba654ea66471ad1a216a00e8efecb789812140c), uint256(0x1b60ed81f801f672ac78eb40eb37d8f1ee2c70e287829d3294d5ed8a761f1ccb));
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
        require(input[1] == 0x00c8834c1fcf0df6623fc8c8ed25064a4148d99388, "Proof must come from Holonym Foundation's relayer address"); //Check it comes from the right address (00 preprended so it is treated as uint) 
        require(input[2] == 2, "CountryCode must equal 2 (USA)"); 

        for (uint i = 0; i < 2; i++) {
            input[i] = input_[i];
        }
        return verifyTx(proof, input);
    }
}
