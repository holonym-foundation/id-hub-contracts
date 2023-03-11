var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a = require('crypto'), createHash = _a.createHash, randomBytes = _a.randomBytes;
var groth16 = require('snarkjs').groth16;
var Utils = require('threshold-eg-babyjub').Utils;
var prfEndpoint = 'https://prf.zkda.network/';
var ORDER = 21888242871839275222246405745257275088614511777268538073601725287587578984328n;
var SUBORDER = ORDER >> 3n; // Order of Fr subgroup
var MAX_MSG = ORDER >> 10n; //Use 10 bits for Koblitz encoding
function randFr() {
    return BigInt('0x' + randomBytes(64).toString('hex')) % SUBORDER;
}
function getPRF() {
    return __awaiter(this, void 0, void 0, function () {
        var preimage, hash, digest, r;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    preimage = randomBytes(32).toString('hex');
                    hash = createHash('sha512');
                    hash.update(preimage);
                    digest = hash.digest('hex');
                    return [4 /*yield*/, fetch(prfEndpoint, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                preimage: preimage,
                                digest: digest
                            })
                        })];
                case 1:
                    r = _a.sent();
                    return [4 /*yield*/, r.json()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function getPubkey() {
    return {
        x: '420',
        y: '69'
    };
}
/**
   * Gets the parameters needed to generate an encryption
   * @param msgsToEncrypt - an array of messages that need to be encrypted. These messages are base10-strings of numbers less than 21888242871839275222246405745257275088614511777268538073601725287587578984328 << 10, where << is the bitshift operator.
   * @returns parameters needed to encrypt
   *
   * @beta
   */
function encryptParams(msgsToEncrypt) {
    return __awaiter(this, void 0, void 0, function () {
        var encryptToPK, msgsAsPoints, nonces, inputs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    encryptToPK = getPubkey();
                    return [4 /*yield*/, Promise.all(msgsToEncrypt.map(function (msg) { return Utils.msgToPoint(msg); }))];
                case 1:
                    msgsAsPoints = _a.sent();
                    nonces = msgsToEncrypt.map(function (_) { return randFr().toString(); });
                    inputs = {
                        messagesAsPoint: msgsAsPoints.map(function (point) { return [point.x, point.y]; }),
                        encryptToPubkey: [encryptToPK.x, encryptToPK.y],
                        encryptWithNonce: nonces
                    };
                    return [2 /*return*/, inputs];
            }
        });
    });
}
setInterval(function () { return encryptParams(["123"]).then(function (x) { return console.log(x); }); }, 1000);
/**
   * Encrypts a message and generates a proof of successful encryption
   * @param msgsToEncrypt - an array of messages that need to be encrypted. These messages are base10-strings of numbers less than 21888242871839275222246405745257275088614511777268538073601725287587578984328 << 10, where << is the bitshift operator.
   * @returns encryption and proof of proper encryption
   *
   * @beta
   */
function encryptAndProve(msgsToEncrypt) {
    return __awaiter(this, void 0, void 0, function () {
        var params, proof;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, encryptParams(msgsToEncrypt)];
                case 1:
                    params = _a.sent();
                    return [4 /*yield*/, groth16.fullProve(params, "https://preproc-zkp.s3.us-east-2.amazonaws.com/circom/daEncrypt_js/daEncrypt.wasm", "https://preproc-zkp.s3.us-east-2.amazonaws.com/circom/daEncrypt_0001.zkey")];
                case 2:
                    proof = _a.sent();
                    // const proof = await snarkjs.groth16.fullProve(par, `./zk/circuits/circom/artifacts/${circuitName}_js/${circuitName}.wasm`, `./zk/pvkeys/circom/${zkeyName}.zkey`);
                    console.log("public Signals", proof.publicSignals);
                    return [2 /*return*/, {
                            encryption: proof.publicSignals,
                            proof: proof
                        }];
            }
        });
    });
}
module.exports = {
    getPRF: getPRF
};
