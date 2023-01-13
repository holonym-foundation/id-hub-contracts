SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
CIRCUIT=onAddLeaf
ROOT_DIR=

cd ${SCRIPT_DIR}/..

if [ ! -f "yarn.lock" ]; then
  echo 'running yarn'
  yarn
fi

OUT_DIR=build/circom
mkdir -p $OUT_DIR

circom zk/$CIRCUIT.circom --r1cs --sym --c -o $OUT_DIR --verbose
