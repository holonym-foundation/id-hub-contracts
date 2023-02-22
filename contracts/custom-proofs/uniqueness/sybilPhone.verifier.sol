// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
pragma solidity ^0.8.0;
import "../../utils/PairingAndProof.sol";

contract SybilPhoneVerifier {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alpha;
        Pairing.G2Point beta;
        Pairing.G2Point gamma;
        Pairing.G2Point delta;
        Pairing.G1Point[] gamma_abc;
    }
    
    function verifyingKey() pure internal returns (VerifyingKey memory vk) {
        vk.alpha = Pairing.G1Point(uint256(0x2c2b727b768a8895c91379664e1b69876ad191319d9282fc7b4dfe21e09caf9a), uint256(0x005503079385fd682aa44b59fa616dd05afe0241141816697424de12d460c4d1));
        vk.beta = Pairing.G2Point([uint256(0x2bcf7d1b0a3befa60b2adcec45c6a5d4833db1bf36044eeb1a4ad67f6c0a6dc7), uint256(0x0e12b90c0b9501bb4aa0e684fbccfbd6df00b3422f400cc54e467598a723424c)], [uint256(0x1028b41691cdd77e6f3d445bd55c566a595db13b4d452f650191c017afe49358), uint256(0x21f7c488e474a4357793032c4c7930c1a9b76483e61e8863d7fef29341219479)]);
        vk.gamma = Pairing.G2Point([uint256(0x1d1e4079c9e971959f9395defdb8e6d934d2e9692723d9507a2bc58e8d59ecdc), uint256(0x1d5b86743587a9ec62340bd43e164f1f9632a1304dcdf43c83b3b9ae64728b3d)], [uint256(0x0c4494c9655aabc814e7ad3c4c0417f3cae68da2f2d1c69186f61dd9e8f2e24e), uint256(0x1327348474b6729e90fe812e6e6aaab10def9ba1d3b08d33f82c965ce105ded1)]);
        vk.delta = Pairing.G2Point([uint256(0x1f62a84855651907283bd5ffa69432a879432e28b4bed1f8ec11ab5368c6bbb9), uint256(0x07ef50600e9b55108d9585a9480b3c0e4f0fdcc1af1b0480d10e50ee3ac2255a)], [uint256(0x022b0fdde25d5d7cecff4927a82bc9f649ca036fcd498b88bee190bad9d436ce), uint256(0x045307cde2e64e8fb5ce3e4f7244d0b03cf14655bd06d9e71eba7681c14f9773)]);
        vk.gamma_abc = new Pairing.G1Point[](6);
        vk.gamma_abc[0] = Pairing.G1Point(uint256(0x063e77d17192c558c4178e9df0ff6dee5bcac2685e91bd4c2c97deaa5d8b5e3f), uint256(0x1b50dd00c1b39488982c2f640c1d4c281af2d8720823ece92d4e42851c577533));
        vk.gamma_abc[1] = Pairing.G1Point(uint256(0x001a272e7b56147e3465e1d9b9b95aa0b7b757e25dac794d52d6bb8c15867e5d), uint256(0x2cf1321255feec96b035ed1ca1cb07d37f57545c8e49162c8242e73e1bd2012d));
        vk.gamma_abc[2] = Pairing.G1Point(uint256(0x29c38d5c1309bfb0cd7524ffcb08d26610cbc283fa717bba819a8ce149aa8a9f), uint256(0x2da7a30b83eb33f89b070b32d445a482c1bd682809b5cbd59e7288e0b3167d55));
        vk.gamma_abc[3] = Pairing.G1Point(uint256(0x156f1eb2c68239744dee9c5927f796e8fa6349bcf816ef33fa309b15e8a698ed), uint256(0x01aa9255b0d979ad2cfa6f57a3d08962e980b69c9e2eac269e6bdf1f2080eed8));
        vk.gamma_abc[4] = Pairing.G1Point(uint256(0x1fa07afbb04add7256a5d650ce79a50d166d5270a8bdc4f1483b62d0e845884a), uint256(0x18fc5df8c52b7c4cd0f1e6b6b173448463d60cf8b8b0f4e545ab96d2127e7f18));
        vk.gamma_abc[5] = Pairing.G1Point(uint256(0x0c1347aa262985afee339ddab483e3df14bef4a8591ecfe6762ea3009768a699), uint256(0x265d56e8e32d7358ee845e69d21db78864533317b0168eba1705a10efdac4a41));
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
            Proof memory proof, uint[5] memory input
        ) public view returns (bool r) {
        uint[] memory inputValues = new uint[](5);
        
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
