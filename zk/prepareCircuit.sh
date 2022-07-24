# boilerplate code to prepare a specific circuit for proof and verification
# zokrates compile -i assertLeafContainsCreds.zok -o alcc.out
# zokrates setup -i alcc.out -p alcc.proving.key -v alcc.verification.key
# zokrates export-verifier -i alcc.verification.key -o ALCCVerifier.sol