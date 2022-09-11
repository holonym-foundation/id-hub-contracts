// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
pragma solidity ^0.8.0;
import "./PairingAndProof.sol";
import "hardhat/console.sol";

contract AssertLeafContainsCredsVerifier {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alpha;
        Pairing.G2Point beta;
        Pairing.G2Point gamma;
        Pairing.G2Point delta;
        Pairing.G1Point[] gamma_abc;
    }
    
    function verifyingKey() pure internal returns (VerifyingKey memory vk) {
        vk.alpha = Pairing.G1Point(uint256(0x24bca780ec43f1b827eaf5728ee446bb3105141687586b5bbf6f4d391c475b3e), uint256(0x130b8a4af50a00fb87696ebfa4d1a2c9efb72adc524fb6bc06a67956413e5ae0));
        vk.beta = Pairing.G2Point([uint256(0x0dd1384427db72433ac571e89dc2416ed10af758b16415a8315704c0ad724e62), uint256(0x0e1ffee34a5ff3a9b9ec501fc2d3e5f7a41b92e9fc65c8ce4fbf8156d3f89dec)], [uint256(0x0705f0fd0b3ec5c087d09fec972f24ae2b793affa747612dd2512a5e11c1aac4), uint256(0x0a932e33b2d4eb92cfa023d23bf334309be5f5e93e3edd158242be577bf31282)]);
        vk.gamma = Pairing.G2Point([uint256(0x0d08e1f83b67a25088500ceca862738f47c953a2bbf3081dd9a20361d8852f5b), uint256(0x0a113c31f7aa5c06523d751cec72b25f75c77cf9bcdb9b502b280ead507f2447)], [uint256(0x304527f36241ef458ee1667cffc95761a913a49e41529c405bac7407b9949040), uint256(0x224df8dfca1c19b7a3f3efeea4c5f313098a94ebf649ab9d245ff263b55c55b5)]);
        vk.delta = Pairing.G2Point([uint256(0x05c85a892e1bdcf4b595ba283c2310152044b252deb97ad7262b774be23e2e36), uint256(0x2d483ca1a661d1802967aa6b0b774362399789186d1620bd828172196ae6e8fa)], [uint256(0x2ed4337525aaa33051be7ae87d295a738a0b5f5165c2d1f6a657852010941954), uint256(0x22ea92ad95d7957c55ce9b4739306bf4960b2dd7ce5dac3182476ad9ec05e9d9)]);
        vk.gamma_abc = new Pairing.G1Point[](26);
        vk.gamma_abc[0] = Pairing.G1Point(uint256(0x134ed80101f152929d1a3cce7f271133a76c5bb7ffd103e0bfd1879eefb8d427), uint256(0x00b99873eb17f29f5b114a1262c6f1770ab74e6f181bdbd235a37da356ffedc8));
        vk.gamma_abc[1] = Pairing.G1Point(uint256(0x229fd56f4f3cb0a69cfee80b1e4a9547a574a7c8f9347bc818e076615915b962), uint256(0x0e826bce914b81f18a4cfbf765b860173178d31704679f6ef6d5d0454117b6fc));
        vk.gamma_abc[2] = Pairing.G1Point(uint256(0x151659a39e951f35f01b3a3f47995f394a3a1a87e45f1847b8282d3654d31dfd), uint256(0x23cc64fd2eecd550cf8907a633699a3a91ba1e63d5a4e0c0b52eaf80ffbc1fb0));
        vk.gamma_abc[3] = Pairing.G1Point(uint256(0x08d6124d6a6760a553e73673b1e79905f2f3e75b696e7400c11533927602e007), uint256(0x1cfa17e8982b0b136624d3ef388796a408ab44e5a9d62f32ba4c58b45b3bbdcf));
        vk.gamma_abc[4] = Pairing.G1Point(uint256(0x21676b983bac56e55bf827b5c9f30e4f0fb2b387f429a25cebe7181c5b1917d1), uint256(0x0cfd95e9b73bc5fdf64a6131f57d3e38e6b9a80d1eadf0fe074a4364032298ea));
        vk.gamma_abc[5] = Pairing.G1Point(uint256(0x2d878bd01632d06f2a2012a60ade4ab3dc57fb9530082a00e152c971f2b95ab2), uint256(0x07c703965ca45661f715cde11958f84365c8aa3f1687e70a14fe8f34b6cc83fa));
        vk.gamma_abc[6] = Pairing.G1Point(uint256(0x02e22d0c420e7191014e87c3f0504b8b5768b7732d3a0cc737c3f6291f57517d), uint256(0x297d266500368c3eb8d5d31d92143733220fd8895859d756dabf684ac3a22210));
        vk.gamma_abc[7] = Pairing.G1Point(uint256(0x081e9af4f4d0b9b71fd1d59046461b52ce3669cbbb3d911607eb8e6c46593cb2), uint256(0x14264255220fa72b25b2d248a84b38165aa7ed0fd1bda38e99edac92463fbdfd));
        vk.gamma_abc[8] = Pairing.G1Point(uint256(0x20c4d67cc2bdeecd7ff6ba62d8f61beccb95d748ab5cc48b9ce52ba1bce0e21a), uint256(0x00c2970300327940a20b38e473609737a8032ea6a6901fa6ae47a4b1b828d57e));
        vk.gamma_abc[9] = Pairing.G1Point(uint256(0x18f7362c99fc4bea28e91c5d9b0d0e1d1a5dfd9b78ed9d2041e5e11d53c8f79d), uint256(0x234fffa92b7d017ca1fd07197e496c36097dbdb7d7f10cd8c6beda565c8a0f4e));
        vk.gamma_abc[10] = Pairing.G1Point(uint256(0x0a3c79e58fe0b1b12bd2dea627e9549136d679730e8c44c672392dd984ecd179), uint256(0x1a2ef3a881d2730b2c6f0a6f225e60a25c8f868b9b396f215c937a663d819906));
        vk.gamma_abc[11] = Pairing.G1Point(uint256(0x0ea3c3699d9e9417d548c925d30fcb0c70894e6e7ef885b670edbf9517b77537), uint256(0x1c98c4df3ff90fd06889382cf522a4297c5267d95c45c9323dfaecbbf3eee591));
        vk.gamma_abc[12] = Pairing.G1Point(uint256(0x09640a59e4e32cb3de471df84b388378a4eb68a2be17dc1a2507ace3f6d5c7c1), uint256(0x16f939a6af344abc0f971a0984e09fac9d74c078721c6c88e5bfd41b91223d9a));
        vk.gamma_abc[13] = Pairing.G1Point(uint256(0x048c2c7de36b062832a91d45f229aa56e5872f357fe28d46ed7305e1ff10d305), uint256(0x04bc97fe80e1e2c65bcfa9cdde686ebf57be2111284ac56493bc4e79523a37ac));
        vk.gamma_abc[14] = Pairing.G1Point(uint256(0x10535298777a5b8964a16bc245be0865509c468f956d139c6fb4eaef50453a33), uint256(0x0daf5bbe85db6b3a0331f6569a0492d189b50ca099fad0938f211e441258fd88));
        vk.gamma_abc[15] = Pairing.G1Point(uint256(0x2c3df46d5e04555c89f5da6010b102fc0465056f89d5a96499232c8af1ae4289), uint256(0x281887befe2185abdec9d57a32387000cb5c223bba8f8a743240ca51539b7d0c));
        vk.gamma_abc[16] = Pairing.G1Point(uint256(0x0d62ca5ee093656d002e8784cccb4a2df1db0e09cfd0e11555a663c9f30876a5), uint256(0x121b7d23e0689939a953412f33d6699f0f96e77208fcf8c71e581fd9b4631ca2));
        vk.gamma_abc[17] = Pairing.G1Point(uint256(0x2f0f1528019463b4045371473ff30af6e2060ee4e52e00bb18bccbc28cc0b579), uint256(0x272b6d6cb9a35b4e68f91f49d4882503d863b27811fc61280157e0126b8ed10f));
        vk.gamma_abc[18] = Pairing.G1Point(uint256(0x11fed393625d21157a301f244eba35b123d5cd2681df8f1063f89490e5b59574), uint256(0x00c83f1e300766740633550af6dcc9e2aa272b186be4e627036c0c2a178a7014));
        vk.gamma_abc[19] = Pairing.G1Point(uint256(0x0b391616b73f436e9832c93023b2e14c888a47f1ad20b380be470ee9e43549ef), uint256(0x13054673e3ad78a0ac2f82e9573d64148e47e897a5b1bac4d45dd70a1be7b36b));
        vk.gamma_abc[20] = Pairing.G1Point(uint256(0x18990f0411ff80ef8d5715346ada94e45170661eaea1b2e7c5391371f6012062), uint256(0x3034f2462e8a0fc03289a2f8dd2eda9ffd2f495543523d603635f00f41127a7b));
        vk.gamma_abc[21] = Pairing.G1Point(uint256(0x1352ddd4eb188d9eeaddc9101b05b3e44b2d0e0f88c2c79bacb8bb15c1e592aa), uint256(0x0ec7bd97fcbe2b5fe3689e70f9d710c2a86c90e522e002c3cc558c1b5302e33a));
        vk.gamma_abc[22] = Pairing.G1Point(uint256(0x0a245412999e1add243b6c9cda042a09978696b630cc6312df957f09c41be0a1), uint256(0x2cc94d3f07038775470b74becbf9cedc06b150bc27b3d85e23681282dcf9eb80));
        vk.gamma_abc[23] = Pairing.G1Point(uint256(0x264636c3503a38f02ce8221f1c50a7e4ad6dc4090412b6a0a5e33fbf4306d1f0), uint256(0x0b2a0bd8760f22e58c577ee7f440857fa70ec6e7f86d687354c60c67473a6189));
        vk.gamma_abc[24] = Pairing.G1Point(uint256(0x16ba4bf100b83c671845a94dfb97e0357025c09a369047660b5558a0b93ecd6f), uint256(0x087b038c6ff00f6ae04665d02c208307c36cc3d29a1c4ef4ea4a1dcbd242aaaf));
        vk.gamma_abc[25] = Pairing.G1Point(uint256(0x0cc77e47760d50d72b814d1b19e7e446be49ec3ea8ce32974b96184fa86e94f7), uint256(0x165e506a9a433d35bf40f1ea9681cb0d096e622514bb458fc20fbb8275437ca5));
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
            Proof memory proof, uint[25] memory input
        ) public view returns (bool r) {
        uint[] memory inputValues = new uint[](25);
        
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
        uint[25] memory input;
        for (uint i = 0; i < 25; i++) {
            input[i] = input_[i];
        }
        return verifyTx(proof, input);
    }
}
