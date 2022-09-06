const { initialize } = require("zokrates-js");
const fs = require("fs");
const { assert } = require("console");
const util = require("util");
const exec = util.promisify(require("child_process").exec); // wrapper for exec that allows async/await for its completion (https://stackoverflow.com/questions/30763496/how-to-promisify-nodes-child-process-exec-and-child-process-execfile-functions)
const { randomBytes } = require("crypto");

// Initialize global variables
var globals = {};
async function initZok() {
  const zokratesProvider = await initialize();
  globals.zokratesProvider = zokratesProvider;
  globals.leafgen = zokratesProvider.compile(`${fs.readFileSync("./createLeaf.zok")}`);
  // globals.lobby3Proof = zokratesProvider.compile(
  //   `${fs.readFileSync("./lobby3Proof.zok")}`
  // );
}
function toU32StringArray(bytes) {
  let u32s = chunk(bytes.toString("hex"), 8);
  return u32s.map((x) => parseInt(x, 16).toString());
}
function chunk(arr, chunkSize) {
  let out = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    out.push(chunk);
  }
  return out;
}
function argsToU32CLIArgs(args) {
  return toU32Array(Buffer.concat(args))
    .map((x) => parseInt(x))
    .join(" ");
}
function toU32Array(bytes) {
  let u32s = chunk(bytes.toString("hex"), 8);
  return u32s.map((x) => parseInt(x, 16));
}
/**
 * Takes Buffer, properly formats them (according to spec), and returns a hash.
 * See: https://opsci.gitbook.io/untitled/4alwUHFeMIUzhQ8BnUBD/extras/leaves
 * @param {Buffer} issuer Blockchain address of account that issued the credentials
 * @param {Buffer} creds Credentials (e.g., "Alice" or "US" as Buffer)
 * @param {Buffer} secret Hex string representation of 16 bytes
 * @returns {Buffer} 32-byte blake2s hash
 */
function leafFromData(issuer, creds, secret) {
  const paddedCreds = Buffer.concat([creds], 28);
  // console.log("---args---");
  // console.log([issuer, paddedCreds, secret].map((x) => toU32StringArray(x)));
  const { witness, output } = globals.zokratesProvider.computeWitness(
    globals.leafgen,
    [issuer, paddedCreds, secret].map((x) => toU32StringArray(x))
  );
  // console.log("---output---");
  // console.log(output);
  const leafAsStr = JSON.parse(output).join("").replaceAll("0x", "");
  return Buffer.from(leafAsStr, "hex");
}

/**
 * @param {Buffer} leaf 32-byte blake2s hash
 */
function lobby3Proof(leaf) {
  const { witness, output } = globals.zokratesProvider.computeWitness(
    globals.lobby3Proof,
    [toU32StringArray(leaf)]
  );
  console.log("---lobby3Proof output---");
  console.log(output);
  // const poseidonHashStr = JSON.parse(output).join("").replaceAll("0x", "");
  // return Buffer.from(poseidonHashStr, "hex");
}

async function main() {
  await initZok();

  const address = Buffer.concat([Buffer.from("0")], 20);
  const creds = Buffer.concat([Buffer.from("US")], 28);
  const secret = Buffer.concat([Buffer.from("0")], 16);
  const leaf = leafFromData(address, creds, secret);
  console.log("---leaf as string---");
  console.log(leaf.toString("hex"));

  // lobby3Proof(leaf);
}

main();
