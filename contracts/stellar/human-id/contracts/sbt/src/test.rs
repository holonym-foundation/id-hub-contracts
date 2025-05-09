#![cfg(test)]

use super::*;
use ed25519_dalek::Keypair;
use rand::thread_rng;
use soroban_sdk::{log, symbol_short, testutils::Address as TestAddress, IntoVal, vec, Address, BytesN, Env, U256};

fn generate_keypair() -> Keypair {
    Keypair::generate(&mut thread_rng())
}

fn signer_public_key(env: &Env, signer: &Keypair) -> BytesN<32> {
    signer.public.to_bytes().into_val(env)
}

// fn keypair_to_address_str(env: &Env, keypair: &Keypair) -> Address {
//     let public_key_bytes = keypair.public.to_bytes();
//     let public_key_strkey = stellar_strkey::ed25519::PublicKey::from_payload(&public_key_bytes).unwrap();
//     let strkey = stellar_strkey::Strkey::PublicKeyEd25519(public_key_strkey);
//     let strkey_str = strkey.to_string();
//     // return strkey_str
//     return Address::from_str(env, strkey_str.as_str());
// }

fn create_test_env<'a>() -> (Env, SBTContractClient<'a>, Address) {
    let env = Env::default();
    let initial_admin = Address::generate(&env);
    let contract_id = env.register(SBTContract, (&initial_admin,));
    let client = SBTContractClient::new(&env, &contract_id);

    (env, client, initial_admin)
}

#[test]
fn test_get_set_admin() {
    let (env, client, initial_admin) = create_test_env();
    env.mock_all_auths();

    let first_admin = client.get_admin();

    let new_admin = Address::generate(&env);
    let _result = client.set_admin(&initial_admin, &new_admin);

    let expected_admin = client.get_admin();

    assert_eq!(new_admin, expected_admin);
    assert_ne!(first_admin, expected_admin)
}

#[test]
fn test_sbt() {
    let (env, client, initial_admin) = create_test_env();
    env.mock_all_auths();

    // Set args
    let recipient = Address::generate(&env);
    let circuit_id = U256::from_u32(&env, 123);
    let expiration: u64 = 1777953600;
    let action_nullifier = U256::from_u128(&env, 11111111111);
    let public_values = vec![
        &env,
        U256::from_u128(&env, 1777953600),
        U256::from_u128(&env, 22222222222),
        U256::from_u128(&env, 33333333333),
        U256::from_u128(&env, 44444444444)
    ];

    let sbt_id = client.mint_sbt(
        &initial_admin,
        &recipient,
        &circuit_id,
        &expiration,
        &action_nullifier,
        &public_values
    );

    log!(&env, "SBT ID", sbt_id);

    let sbt = client.get_sbt_by_id(&sbt_id);

    assert_eq!(sbt.id, sbt_id);
    assert_eq!(sbt.recipient, recipient);
    assert_eq!(sbt.circuit_id, circuit_id);
    assert_eq!(sbt.expiry, expiration);
    assert_eq!(sbt.action_nullifier, action_nullifier);
    assert_eq!(sbt.public_values, public_values);
    assert_eq!(sbt.revoked, false);
    assert_eq!(sbt.minter, initial_admin);

    let sbt_by_address = client.get_sbt(&recipient, &circuit_id);
    assert_eq!(sbt_by_address.id, sbt_id);

    let sbt_by_nullifier = client.get_sbt_by_nullifier(&action_nullifier);
    assert_eq!(sbt_by_nullifier.id, sbt_id);

    client.revoke_sbt(&initial_admin, &recipient, &circuit_id);

    // TODO: Figure out how to expect get_sbt_by_id() to return Error::Revoked
    // let revoked_sbt = client.get_sbt_by_id(&sbt_id);
}
