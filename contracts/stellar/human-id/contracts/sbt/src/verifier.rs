use soroban_sdk::{Address, Env};

use crate::constants::YEAR_IN_LEDGERS;
use crate::storage_types::DataKey;
use crate::errors::Error;

pub fn _get_verifier(env: &Env) -> Result<Address, Error> {
    let key = DataKey::Verifier;
    let verifier = env.storage().instance().get::<DataKey, Address>(&key).ok_or(Error::VerifierNotSet)?;
    Ok(verifier)
}

pub fn _set_verifier(env: &Env, new_verifier: &Address) {
    let key = DataKey::Verifier;
    env.storage().instance().set(&key, new_verifier);
    env.storage().instance().extend_ttl(YEAR_IN_LEDGERS, YEAR_IN_LEDGERS);
}
