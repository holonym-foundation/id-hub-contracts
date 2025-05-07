use soroban_sdk::{BytesN, Env};

use crate::constants::YEAR_IN_LEDGERS;
use crate::storage_types::DataKey;
use crate::errors::Error;

pub fn _get_verifier(env: &Env) -> Result<BytesN<32>, Error> {
    let key = DataKey::VerifierPubKey;
    let verifier = env.storage().instance().get::<DataKey, BytesN<32>>(&key).ok_or(Error::VerifierNotSet)?;
    Ok(verifier)
}

pub fn _set_verifier(env: &Env, new_verifier: &BytesN<32>) {
    let key = DataKey::VerifierPubKey;
    env.storage().instance().set(&key, new_verifier);
    env.storage().instance().extend_ttl(YEAR_IN_LEDGERS, YEAR_IN_LEDGERS);
}
