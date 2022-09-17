// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
pragma solidity ^0.8.0;
import "./PairingAndProof.sol";
contract AddLeafSmall {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alpha;
        Pairing.G2Point beta;
        Pairing.G2Point gamma;
        Pairing.G2Point delta;
        Pairing.G1Point[] gamma_abc;
    }
    
    function verifyingKey() pure internal returns (VerifyingKey memory vk) {
        vk.alpha = Pairing.G1Point(uint256(0x29e437c419a9349100fc1ac6373aa30e3c492b849d3c40373b432b2a7ca19384), uint256(0x2fdffb50baffbaad018687e5bf6476a1d5c840942979b54ecc1b3b6bd05bd71b));
        vk.beta = Pairing.G2Point([uint256(0x05f11817eefbeac48cc67413604e1947f37e80ef2943a1ac0dc68a4b8889b225), uint256(0x2232ea7809604f1b2630cdd49d8c24db9ee2e947845159f9fefc55216b69b884)], [uint256(0x23effb9d67ba9ae10e5265be6c88b5ced9ac835c3adc0ca1bd8f89dc25ebb2f2), uint256(0x240a5e5842c37b5c076f51001db44f67ae3e152914931acc9e48fd9db1add7d7)]);
        vk.gamma = Pairing.G2Point([uint256(0x15d41b342f87f08d51dec95c2e7e7093f9259eee21f52a73f362f1b0b8b538c2), uint256(0x0bb6873fe0789ec17b151208e8e38fb4a9613a8a956e440aabe1bfd4317abdf1)], [uint256(0x1626b4cc7200492c5125cf9c141107ac64e8eec73c066fbe8489cbe1a39ea91f), uint256(0x0618ed132a5f3fcd4d6322f5db27b24e50114390c544db0c017119f3a4a0f496)]);
        vk.delta = Pairing.G2Point([uint256(0x1120ca3904ba557eef47c907d5ca6f99afe5d1cc262aba4bccdf3bbed36ce4ea), uint256(0x2098f67de7b0cce6170c1f748af95e3d5fc589862e5305d16a628152d497d19b)], [uint256(0x03cadc7a2ec6c8bb7f20b581b8e6aea678e126e8df6559d6603fde181d574437), uint256(0x22312e2759bf03145977b259d3794127de98f6b42cf07a00d0bafa9c56ea1ac8)]);
        vk.gamma_abc = new Pairing.G1Point[](22);
        vk.gamma_abc[0] = Pairing.G1Point(uint256(0x0d2f81394a84636bd29a2483e234b17d41f907d5084818f77c1365f101552497), uint256(0x1a32dba6d73f73c735c8fc6e6056a4c5cfc57cfaca1b90e79627e04a1dc9c9e8));
        vk.gamma_abc[1] = Pairing.G1Point(uint256(0x21c97c0ca795f9b98836236073907d05694785fcb318502159378b6c868ea890), uint256(0x23601b5fdfb9331b023c8cbea034790aea02cba495ac9ce27b04f08353aa45f2));
        vk.gamma_abc[2] = Pairing.G1Point(uint256(0x0526ef3537019c75ced6fc50b34ab028c352f0acc74a6f11f9f3c21444a2266c), uint256(0x2e62901fc43fb7425cc651327810140e31d5e5467471e7e758daedf1777f898a));
        vk.gamma_abc[3] = Pairing.G1Point(uint256(0x2189b45cd2c2e6876bbc6da62e793a7def1ecd21a9ce34944ce0f53a528f4013), uint256(0x271ed190873918783fd9f4aa74f7f22a0197808792b0da4db2dcc911aa2476e3));
        vk.gamma_abc[4] = Pairing.G1Point(uint256(0x0c163a4305942720b5e7f19199e82b46412877761c0a1185e4f07a71abfbb819), uint256(0x2ee19453f582e9b1e5da6b814e3725368f869f584d38a0266b53f1acf87d0ac2));
        vk.gamma_abc[5] = Pairing.G1Point(uint256(0x1731bf85d9a4183b03b3bb9af4fdc4fa4f9650eb94d65026750f6162967f108e), uint256(0x099bce19c84775c350ad8a1bcd53f440001bc02da2a80037b205ae4937698f45));
        vk.gamma_abc[6] = Pairing.G1Point(uint256(0x1112e9d1e10f9a1ba3b98c862b264740558ae588bd944b114081930c7f26220a), uint256(0x1ebf5fe8b704b23dccfeae8aeb9e5977051ded90131990657040622b644059eb));
        vk.gamma_abc[7] = Pairing.G1Point(uint256(0x1ea8576573c0ee154af3efc45f1935f5f288f4574bdbb98c5954d39a16c10610), uint256(0x18763479ec6a9d5786f699691f76187345744dd4ebcee703a01d03af8d9dd4b4));
        vk.gamma_abc[8] = Pairing.G1Point(uint256(0x10d294d91239c6bb91ad313297ff81141eaafcdba3a8a3735a865c24310bb92a), uint256(0x1628a85adfb0e96970929aafa1a3fabbe6f44760f569b17c330582708a9b1558));
        vk.gamma_abc[9] = Pairing.G1Point(uint256(0x1570aabac28e32c04311b5ce7fc11505d324c1c0f0c05d94e10f68563011c90a), uint256(0x21a1387fe7227dba3172c2abd9ad3a033f0c62bb68f7098298e4d9ffa097d340));
        vk.gamma_abc[10] = Pairing.G1Point(uint256(0x05dba890e584578bdc741fdc5dae16f9aae07c4aaac36b69b689d55632338c33), uint256(0x11aa54352e2cdee2014e2b5201a41dd2d3a3cc4cfdda9d2fa376afecd58008fb));
        vk.gamma_abc[11] = Pairing.G1Point(uint256(0x1646945dfd05ed2200ec31a27d313ae1bd8884530a3aa98d94876ece3d8e1884), uint256(0x125f39838f9b7b5327629b23f788704b0922d8b2cf065d425ca1f066b24961e1));
        vk.gamma_abc[12] = Pairing.G1Point(uint256(0x2c3ec82dbe7638468b11955b2b33168f92d1b9d1350a27734e255646684591d6), uint256(0x1f9dec0405324bbe9f1049c66c44e08d10ed58da77fe9b533d91f4cf4822549a));
        vk.gamma_abc[13] = Pairing.G1Point(uint256(0x046845fde692b3371527adac41ff366481d22575fb6e88607e11be1768a79a51), uint256(0x0c5a3b51230338c90c333f60e30ef3c9e56d5d4280f82eab36222a93255ecf63));
        vk.gamma_abc[14] = Pairing.G1Point(uint256(0x21b12aa42f0fd92f0eff9a8e10198798b1a815a4e3df755403783a4df44642a4), uint256(0x02f643434b83516a1baf666e11092b48227b60f63696f64805b43dec8451d0b9));
        vk.gamma_abc[15] = Pairing.G1Point(uint256(0x1b139c62d1ad02e1c192443a4246ec32d7a2b09307d744e2b53d8d1d8cc3fd44), uint256(0x2786d1425fededea42cd69fdd1d0ab38095e03fbf754ff2a73a7577bd0385a1d));
        vk.gamma_abc[16] = Pairing.G1Point(uint256(0x07acfc08f3b917cc53e63ad954f88be30a06e60e620c2718397dcc808f5a9897), uint256(0x301cac63e81044b01ee73c5be956e2b304fb12bbad83883f7605f3a8e7415e08));
        vk.gamma_abc[17] = Pairing.G1Point(uint256(0x2dc72c1735145de2e4f50490acc411acc3ee84d404813bf39ff3ebfbf6a737a4), uint256(0x2ae449e89ad0fc7618746dbda4c3a14dd44a3c9c2bb666b3257bca59b4bb2e04));
        vk.gamma_abc[18] = Pairing.G1Point(uint256(0x06ab66c362c5c6e7cdb8a148cf9cd20d51c1c4136e30034b1c14c7af30d613a6), uint256(0x1a249dfb9914de92043e84787c5417e1c4c938ae3243d757564b9baf2d48ad57));
        vk.gamma_abc[19] = Pairing.G1Point(uint256(0x169fd0b9c19a1b4dda0e4780d1f1bb80299e0142e2704e782bd4ecd128f2695e), uint256(0x2237d8ee46dbfefc42621c01e67106e1599b15e7780d3a762dcb58989c1728e0));
        vk.gamma_abc[20] = Pairing.G1Point(uint256(0x24e6b0b8be0423ebe8899554c022d754ab28e5959d9e36befecd58444fc90050), uint256(0x29f5712839f537453132d4a10c18180600a53c434ea8fa44a7dd430384c63ae5));
        vk.gamma_abc[21] = Pairing.G1Point(uint256(0x1ba1836b8a224ab94c7402cccc41e5834f91f2f5a9c17ce49f873d1427a9490a), uint256(0x2a35aac37d5954c1b4ab3ab9c4a39da8e3a72af67b5f75c30c1f7e4b02203123));
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
            Proof memory proof, uint[21] memory input
        ) public view returns (bool r) {
        uint[] memory inputValues = new uint[](21);
        
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
