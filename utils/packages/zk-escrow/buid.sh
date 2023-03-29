# this is a build script for the initial MVP --it's just for the initial MVP. Once more contributors, we can do a bigger trusted setup ceremoney!
# curPath=`pwd`
# cd ../../../zk/circuits/circom/
# circom ${1}.circom --r1cs --wasm --sym # --c
# cd $curPath
circom  ../../../zk/circuits/circom/${1}.circom --r1cs --wasm --sym # --c
snarkjs groth16 setup ${1}.r1cs ../../../zk/circuits/circom/setup/pot15_final.ptau ../../../zk/pvkeys/circom/${1}_0000.zkey
snarkjs zkey contribute ../../../zk/pvkeys/circom/${1}_0000.zkey ../../../zk/pvkeys/circom/${1}_0001.zkey --name="Holonym Laptop 1" -v
snarkjs zkey export verificationkey ../../../zk/pvkeys/circom/${1}_0001.zkey ../../../zk/pvkeys/circom/${1}_verification_key.json
rm ${1}.r1cs
# mv ${1}_cpp zk
cp ../../../zk/pvkeys/circom/${1}_0001.zkey zk 
cp ../../../zk/pvkeys/circom/${1}_verification_key.json zk
rm -rf zk/${1}_js
mv ${1}_js zk