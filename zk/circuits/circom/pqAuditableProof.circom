include "./pointToMsg.circom";
include "./auditableProof.circom";
include "../../../node_modules/circomlib/circuits/poseidon.circom";
include "../../../node_modules/circomlib/circuits/eddsaposeidon.circom";

// This adds post-quantum protection to audit layer encryptions. 
// It provides protection against quantum attacks on on-chain encrypted values. A basic implementation does not prevent against quantum attacks from a trusted third-party performing the PRF.
// A decentralized PRF would provide such protection.
// Even better, post-quantum encryption could be used within the SNARK to make it noninteractive and weaken the trust assumptions. But for now, we employ
// a system that this just adds an auxiliary value p to the encrypted message.
// p is generated via a post-quantum PRF on prfSeed. In order to get p, you submit prfSeed and either:
// - a ZKP you know its preimage
// - or proof you're a decryption node (e.g., a signature from the decryption node) 
// Then the PRF network or server will respond with p
// Note that p does *not* enable decryption of the message. It just is one part necessary, so the PRF server / network can't decrypt it unless they
// can decrypt the message, e.g. by a quantum attack. Thus we should either decentralize the PRF server or switch to quantum-safe encryption instead of adding p to avoid thes issues   
template AuditableProofPQHack(numMessagesToEncrypt, thirdPartyPubkeyX, thirdPartyPubkeyY) {
    // Merkle Tree properties
    var depth = 14;
    var arity = 5;
    
    // Merkle leaf:
    signal input leaf;

    // Merkle path sibling nodes
    signal input siblings[depth][arity];

    // Merkle path indices within sibling groups
    signal input pathIndices[depth];
    
    //ElGamal encryption parameters:
    signal input encryptToPubkey[2];
    signal input encryptWithNonce[numMessagesToEncrypt];
    signal input messagesAsPoint[numMessagesToEncrypt][2];
    // Encryption output will be the two points c1 and c2 for every message. It has dimensions [numMessagesToEncrypt][2][2]
    // E.g., encryptions[1] will be a 2*2 array representing [c1,c2] where c1 and c2 are the two points that represent an encryption
    signal output encryptions[numMessagesToEncrypt][2][2];


    signal input pAsPoint[numMessagesToEncrypt][2];
    component fromPoint[numMessagesToEncrypt];
    // p Signatures:
    signal input S[numMessagesToEncrypt];
    signal input R8x[numMessagesToEncrypt];
    signal input R8y[numMessagesToEncrypt];
    component sigVerifiers[numMessagesToEncrypt];
    component pointAdders[numMessagesToEncrypt];

    // Call AuditableProof on this template's inputs, with messages modified
    component ap = AuditableProof(numMessagesToEncrypt);
    ap.leaf <== leaf;
    ap.siblings <== siblings;
    ap.pathIndices <== pathIndices;
    ap.encryptToPubkey <== encryptToPubkey;
    ap.encryptWithNonce <== encryptWithNonce;

    // Add p to all messages, after checking p is correct
    for(var i=0; i<numMessagesToEncrypt; i++) {
        fromPoint[i] = pointToMsg();
        fromPoint[i].point <== pAsPoint[i];
        sigVerifiers[i] = EdDSAPoseidonVerifier();
        sigVerifiers[i].enabled <== 1;

        // EdDSA circuit can later be optimized to use EScalarMulFixed 
        sigVerifiers[i].Ax <== thirdPartyPubkeyX;
        sigVerifiers[i].Ay <== thirdPartyPubkeyY;

        sigVerifiers[i].R8x <== R8x[i];
        sigVerifiers[i].R8y <== R8y[i];
        sigVerifiers[i].S <== S[i];
        sigVerifiers[i].M <== fromPoint[i].out;
        
        pointAdders[i] = BabyAdd();
        pointAdders[i].x1 <== pAsPoint[i][0];
        pointAdders[i].x2 <== messagesAsPoint[i][0];
        pointAdders[i].y1 <== pAsPoint[i][1];
        pointAdders[i].y2 <== messagesAsPoint[i][1];
        ap.messagesAsPoint[i] <== [pointAdders[i].xout, pointAdders[i].yout];
    }
}

component main = AuditableProofPQHack(2, 69, 69);