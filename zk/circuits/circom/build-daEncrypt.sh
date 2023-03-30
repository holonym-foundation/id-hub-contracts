# this is a build script for the initial MVP --it's just for the initial MVP. Once more contributors, we can do a bigger trusted setup ceremoney!
pwd
sh ./build.sh daEncrypt
# circom daEncrypt.circom --r1cs --wasm --sym
# snarkjs groth16 setup daEncrypt.r1cs setup/pot15_final.ptau ../../pvkeys/circom/daEncrypt_0000.zkey
# snarkjs zkey contribute ../../pvkeys/circom/daEncrypt_0000.zkey ../../pvkeys/circom/daEncrypt_0001.zkey --name="Holonym Laptop 1" -v
# snarkjs zkey export verificationkey ../../pvkeys/circom/daEncrypt_0001.zkey ../../pvkeys/circom/daEncrypt_verification_key.json

destination_dir=../../../utils/packages/zk-escrow/zk
rm -rf $destination_dir/daEncrypt_js
rm $destination_dir/daEncrypt_verification_key.json $destination_dir/daEncrypt_0001.zkey
mv daEncrypt_js $destination_dir
mv ../../pvkeys/circom/daEncrypt_0001.zkey $destination_dir
mv ../../pvkeys/circom/daEncrypt_verification_key.json $destination_dir
mv daEncrypt.sym $destination_dir