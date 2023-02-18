#eventually delete this file; it's just for weird testing purposes for now

circom onAddLeafTestingDeleteme.circom --r1cs --wasm --sym
snarkjs groth16 setup onAddLeafTestingDeleteMe.r1cs pot15_final.ptau pvkeys/circom/onAddLeafTestingDeleteMe_0000.zkey
snarkjs zkey contribute pvkeys/circom/onAddLeafTestingDeleteMe_0000.zkey pvkeys/circom/onAddLeafTestingDeleteMe_0001.zkey --name="Holonym Laptop 1" -v
snarkjs zkey export verificationkey pvkeys/circom/onAddLeafTestingDeleteMe_0001.zkey pvkeys/circom/onAddLeafTestingDeleteMe_verification_key.json
