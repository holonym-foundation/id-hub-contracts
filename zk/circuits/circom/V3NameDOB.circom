pragma circom 2.0.0;
include "./V3SansExpiry.circom";

// Proves that a given first name, last name, and date of birth are in the user's signed creds
template NameDOB() {
    // ------------------------------------------------------------------ //
    // -------------------------- Inputs -------------------------------- //
    // ------------------------------------------------------------------ //

    // Issuer pubkey and signature (R, S) :
    signal input pubKeyX;
    signal input pubKeyY;
    signal input R8x;
    signal input R8y;
    signal input S;

    // The secret key used to create nullifiers.
    signal input nullifierSecretKey;

    // Time the issuer says the credential was issued at
    signal input iat;
    
    // Scope of credentials (probably set to 0)
    signal input scope; 

    // Three custom fields the issuer can put in the leaf (can be anything, e.g. [name, address, birthdate, phone #])
    signal input customFields[2];

    // The values needed to reconstruct customFields[1]
    signal input firstName;
    signal input middleName;
    signal input lastName;
    signal input dob;
    signal input city;
    signal input subdivision;
    signal input zip;
    signal input streetNumber;
    signal input streetName;
    signal input streetUnit;
    signal input expirationDate;

    signal output issuerAddress;
    
    // ------------------------------------------------------------------ //
    // ------------------------- Constraints ---------------------------- //
    // ------------------------------------------------------------------ //
    // Check the constraints necessary in any Holonym V3 circuit
    component v3SansExpiry = V3SansExpiry();
    v3SansExpiry.pubKeyX <== pubKeyX;
    v3SansExpiry.pubKeyY <== pubKeyY;
    v3SansExpiry.R8x <== R8x;
    v3SansExpiry.R8y <== R8y;
    v3SansExpiry.S <== S;
    v3SansExpiry.nullifierSecretKey <== nullifierSecretKey;
    v3SansExpiry.iat <== iat;
    v3SansExpiry.scope <== scope; 
    v3SansExpiry.customFields <== customFields;

    // Output the issuer's address
    issuerAddress <== v3SansExpiry.issuerAddress;

    // Calculate customFields[1] from raw inputs.
    // See this function for how these values are hashed together to form customFields[1]:
    // https://github.com/holonym-foundation/id-server/blob/ce8c065bae807f1990587e12a76190952e64eec9/src/services/veriff-kyc/credentials.js#L134
    component nameHash = Poseidon(3);
    nameHash.inputs[0] <== firstName;
    nameHash.inputs[1] <== middleName;
    nameHash.inputs[2] <== lastName;

    component streetHash = Poseidon(3);
    streetHash.inputs[0] <== streetNumber;
    streetHash.inputs[1] <== streetName;
    streetHash.inputs[2] <== streetUnit;

    component addressHash = Poseidon(4);
    addressHash.inputs[0] <== city;
    addressHash.inputs[1] <== subdivision;
    addressHash.inputs[2] <== zip;
    addressHash.inputs[3] <== streetHash.out;

    component nameDobCitySubdivisionZipStreetExpireHash = Poseidon(4);
    nameDobCitySubdivisionZipStreetExpireHash.inputs[0] <== nameHash.out;
    nameDobCitySubdivisionZipStreetExpireHash.inputs[1] <== dob;
    nameDobCitySubdivisionZipStreetExpireHash.inputs[2] <== addressHash.out;
    nameDobCitySubdivisionZipStreetExpireHash.inputs[3] <== expirationDate;

    // Constrain nameDobCitySubdivisionZipStreetExpireHash
    nameDobCitySubdivisionZipStreetExpireHash.out === customFields[1];
}

component main { public [firstName, lastName, dob, expirationDate] } = NameDOB();
