use soroban_sdk::{Address, Env};

use crate::constants::YEAR_IN_LEDGERS;
use crate::storage_types::DataKey;
use crate::errors::Error;

pub fn _get_admin(env: &Env) -> Result<Address, Error> {
    let key = DataKey::Admin;
    let admin = env.storage().instance().get::<DataKey, Address>(&key).ok_or(Error::AdminNotSet)?;
    Ok(admin)
}

pub fn _set_admin(env: &Env, new_admin: &Address) {
    let key = DataKey::Admin;
    env.storage().instance().set(&key, new_admin);
    env.storage().instance().extend_ttl(YEAR_IN_LEDGERS, YEAR_IN_LEDGERS);
}
