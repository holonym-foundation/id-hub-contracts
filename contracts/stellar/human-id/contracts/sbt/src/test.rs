#![cfg(test)]

use super::*;
use ed25519_dalek::Keypair;
use ed25519_dalek::Signer;
use rand::thread_rng;
use soroban_sdk::{log, symbol_short, testutils::Address as TestAddress, IntoVal, vec, xdr::MessageType, Address, Bytes, BytesN, Env, U256};

fn generate_keypair() -> Keypair {
    Keypair::generate(&mut thread_rng())
}

fn signer_public_key(e: &Env, signer: &Keypair) -> BytesN<32> {
    signer.public.to_bytes().into_val(e)
}

fn keypair_to_address_str(env: &Env, keypair: &Keypair) -> Address {
    let public_key_bytes = keypair.public.to_bytes();
    let public_key_strkey = stellar_strkey::ed25519::PublicKey::from_payload(&public_key_bytes).unwrap();
    let strkey = stellar_strkey::Strkey::PublicKeyEd25519(public_key_strkey);
    let strkey_str = strkey.to_string();
    // return strkey_str
    return Address::from_str(env, strkey_str.as_str());
}

fn create_test_env<'a>() -> (Env, SBTContractClient<'a>, Address) {
    let env = Env::default();
    let initial_verifier = Address::generate(&env);
    let contract_id = env.register(SBTContract, (&initial_verifier,));
    let client = SBTContractClient::new(&env, &contract_id);

    (env, client, initial_verifier)
}

#[test]
fn test_addres_to_bytes32() {
    let (env, client, initial_verifier) = create_test_env();
    let new_verifier_keypair = generate_keypair();
    let new_verifier = keypair_to_address_str(&env, &new_verifier_keypair);
    
    let addr_bytes32 = _address_to_bytes32(&env, &initial_verifier);
    log!(&env, "addr_bytes32", addr_bytes32);
}

#[test]
fn test_get_set_verifier() {
    let (env, client, initial_verifier) = create_test_env();
    env.mock_all_auths();
    let new_verifier_keypair = generate_keypair();
    let new_verifier = keypair_to_address_str(&env, &new_verifier_keypair);
    
    // "Hello, world!"
    let msg_bytes: &[u8; 13] = &[72, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33];
    let message = Bytes::from_slice(&env, msg_bytes);
    let signature = new_verifier_keypair.sign(msg_bytes);
    let sig_bytes = signature.to_bytes();
    let sig_bytes = BytesN::from_array(&env, &sig_bytes);

    // let (env, client, initial_verifier) = create_test_env();

    // let expected_initial_verifier = client.get_verifier();
    // assert_eq!(initial_verifier, expected_initial_verifier);

    // let mut signer = generate_keypair();
    // let new_verifier = Address::generate(&env);
    // // "Hello, world!"
    // let message = Bytes::from_slice(&env, &[72, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33]);
    // // let signature = BytesN::from_array(&env, &[0u8; 64]);
    client.set_verifier(&initial_verifier, &new_verifier, &message, &sig_bytes);

    // // assert_eq!(client.increment(), 2);
    // // assert_eq!(client.increment(), 3);
}
