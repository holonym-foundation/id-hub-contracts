// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
pragma solidity ^0.8.0;
import "hardhat/console.sol";
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
        vk.alpha = Pairing.G1Point(uint256(0x174bbef7a23f37033b03dd3f4ae762f07d0b098a9b067067aaadc0a604cfb5ff), uint256(0x0162f481475471c5c161c1a11355554aece1593418b89faa7b2285bbdda57b4b));
        vk.beta = Pairing.G2Point([uint256(0x049e76b223e4739970413e583019d27bdbddd6107cbdc047e8003b62e8762cfa), uint256(0x2c93a9e1ce241c81669620f5afb633ba40e63e3b56697f6f8cd2843354900509)], [uint256(0x067d5c22cb5b31d42aabba329b4a13a09a12663c5d7da3587d5e5b07e5f93fc9), uint256(0x0a671272c65e2a2f2b064879f5f39492edf1aa1fc0b4e74c462bd0a4c34afbe5)]);
        vk.gamma = Pairing.G2Point([uint256(0x1c77d6572af3b243542f6b8302e1fd00d2809f0d3a3bf80f9fbb07e2acfa133d), uint256(0x28202cdcc510078ea074dfc9acbb984d69030f0153eda0f4a46b55328bfae329)], [uint256(0x007fc0ae65c0e4ca31d812ff347d3854907483fca7b0a896dbf25106a6349259), uint256(0x0debf4dd190f58ee9685806b7afdb5b31a2f3a33523c45e171f4e1ec546df50b)]);
        vk.delta = Pairing.G2Point([uint256(0x0737fb7c980ce8edd62089916ee09d818b1a4bbf84722105b0880b801e372ff8), uint256(0x109731794a0126fe298860f027ccf0ff550f695666adc1091ad065c4eb2aac7f)], [uint256(0x2b92484cdb38617b0361f0e515e976a4038f3c4053ba1e6d3105b66fc9e834aa), uint256(0x28464fcb34ad4df4db4dcdb5f5b0b1cbb15b1fef4ad9f04fd8872d1117ce446f)]);
        vk.gamma_abc = new Pairing.G1Point[](4);
        vk.gamma_abc[0] = Pairing.G1Point(uint256(0x1a170f42051870df50455a3a48ae96545fc6ebb25a9fa7f3cbd979c369cb76f0), uint256(0x2d067f80d060c7c2eb1480c343125b3ff38494e59d033a8f42787470ce97c134));
        vk.gamma_abc[1] = Pairing.G1Point(uint256(0x0c859ceb1942ae291af70dd5f389d5f00222d514d233d5d14c6c554333446015), uint256(0x1c546cfeaf9e403a33dfc3868d81468e736a12d038f949a6444963ad9822feef));
        vk.gamma_abc[2] = Pairing.G1Point(uint256(0x00ff92f8942556a7f9def11aa292ba83dd323bce9d46bc945a3dd747721e2ecc), uint256(0x28e87de57d9ee192432ae7c3b53d4a7be1d45c1ca335de86a044c91517e0687a));
        vk.gamma_abc[3] = Pairing.G1Point(uint256(0x175ddfd5e3ccf685feb706756e173175fa270bb3df5c66008f66175dc80e5f62), uint256(0x19f01e0c2fcc9990755a4a729c7f7322bdae62f195c00f1a7979ffc4d8db8757));
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
        for (uint i = 0; i < 3; i++) {
            input[i] = input_[i];
        }
        return verifyTx(proof, input);
    }
}
