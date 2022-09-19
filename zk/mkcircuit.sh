# prepare a circuit named ARG.zok where ARG is the first argument to this script
zokrates compile -i $1.zok -o compiled/$1.out
zokrates setup -i compiled/$1.out -p pvkeys/$1.proving.key -v pvkeys/$1.verifying.key
zokrates export-verifier -i pvkeys/$1.verifying.key -o verifier-contracts/$1.verifier.sol