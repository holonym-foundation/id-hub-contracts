// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
pragma solidity ^0.8.0;
import "./PairingAndProof.sol";
contract AssertLeafFromAddressVerifier {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alpha;
        Pairing.G2Point beta;
        Pairing.G2Point gamma;
        Pairing.G2Point delta;
        Pairing.G1Point[] gamma_abc;
    }
    function verifyingKey() pure internal returns (VerifyingKey memory vk) {
        vk.alpha = Pairing.G1Point(uint256(0x1fb074a1771bad132dc377ddecd7e4368b3dd96f2f289b581e9f3c163ef2ff40), uint256(0x25d924ee857888587a07efcad70e1c19186e3c58f29363b058606920d3b0a990));
        vk.beta = Pairing.G2Point([uint256(0x29bff5f0c35495719f5cb9c630fbaf5d7de78e37c7b1f6ef7b558fba9aef8d0d), uint256(0x0dd77a9d5996fc0ce097f084fedfba55a6461eb7804a5d0337ba94d6897beb0f)], [uint256(0x226c81c51a2a1d19f8ea889c3e7cded010e4e20c2249f7c454eb139bce5300af), uint256(0x0a3797690713ea4269e24fe57805a1bf3745b7584126b6d268123be712a235b6)]);
        vk.gamma = Pairing.G2Point([uint256(0x01dddeb5f983615ddd4f624de5c5be55525b869c2218bdb8c95e39c70c0f653e), uint256(0x0a3bc990e194f734483521d1349217375fb15ce8d1608528fb184b1592039c95)], [uint256(0x22cf139dfb7280f99e4b78e2f5b1ede648a8f7b900de6df74031e10a3501eaf0), uint256(0x175cb1a8ab95d4b6eadc635ce01183768f958e42a62eabbc86438eec6fd9354c)]);
        vk.delta = Pairing.G2Point([uint256(0x09234fb60407bbf7e2409f361a0336dd3d4451230a06d2946d9c9511ccbbcdb2), uint256(0x1e7784f80b2e0181b2492cfcb536755f95cebb4614d9c8423b8676256a67a47d)], [uint256(0x08d7d255d098864808fea99530fcbb6baed084acdf2de223e636ef341e10308f), uint256(0x186456d7d088079b56e63ea8b68bf099ec47e3384d9980233a20a0d037f4f61b)]);
        vk.gamma_abc = new Pairing.G1Point[](14);
        vk.gamma_abc[0] = Pairing.G1Point(uint256(0x05b2d1e65852aaa91619f6573605f3ae9935e8d2dc2202c53885b14af99ae018), uint256(0x1685830b57b58cae1ea29930553374ccf3cc28f15ffc774920c95f51a49a2911));
        vk.gamma_abc[1] = Pairing.G1Point(uint256(0x1921fa69037b54e35221a5a6880f0ddd427486fd46cba619c43774a93dbca101), uint256(0x13b25ca2ec46873b9ebded0a707aa927114af3d5d2ec3e3f643835f866ed489d));
        vk.gamma_abc[2] = Pairing.G1Point(uint256(0x1147b8fa419fbd044c0abc1b450db00bac5b06e0bb286b1db761a5556a5c3864), uint256(0x11686485fc155383f2525bd850a5a8ee6fa541d7e8ada0e8ca394c2b56b3f6be));
        vk.gamma_abc[3] = Pairing.G1Point(uint256(0x187540785a351af160087aec8b2257e529cda032c489663748a78cd3edf67db2), uint256(0x2243981b7e39f345d62bb70ba7fb09f790d62003d6b0b4d56e0beb78690430b5));
        vk.gamma_abc[4] = Pairing.G1Point(uint256(0x233d90d70b7507907cba10b9a5360bb4d07d53b69970291dddfb127f96d15538), uint256(0x2d08659cb64b9a5227de63bfd347c9bf214333e0df656e51f32de1c28a5ad993));
        vk.gamma_abc[5] = Pairing.G1Point(uint256(0x19bfb4b55a3aeaf256b82e71bc8a39076248b5ab4aa6242d10cf5cb92d06771b), uint256(0x08cd1d014c839eefb3faaf29d9fadbc5f4f686f98ea13ccb66d1629133690ce8));
        vk.gamma_abc[6] = Pairing.G1Point(uint256(0x2af54f00a4afa35d389fc0f324f103aa9a38d021e65ebf672d905e411bc3709f), uint256(0x23807856370d09698a6abc30ad34ad22e90299475c78d49d17d40135488829ea));
        vk.gamma_abc[7] = Pairing.G1Point(uint256(0x056f66f5e5bfa3414b189c0767b087857c3d6ace49b522a48abaa367f389115b), uint256(0x14471bde38d70ae01c80f07563829cc998b1b4389cbc7cd3b25a7d04a53a8cb2));
        vk.gamma_abc[8] = Pairing.G1Point(uint256(0x0d292b709b241fa84fcb02561bb40b27ebabe32547bbb08627134332b31c1bf8), uint256(0x1aec7a3eda3ae43e893fedfe3cb08b1aa2b52a4ac69194068542b03f5cb9734a));
        vk.gamma_abc[9] = Pairing.G1Point(uint256(0x00333c886193c5271cfec9d5f3ebd1546fc55c7c2b4c81f162b0e87db682fbe0), uint256(0x16067d4fd364b6bec9432f5b8c598718fc4bbb1bb4f6621e520f91e36971fb69));
        vk.gamma_abc[10] = Pairing.G1Point(uint256(0x2213f5a295edea12a1d4c366d1e04a90aaa3f4b9d9ba4833b2b9a7bb131b9d63), uint256(0x0112d90020ab150cab17bce22cd1b2e0e190456fb24a37dcbdf77b6c0fd888c6));
        vk.gamma_abc[11] = Pairing.G1Point(uint256(0x20beb6ac7455701a2a9c6574067606c52751c8b7829e6bfc073285dd31b4733f), uint256(0x0d4eba0cdee4e59342b72b4300d8fc135ba5266ab9391fef36c2eebcd25168da));
        vk.gamma_abc[12] = Pairing.G1Point(uint256(0x157a815c89d93f59dd10792cb1ae00529e0f8aa3f22e252f934c12791efff6ef), uint256(0x01845b293b0508435d32c3a88d66affe464ff8f971c058fdd2fcaf8f59c1666d));
        vk.gamma_abc[13] = Pairing.G1Point(uint256(0x29b878310b32942997b1fb5400bad6c498af460bd30795d2b11c38eee6af7c57), uint256(0x14f99b4ccfe38519e6d8ccfcb21b7477675d0c41bafd36800e5251ae33f44b95));
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
            Proof memory proof, uint[13] memory input
        ) public view returns (bool r) {
        uint[] memory inputValues = new uint[](13);
        
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
