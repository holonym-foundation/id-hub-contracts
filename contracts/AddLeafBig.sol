// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
pragma solidity ^0.8.0;
import "./PairingAndProof.sol";
contract AddLeafBig {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alpha;
        Pairing.G2Point beta;
        Pairing.G2Point gamma;
        Pairing.G2Point delta;
        Pairing.G1Point[] gamma_abc;
    }
    function verifyingKey() pure internal returns (VerifyingKey memory vk) {
        vk.alpha = Pairing.G1Point(uint256(0x07cfa603bd6141fe26cc32c60a2526305ee1316902806ddffd1bc3f80e4c841a), uint256(0x2116003ed77cfa8a89c157542dce881990096102a1a31d024edcfaa0af4f26fe));
        vk.beta = Pairing.G2Point([uint256(0x26159c93eab75a858d7a030e916a27681953a4a808610834dec2ac213d738cad), uint256(0x2bfe6f19134a077dd8b8fa1d5891062c7b743d6fdef6ff6985e722f81e1265ad)], [uint256(0x1d3fe0902afcc25421e56fa344869d55c41e39896dc412d90494b239d7f3e98e), uint256(0x2ee0d188f280f0122b52c4d4ad794106272f431bb6bb0796d295be5623dc2cd4)]);
        vk.gamma = Pairing.G2Point([uint256(0x06d7355bbfee5ef500d0fe544198c338d187bc61c3791977d09ff9bcde448411), uint256(0x1afcab3ac7c221b3c0ff2fafc116bfe24e22adf48ccc379314e5df3cdce9a50e)], [uint256(0x26895fff2ed8ef83f6945a0ce48b71bc2032124bcb37d03c43af3a706ae8625c), uint256(0x25039e1b9679c2e63f89e4e687d5d4f1e7d9ba902ce9e50c18a99adf9ee73fbe)]);
        vk.delta = Pairing.G2Point([uint256(0x201656780adc9e835eaab6c18c430ef48862ea7d05d712a132b83b92d5945803), uint256(0x08ec55c1d58aff764e98fa21c435f5762d8058bc2894a2c6c89db2f08682345c)], [uint256(0x1e8c6c8826fc51940cdc3f88d278905509437214e91365c6ab574e07ec703c31), uint256(0x2b7a9abdc49abdd7b6076aac7b2b9fd9e9c7cbc1670f96ab4a45ee760f3904c3)]);
        vk.gamma_abc = new Pairing.G1Point[](22);
        vk.gamma_abc[0] = Pairing.G1Point(uint256(0x06e2490f32a3e39c93c52702e2369a76cc94e6f2e2831254fa71d069e2ad9997), uint256(0x01a4b181a5bffdbdd7c1e31a70bd78745f7839a6c456826728cb294ab0629c6a));
        vk.gamma_abc[1] = Pairing.G1Point(uint256(0x19af63df3bec2ef22258f678ad9b676ac0750b987ecf158d5e734d3e722f31cf), uint256(0x16de00b1b72deb248a7f4fd2cd3e4db10a1a31a21f33898a081230e0140e4884));
        vk.gamma_abc[2] = Pairing.G1Point(uint256(0x2490576dd6de052dd249a80677d20292599267a86f0b7d17c41d3961f27b7de8), uint256(0x23c754537b62f70fa01c798d20e7e1a868e5111f69c40b1d053274d80f4d559e));
        vk.gamma_abc[3] = Pairing.G1Point(uint256(0x0e456e6dfb6de26a0272b8df96ff432674ef307f76f18053df4621c17c2c2c5b), uint256(0x0d605ccf1b2688ae19a625106affb35f8270ecce75cc928b958d7dcfadbe411f));
        vk.gamma_abc[4] = Pairing.G1Point(uint256(0x1af8e3a32098f2d30a7eb645ce9ac05080f63150fd8069e04850db5391148756), uint256(0x1ae985de9d21677f84554cf272b3a6ccd5f1eeced6bd54e611ea740b0fa560dd));
        vk.gamma_abc[5] = Pairing.G1Point(uint256(0x1b48b7235dcc82d86cf4d9fb0cc14bca6c7c075c1cf7bfd9e4a8505a5e6530be), uint256(0x15d6de12a1e87ed388a2c9e8d57a205fb60ce032daee474eec60b25f30aaf663));
        vk.gamma_abc[6] = Pairing.G1Point(uint256(0x19a7f7c12d0bdaf5649d659b5b536e751d751e810d9798897910c71f51bd0fa5), uint256(0x003bb5685be5999afddc19371ff886f85bf2afe08f5f801617326ea802c713b3));
        vk.gamma_abc[7] = Pairing.G1Point(uint256(0x1ff64c90e504b5b496debd9b8e44d50cc67f9d7801a263fde20e384171c53417), uint256(0x02e1284887c7f4bad745ba0a7d07dc2aa1a62345f45eaac4bab97b2b7cdbc23f));
        vk.gamma_abc[8] = Pairing.G1Point(uint256(0x05d5e5683fb1a791cd493aef14a773bce81183221230bd860c73ea386054f50e), uint256(0x0519033bff21c2935a13c30fdaf1684d8a70897ca401d78767924d5274f55134));
        vk.gamma_abc[9] = Pairing.G1Point(uint256(0x017377d6c227abc662c03686803d401759ca7fd4d123f4440787f0354ccbf257), uint256(0x0f01ba877346284102db4f6d30c3f65a5c57b17985c48a7b3cd77edf2e547c76));
        vk.gamma_abc[10] = Pairing.G1Point(uint256(0x20e4a5b7d89eb23a0a88289fc02fe0eb5166afa5517ae26a424986f3bb626724), uint256(0x2f95b13d66dd4125adac74a154e6748e365e99a0266a4ade5ed7ed2167f76707));
        vk.gamma_abc[11] = Pairing.G1Point(uint256(0x1107458663d52c578825daf478c132ed5a63b0023916bbcda29ff095c2196b6c), uint256(0x2a426ceae4dded03d24ec2b635bca506b0355bb918ba7798131ea012b7bc9aac));
        vk.gamma_abc[12] = Pairing.G1Point(uint256(0x091b5524725376fef4718873424df555107059546daf81a576d5feff5415a6c6), uint256(0x111e1196bf9bab1250ad53c630ea604103b04b5142acc0365971e2d256144259));
        vk.gamma_abc[13] = Pairing.G1Point(uint256(0x27e34b06d0254c4c7cc6004d292865621d240e08746743b110a9f4d1c6a6d8cc), uint256(0x1ba0f87a1c9ee9865692763b1238553218a0bb62461a12447fa2ba46c68ef020));
        vk.gamma_abc[14] = Pairing.G1Point(uint256(0x241107df0658adf300fabb0a6da899f7b19f009ccb4ef1790f8eeac1cc4a7f1d), uint256(0x11cdd9ab5ea878ca124ada0ceb334557cd71c1802903fe3d50758db24ac43a12));
        vk.gamma_abc[15] = Pairing.G1Point(uint256(0x0ae6669f0385caedf48604f384c376253d1afd9491d27d2ec4c531790a2ec5aa), uint256(0x0c9334d63f46b8461d2cadc035a6a001b95da0e4376b48805f9f870c70ec3861));
        vk.gamma_abc[16] = Pairing.G1Point(uint256(0x1199ca6ec34326b1c4dd0daf2d024c7852e033f041494490330f7a793e28641d), uint256(0x0bef8a45894fdbcbe73e391e14a91b4a828accd0ab5b2a1b85cbb51b3ee5b770));
        vk.gamma_abc[17] = Pairing.G1Point(uint256(0x1271023c00b2904f9715173933099a34f9a3c7bd6f1fd30b88572e29d75d6893), uint256(0x1c3eb7c8c5b6eca1c400a37a7988600f04f9440e3971d1e824cb2363de552b69));
        vk.gamma_abc[18] = Pairing.G1Point(uint256(0x035ce2a5ad1d062e5291f9e183e6cf4752313661fdd3f341ae42a2707539eebd), uint256(0x2fe1c7035e957d607eee11425bc50d61bd915ff69448ae647964ee246b4b98da));
        vk.gamma_abc[19] = Pairing.G1Point(uint256(0x27f7c7e5c55d017d1c4a0f22cf300a04dda1f548d33d33d48fa93ac531d9ec4a), uint256(0x22b870cecbd749f145a9e857c99761cb7d048553c7a528038b61982474130a18));
        vk.gamma_abc[20] = Pairing.G1Point(uint256(0x001bd3705ebc5044c703a7b3bb8d0bde74064f699fc67822812093cfd7849fd6), uint256(0x05e2fbf4427af633c8d7f4e4311b52377c0e210381e02a18a9b29377d583885d));
        vk.gamma_abc[21] = Pairing.G1Point(uint256(0x14d53b0a977b8a903b7b1c023085328b0b23cff3b29e5ee5802e4a24f9e64128), uint256(0x2fb3d871462d433e0c7d06ac24e3f700078d55b02ec98e3f0cade960a5f0c787));
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
