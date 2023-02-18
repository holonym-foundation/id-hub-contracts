snarkjs powersoftau new bn128 15 pot15_0000.ptau -v
snarkjs powersoftau contribute pot15_0000.ptau pot15_0001.ptau --name="First contribution" -v

#phase 2
snarkjs powersoftau prepare phase2 pot15_0001.ptau pot15_final.ptau -v
snarkjs groth16 setup onAddLeafTestingDeleteMe.r1cs pot15_final.ptau pvkeys/circom/onAddLeafTestingDeleteMe_0000.zkey
snarkjs zkey contribute pvkeys/circom/onAddLeafTestingDeleteMe_0000.zkey pvkeys/circom/onAddLeafTestingDeleteMe_0001.zkey --name="Holonym Laptop 1" -v
snarkjs zkey export verificationkey pvkeys/circom/onAddLeafTestingDeleteMe_0001.zkey pvkeys/circom/onAddLeafTestingDeleteMe_verification_key.json
