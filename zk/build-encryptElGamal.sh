#eventually delete this file; it's just for weird testing purposes for now

circom encryptElGamal.circom --r1cs --wasm --sym
snarkjs groth16 setup encryptElGamal.r1cs ../../pot15_final.ptau ../../pvkeys/circom/encryptElGamal_0000.zkey
snarkjs zkey contribute ../../pvkeys/circom/encryptElGamal_0000.zkey ../../pvkeys/circom/encryptElGamal_0001.zkey --name="Holonym Laptop 1" -v
snarkjs zkey export verificationkey ../../pvkeys/circom/encryptElGamal_0001.zkey ../../pvkeys/circom/encryptElGamal_verification_key.json
