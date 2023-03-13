// include "./pointToMsg.circom";
// include "./auditableProof.circom";
include "./eddsaFixedPubkey.circom";
include "./hash.circom";
include "./encryptElGamalFixedPubkey.circom";
// include "../../../node_modules/circomlib/circuits/poseidon.circom";
// include "../../../node_modules/circomlib/circuits/eddsaposeidon.circom";

// This adds post-quantum protection and a centralized node to the encryption to the MPC network. This is one place where centralized server is helpful;
// As a result, if the network is hacked now or quantum-attacked in a few decades, the data is still safe due to this centralized PRF server being necessary but not sufficient to decrypt
// It provides protection against quantum attacks on known encrypted values. A basic implementation does not prevent against quantum attacks from a trusted third-party performing the PRF.
// A decentralized PRF would provide such protection.
// Perhaps better, post-quantum asymmetric encryption could be used within the SNARK to make it noninteractive and weaken the trust assumptions. But for now until that is battle-tested and practical
// to implement within a zkSNARK, we employ the current system:
// a system that this just adds an auxiliary value p to the encrypted message.
// p is generated via a post-quantum PRF on prfSeed. In order to get p, you submit prfSeed and either:
// - a ZKP you know its preimage
// - or proof you're a decryption node (e.g., an authority) 
// Then the PRF network or server will respond with p
// Note that p does *not* enable decryption of the message. It just is one part necessary, so the PRF server / network can't decrypt it unless they
// can decrypt the message.
template DAEncrypt(numMessagesToEncrypt, thirdPartyPubkeyX, thirdPartyPubkeyY, thirdPartyPubkeyX8, thirdPartyPubkeyY8, mpcNetworkPubkeyX, mpcNetworkPubkeyY) {

    //ElGamal encryption parameters:
    signal input encryptToPubkey[2];
    signal input encryptWithNonce[numMessagesToEncrypt];
    signal input messagesAsPoint[numMessagesToEncrypt][2];
    // Encryption output will be the two points c1 and c2 for every message. It has dimensions [numMessagesToEncrypt][2][2]
    // E.g., encryptions[1] will be a 2*2 array representing [c1,c2] where c1 and c2 are the two points that represent an encryption
    signal /*output*/ encryptions[numMessagesToEncrypt][2][2];

    // Give a prfSeed so the authority can generate p, the output of the prf, which should be subtracted from the ciphertext
    signal input prfSeed[numMessagesToEncrypt];
    signal input pAsPoint[numMessagesToEncrypt][2];
    // component fromPoint[numMessagesToEncrypt];
    signal p[numMessagesToEncrypt];
    // p Signatures:
    signal input S[numMessagesToEncrypt];
    signal input R8x[numMessagesToEncrypt];
    signal input R8y[numMessagesToEncrypt];
    component sigVerifiers[numMessagesToEncrypt];
    component hash[numMessagesToEncrypt];
    component pointAdders[numMessagesToEncrypt];
    component encryptors[numMessagesToEncrypt];

    // signal output testOutputDigest[numMessagesToEncrypt];
    signal output testDigest[numMessagesToEncrypt];
    signal output testPrfSeed[numMessagesToEncrypt];
    signal output testPOut[numMessagesToEncrypt];

    // Add p to all messages, after checking p is correct
    for(var i=0; i<numMessagesToEncrypt; i++) {
        // fromPoint[i] = pointToMsg();
        // fromPoint[i].point <== pAsPoint[i];
        p[i] <== pAsPoint[i][0] \ 1024; //Convert from/to point using Koblitz encoding with last 10 bits variable
        // UNCOMMENT
        // sigVerifiers[i] = EdDSAPoseidonVerifier(thirdPartyPubkeyX, thirdPartyPubkeyY, thirdPartyPubkeyX8, thirdPartyPubkeyY8);
        // sigVerifiers[i].enabled <== 1;

        // sigVerifiers[i].R8x <== R8x[i];
        // sigVerifiers[i].R8y <== R8y[i];
        // sigVerifiers[i].S <== S[i];
        hash[i] = Hash(2);
        hash[i].in <== [prfSeed[i], p[i]];
        // sigVerifiers[i].M <== hash[i].out;
        
        pointAdders[i] = BabyAdd();
        pointAdders[i].x1 <== pAsPoint[i][0];
        pointAdders[i].x2 <== messagesAsPoint[i][0];
        pointAdders[i].y1 <== pAsPoint[i][1];
        pointAdders[i].y2 <== messagesAsPoint[i][1];

        encryptors[i] = EncryptElGamal(mpcNetworkPubkeyX, mpcNetworkPubkeyY);
        encryptors[i].y <== encryptWithNonce[i];
        encryptors[i].messageAsPoint <== messagesAsPoint[i];
        // ElGamal encryption values
        encryptions[i] <== [encryptors[i].c1, encryptors[i].c2];




        // Looks like this is different than boundToSeed, but the point it uses is correct:
        testDigest[i] <== hash[i].out;
        testPrfSeed[i] <== prfSeed[i];
        // testPIn[i] <== fromPoint[i].point; //pAsPoint[i];
        testPOut[i] <== p[i];
        // testOutput[i] <== fromPoint[i].out;
    }
}

// MAKE THIS PUBLIC AGAIN
component main /* { public [prfSeed] } */ = DAEncrypt(1, 0x1f30716f68d9e4ab3a5ce72753c0e653960b4431af2b98238006afd373c37738, 0x0f6432b77eede93f3151c49fdc4f4ac2b2025d60d4990dd58118be277f3dfb08, 0x1f74096a505833f9107e424e664a06abf0f5164876ed130025cd5621d956f0e3, 0x29c11883b887723ab734d9fca1923e0e8ce90f7eb7b4c7c6afca9f9dbe6d9bbf, 69, 69);
// GIT DIFF AGAINST PREVIOUS VERSION TO MAKE SURE HAVEN'T COMMENTED OUT ANYTHING IMPORTANT