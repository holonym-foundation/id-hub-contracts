# this is a build script for the initial MVP --it's just for the initial MVP. Once more contributors, we can do a bigger trusted setup ceremoney!
echo BUILDING ${1}.circom
circom ${1}.circom --r1cs --wasm --sym
snarkjs groth16 setup ${1}.r1cs setup/pot15_final.ptau ../../pvkeys/circom/${1}_0000.zkey
snarkjs zkey contribute ../../pvkeys/circom/${1}_0000.zkey ../../pvkeys/circom/${1}_0001.zkey --name="Holonym Laptop 1" -v
snarkjs zkey export verificationkey ../../pvkeys/circom/${1}_0001.zkey ../../pvkeys/circom/${1}_verification_key.json
