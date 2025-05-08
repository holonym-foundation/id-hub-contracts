#![no_std]
use soroban_sdk::{
    contract, contractimpl, Env, Address, Vec, Bytes, BytesN, U256,
    symbol_short, crypto::Crypto, xdr::ToXdr,
};

mod admin;
mod constants;
mod errors;
mod storage_types;
mod verifier;

use admin::{_get_admin, _set_admin};
use constants::{SECONDS_IN_DAY, DAY_IN_LEDGERS, YEAR_IN_LEDGERS};
use errors::Error;
use verifier::{_get_verifier, _set_verifier};
use storage_types::{SBT, DataKey};

pub fn _address_to_xdr_bytes(env: &Env, address: &Address) -> Bytes {
    address.to_xdr(env)
}

pub fn _get_sbt_by_id(env: &Env, id: &U256) -> Result<SBT, Error> {
    let key = DataKey::SBTID(id.clone());
    if let Some(sbt) = env.storage().persistent().get::<DataKey, SBT>(&key) {
        // e.storage()
        //     .persistent();
            // .extend_ttl(&key, BALANCE_LIFETIME_THRESHOLD, BALANCE_BUMP_AMOUNT);
        if sbt.revoked {
            Err(Error::Revoked)
        } else if sbt.expiry < env.ledger().timestamp() {
            Err(Error::Expired)
        } else {
            Ok(sbt)
        }
    } else {
        Err(Error::NotFound)
    }
}

pub fn _get_sbt_id(env: &Env, recipient: &Address, circuit_id: &U256) -> Result<U256, Error> {
    let addr_bytes = _address_to_xdr_bytes(env, recipient);
    let mut concatenated = Bytes::new(&env);
    concatenated.append(&circuit_id.to_be_bytes());
    concatenated.append(&addr_bytes);
    let digest = Crypto::keccak256(&env.crypto(), &concatenated).to_bytes();
    Ok(U256::from_be_bytes(&env, &Bytes::from_slice(&env, &digest.to_array())))
}

pub fn _calc_sbt_ttl_params(env: &Env, expiration: &u64) -> Result<(u32, u32), Error> {
    let now = env.ledger().timestamp(); // expressed in seconds
    
    let days_until_expiry: u32 = ((expiration - now) / (SECONDS_IN_DAY as u64)).try_into()
        .map_err(|_err| Error::FailedToParseDaysUntilExpiry)?;
    
    let sbt_bump_amount: u32 = days_until_expiry * DAY_IN_LEDGERS;
    let sbt_lifetime_threshold: u32 = sbt_bump_amount - DAY_IN_LEDGERS;

    Ok((sbt_lifetime_threshold, sbt_bump_amount))
}

#[contract]
pub struct SBTContract;

#[contractimpl]
impl SBTContract {
    pub fn __constructor(env: Env, admin: Address, verifier_pubkey: BytesN<32>) {
        // The admin is an account that has the privilege to set the verifier pubkey.
        // The verifier pubkey is used to verify signatures for minting SBTs.
        _set_admin(&env, &admin);
        _set_verifier(&env, &verifier_pubkey);

        // Extend TTL of contract instance and contract code
        env.deployer().extend_ttl(env.current_contract_address(), YEAR_IN_LEDGERS, YEAR_IN_LEDGERS);
    }

    // ------------ SBT accessors ------------

    pub fn get_sbt_by_id(env: Env, id: U256) -> Result<SBT, Error> {
        _get_sbt_by_id(&env, &id)
    }

    pub fn get_sbt(env: Env, recipient: Address, circuit_id: U256) -> Result<SBT, Error> {
        let sbt_id = _get_sbt_id(&env, &recipient, &circuit_id)?;
        Self::get_sbt_by_id(env, sbt_id)
    }

    pub fn get_sbt_by_nullifier(env: Env, action_nullifier: U256) -> Result<SBT, Error> {
        let key = DataKey::Nullifier(action_nullifier);
        if let Some(sbt_id) = env.storage().persistent().get::<DataKey, U256>(&key) {
            Self::get_sbt_by_id(env, sbt_id)
        } else {
            Err(Error::NotFound)
        }
    }

    pub fn get_sbt_id(env: Env, recipient: Address, circuit_id: U256) -> Result<U256, Error> {
        _get_sbt_id(&env, &recipient, &circuit_id)
    }

    // ------------ Minting ------------

    pub fn mint_sbt(
        env: Env,
        recipient: Address,
        circuit_id: U256,
        expiration: u64,
        action_nullifier: U256,
        public_values: Vec<U256>,
        signature: BytesN<64>,  // Assuming ed25519 signature
    ) -> Result<U256, Error> {
        // Get the contract's storage
        let storage = env.storage().persistent();
        
        // Check if nullifier has been used
        let nullifier_key = DataKey::Nullifier(action_nullifier.clone());
        if storage.has(&nullifier_key) {
            return Err(Error::NullifierAlreadyUsed);
        }

        // Generate the SBT ID
        let sbt_id = _get_sbt_id(&env, &recipient, &circuit_id)?;
        
        // Verify the signature
        let verifier = _get_verifier(&env)?;

        let mut message = Bytes::new(&env);
        message.append(&circuit_id.to_be_bytes());
        message.append(&_address_to_xdr_bytes(&env, &recipient));
        message.append(&Bytes::from_slice(&env, &expiration.to_be_bytes()));
        message.append(&action_nullifier.to_be_bytes());
        for value in &public_values {
            message.append(&value.to_be_bytes())
        }
        
        // Panics if signature is invalid
        env.crypto().ed25519_verify(&verifier, &message, &signature);
        
        // Create the SBT
        let sbt = SBT {
            id: sbt_id.clone(),
            recipient: recipient.clone(),
            expiry: expiration,
            circuit_id,
            action_nullifier,
            public_values: public_values.clone(),
            revoked: false,
            minter: verifier,
        };

        // Store the SBT
        let sbt_key = DataKey::SBTID(sbt_id.clone());
        storage.set(&sbt_key, &sbt);
        storage.set(&nullifier_key, &sbt_id);

        // Update the SBT TTL. We want to make sure it is not archived before it expires.
        let (sbt_lifetime_threshold, sbt_bump_amount) = _calc_sbt_ttl_params(&env, &expiration)?;
        storage.extend_ttl(&sbt_key, sbt_lifetime_threshold, sbt_bump_amount);
        storage.extend_ttl(&nullifier_key, sbt_lifetime_threshold, sbt_bump_amount);

        // Emit event
        env.events().publish((symbol_short!("sbt"), symbol_short!("mint")), &sbt_id);

        Ok(sbt_id)
    }

    // ------------ Verifier fns ------------

    pub fn set_verifier(
        env: Env,
        new_verifier_pubkey: BytesN<32>,
        admin: Address
    ) -> Result<(), Error> {
        let actual_admin = _get_admin(&env)?;

        // This might not be necessary. Maybe we can just call require_auth() on the Address
        // returned by _get_admin()
        if admin != actual_admin {
            return Err(Error::InvalidAdmin);
        }

        // TODO: Should we use require_auth_for_args instead?
        actual_admin.require_auth();

        // Set
        _set_verifier(&env, &new_verifier_pubkey);

        // Extend TTL of contract instance and contract code
        env.deployer().extend_ttl(env.current_contract_address(), YEAR_IN_LEDGERS, YEAR_IN_LEDGERS);

        // Emit event
        env.events().publish((symbol_short!("verifier"), symbol_short!("set")), new_verifier_pubkey);

        Ok(())
    }

    pub fn get_verifier(env: Env) -> Result<BytesN<32>, Error> {
        _get_verifier(&env)
    }

    // ------------ Admin fns ------------

    pub fn set_admin(
        env: Env,
        current_admin: Address,
        new_admin: Address,
    ) -> Result<(), Error> {
        let admin = _get_admin(&env)?;

        // This might not be necessary. Maybe we can just call require_auth() on the Address
        // returned by _get_admin()
        if current_admin != admin {
            return Err(Error::InvalidAdmin);
        }

        current_admin.require_auth();

        new_admin.require_auth();

        // Set
        _set_admin(&env, &new_admin);

        // Extend TTL of contract instance and contract code
        env.deployer().extend_ttl(env.current_contract_address(), YEAR_IN_LEDGERS, YEAR_IN_LEDGERS);

        // Emit event
        env.events().publish((symbol_short!("admin"), symbol_short!("set")), new_admin);

        Ok(())
    }

    pub fn get_admin(env: Env) -> Result<Address, Error> {
        _get_admin(&env)
    }

    // ------------ SBT revocation ------------

    pub fn revoke_sbt(env: Env, admin: Address, recipient: Address, circuit_id: U256) -> Result<(), Error> {
        let actual_admin = _get_admin(&env)?;

        // This might not be necessary. Maybe we can just call require_auth() on the Address
        // returned by _get_admin()
        if actual_admin != admin {
            return Err(Error::InvalidAdmin);
        }

        // Make sure admin authorized this call
        admin.require_auth();


        let storage = env.storage().persistent();

        let sbt_id = _get_sbt_id(&env, &recipient, &circuit_id)?;
        let mut sbt = _get_sbt_by_id(&env, &sbt_id)?;
        sbt.revoked = true;

        // Store the SBT
        let sbt_key = DataKey::SBTID(sbt_id.clone());
        let nullifier_key = DataKey::Nullifier(sbt.action_nullifier.clone());
        storage.set(&sbt_key, &sbt);
        storage.set(&nullifier_key, &sbt_id);

        let (sbt_lifetime_threshold, sbt_bump_amount) = _calc_sbt_ttl_params(&env, &sbt.expiry)?;
        storage.extend_ttl(&sbt_key, sbt_lifetime_threshold, sbt_bump_amount);
        storage.extend_ttl(&nullifier_key, sbt_lifetime_threshold, sbt_bump_amount);

        env.events().publish((symbol_short!("sbt"), symbol_short!("revoked")), sbt_id);

        Ok(())
    }
}

mod test;
