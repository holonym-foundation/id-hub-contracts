const fs = require('fs');
const crypto = require('crypto');
const { ethers } = require('ethers');
const { groth16 } = require("snarkjs");

const govIdCreds = {
    "credentials" : {
       "address" : "1800252790190408162496944851144659187813457198890711068413419637171073980819",
       "custom_fields" : [
          "2",
          "9717857759462285186569434641069066147758238358576257073710143504773145901957"
       ],
       "iat" : "1716062050",
       "secret": "123",
       "issuance_nullifier" : "1654172193490521401821042153878741762526176957397015785075642139888467004076",
       "scope" : "0"
    },
    "leaf" : "20042585980730927439921583398543073808505208494770696763125712743766743256164",
    "metadata" : {
       "derivedCreds" : {
          "addressHash" : {
             "derivationFunction" : "poseidon",
             "inputFields" : [
                "rawCreds.city",
                "rawCreds.subdivision",
                "rawCreds.zipCode",
                "derivedCreds.streetHash.value"
             ],
             "value" : "17213269051117435556051219503291950994606806381770319609350243626357241456114"
          },
          "nameDobCitySubdivisionZipStreetExpireHash" : {
             "derivationFunction" : "poseidon",
             "inputFields" : [
                "derivedCreds.nameHash.value",
                "rawCreds.birthdate",
                "derivedCreds.addressHash.value",
                "rawCreds.expirationDate"
             ],
             "value" : "9717857759462285186569434641069066147758238358576257073710143504773145901957"
          },
          "nameHash" : {
             "derivationFunction" : "poseidon",
             "inputFields" : [
                "rawCreds.firstName",
                "rawCreds.middleName",
                "rawCreds.lastName"
             ],
             "value" : "19262609406206667575009933537774132284595466745295665914649892492870480170698"
          },
          "streetHash" : {
             "derivationFunction" : "poseidon",
             "inputFields" : [
                "rawCreds.streetNumber",
                "rawCreds.streetName",
                "rawCreds.streetUnit"
             ],
             "value" : "17873212585024051139139509857141244009065298068743399015831877928660937058344"
          }
       },
       "fieldsInLeaf" : [
          "issuer",
          "secret",
          "rawCreds.countryCode",
          "derivedCreds.nameDobCitySubdivisionZipStreetExpireHash.value",
          "rawCreds.completedAt",
          "scope"
       ],
       "rawCreds" : {
          "birthdate" : "1950-01-01",
          "city" : "New York",
          "completedAt" : "2022-09-16",
          "countryCode" : 2,
          "expirationDate" : "2023-09-16",
          "firstName" : "Satoshi",
          "lastName" : "Nakamoto",
          "middleName" : "Bitcoin",
          "streetName" : "Main St",
          "streetNumber" : 123,
          "streetUnit" : 0,
          "subdivision" : "NY",
          "zipCode" : 12345
       }
    },
    "pubkey" : {
       "x" : "13620449171284869818860687899896152941890489758759740138015166671971279862663",
       "y" : "16427782134925018302906992742718507215945455572464721042072940320474808580392"
    },
    "signature_r8" : {
       "x" : "8528157315329512851040687095128272146055648098487830415315364221227159342596",
       "y" : "20069204187931680290442997857186803078923848960945060273509546958344877176426"
    },
    "signature_s" : "2102438017258793590519646477998198983818558340340697682827043983285262930268"
}

function strToBigInt(str) {
    const buf = str ? Buffer.from(str) : Buffer.alloc(1)
    return BigInt('0x' + buf.toString('hex'))
}

function getDateAsInt(date) {
    // Format input
    const [year, month, day] = date.split("-");
    // assert.ok(year && month && day); // Make sure Y M D all given
    // assert.ok(year >= 1900 && year <= 2099); // Make sure date is in a reasonable range, otherwise it's likely the input was malformatted and it's best to be safe by stopping -- we can always allow more edge cases if needed later
    const time = new Date(date).getTime() / 1000 + 2208988800; // 2208988800000 is 70 year offset; Unix timestamps below 1970 are negative and we want to allow from approximately 1900.
    // assert.ok(!isNaN(time));
    return time;
}

function secureExpiryOffset() {
    const secondsInYear = BigInt(31536002)
    const secondsInMonth = BigInt(2592000)

    const randomValues = new Uint8Array(32)
    crypto.getRandomValues(randomValues)
    const randomValue = BigInt(ethers.utils.hexlify(randomValues))

    return secondsInYear - randomValue % secondsInMonth
}

async function V3NameDOB() {
    const inputs = {
        pubKeyX: govIdCreds.pubkey.x,
        pubKeyY: govIdCreds.pubkey.y,
        R8x: govIdCreds.signature_r8.x,
        R8y: govIdCreds.signature_r8.y,
        S: govIdCreds.signature_s,
        nullifierSecretKey: govIdCreds.credentials.secret,
        iat: govIdCreds.credentials.iat,
        expiry: (
            BigInt(govIdCreds.credentials.iat) +
            secureExpiryOffset()
        ).toString(),
        scope: govIdCreds.credentials.scope,
        customFields: govIdCreds.credentials.custom_fields,
        // raw gov ID creds
        firstName: strToBigInt(govIdCreds.metadata.rawCreds.firstName),
        middleName: strToBigInt(govIdCreds.metadata.rawCreds.middleName), 
        lastName: strToBigInt(govIdCreds.metadata.rawCreds.lastName),
        dob: govIdCreds.metadata.rawCreds.birthdate 
            ? getDateAsInt(govIdCreds.metadata.rawCreds.birthdate) 
            : 0,
        city: strToBigInt(govIdCreds.metadata.rawCreds.city),
        subdivision: strToBigInt(govIdCreds.metadata.rawCreds.subdivision),
        zip: govIdCreds.metadata.rawCreds.zipCode,
        streetNumber: govIdCreds.metadata.rawCreds.streetNumber,
        streetName: strToBigInt(govIdCreds.metadata.rawCreds.streetName),
        streetUnit: govIdCreds.metadata.rawCreds.streetUnit,
        expirationDate: govIdCreds.metadata.rawCreds.expirationDate 
            ? getDateAsInt(govIdCreds.metadata.rawCreds.expirationDate) 
            : 0,
    }
    console.log('inputs', inputs)
    const { proof, publicSignals } = await groth16.fullProve(
        inputs, 
        './V3NameDOB_js/V3NameDOB.wasm', 
        './V3NameDOB_0001.zkey'
        // 'https://silk-misc-public-bucket-1.s3.amazonaws.com/V3NameDOB.wasm',
        // 'https://silk-misc-public-bucket-1.s3.amazonaws.com/V3NameDOB_0001.zkey'  
    )
    console.log('publicSignals', publicSignals)

    const expiry = new Date((Number(publicSignals[1])) * 1000)
    const firstName = Buffer.from(BigInt(publicSignals[2]).toString(16), 'hex').toString()
    const lastName = Buffer.from(BigInt(publicSignals[3]).toString(16), 'hex').toString()
    const dob = new Date((Number(publicSignals[4]) - 2208988800) * 1000)

    console.log({
        firstName,
        lastName,
        dob,
        expiry,
    })

    const vKey = JSON.parse(
        fs.readFileSync("./V3NameDOB.verification_key.json", 'utf8')
    );
    const res = await groth16.verify(vKey, publicSignals, proof);

    console.log('res', res) 
}

// V3NameDOB()
//     .then(() => process.exit(0))
//     .catch(error => {
//         console.error(error);
//         process.exit(1);
//     })

const cleanHandsCreds = {
   "credentials" : {
      "address" : "3953516660401541564649985379958697237340496801951929947163239598560489169274",
      "custom_fields" : [
         "1577836800",
         "16915550794603762685249398654174029170499664310588415409737148304879240042377"
      ],
      "iat" : "1716599919",
      "secret": "123",
      "issuance_nullifier" : "1654172193490521401821042153878741762526176957397015785075642139888467004076",
      "scope" : "0"
   },
   "leaf" : "20087267815278254022727390679018557775985159322119163492350211104657633179516",
   "metadata" : {
      "derivedCreds" : {
         "nameHash" : {
            "derivationFunction" : "poseidon",
            "inputFields" : [
               "rawCreds.firstName",
               "rawCreds.lastName"
            ],
            "value" : "16915550794603762685249398654174029170499664310588415409737148304879240042377"
         }
      },
      "fieldsInLeaf" : [
         "issuer",
         "secret",
         "rawCreds.birthdate",
         "derivedCreds.nameHash",
         "iat",
         "scope"
      ],
      "rawCreds" : {
         "birthdate" : "1950-01-01",
         "firstName" : "Satoshi",
         "lastName" : "Nakamoto"
      }
   },
   "pubkey" : {
      "x" : "2193915742490405476800686277116469558901282130174244587699013168483882483899",
      "y" : "20102116424143174914243126067603900555219830548819364207378237727031686368230"
   },
   "signature_r8" : {
      "x" : "7564942462973928899286655023926346973058784658805972285241068698232527250607",
      "y" : "18357919657439108534072991159808029818633611622058195184536769411430401837915"
   },
   "signature_s" : "1715652587298475891019826356997589643442352041309280872725584436400694421891"
}

async function V3CleanHands() {
   const msgAsPointSatoshi = [
      "5595370752660758622020426824408372744342190039385484027207646470578219513822",
      "56493915618480126874522104808868997744921222469752091535465"
   ]
   const msgAsPointNakamoto = [
      "7364263132859350720612571120121921381379591154000684405652597529143311243513",
      "182035950326213742151237893273022326066973955802930892207215"
   ]
   const msgAsPointBirthdate = [
      "17045154945981938440082705754175195148070097524997393444365391337421899830583",
      "50216813883093446110686315385661331328818843555713853939968"
   ]
   const inputs = {
       ephemeralSecretKey: [
         3978785569, 
         4260601071, 
         499321157
       ],
       msgsAsPoints: [
         msgAsPointSatoshi,
         msgAsPointNakamoto,
         msgAsPointBirthdate       
       ],
       pubKeyX: cleanHandsCreds.pubkey.x,
       pubKeyY: cleanHandsCreds.pubkey.y,
       R8x: cleanHandsCreds.signature_r8.x,
       R8y: cleanHandsCreds.signature_r8.y,
       S: cleanHandsCreds.signature_s,
       nullifierSecretKey: cleanHandsCreds.credentials.secret,
       iat: cleanHandsCreds.credentials.iat,
       expiry: (
           BigInt(cleanHandsCreds.credentials.iat) +
           secureExpiryOffset()
       ).toString(),
       scope: cleanHandsCreds.credentials.scope,
       customFields: cleanHandsCreds.credentials.custom_fields,
       // raw gov ID creds
       firstName: strToBigInt(cleanHandsCreds.metadata.rawCreds.firstName),
       lastName: strToBigInt(cleanHandsCreds.metadata.rawCreds.lastName),
       birthdate: cleanHandsCreds.metadata.rawCreds.birthdate 
           ? getDateAsInt(cleanHandsCreds.metadata.rawCreds.birthdate) 
           : 0,
       recipient: '0xdbd6b2c02338919EdAa192F5b60F5e5840A50079',
       actionId: 123456789,
   }
   console.log('inputs', inputs)
   const { proof, publicSignals } = await groth16.fullProve(
       inputs, 
       './V3CleanHands_js/V3CleanHands.wasm', 
       './V3CleanHands_0001.zkey'
   )
   console.log('publicSignals', publicSignals)

   const vKey = JSON.parse(
       fs.readFileSync("./V3CleanHands.verification_key.json", 'utf8')
   );
   const res = await groth16.verify(vKey, publicSignals, proof);

   console.log('res', res) 
}

V3CleanHands()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    })
