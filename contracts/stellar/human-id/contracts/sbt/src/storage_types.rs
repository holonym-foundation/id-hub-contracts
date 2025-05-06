use soroban_sdk::{contracttype, Address, U256, Vec};

// pub(crate) const DAY_IN_LEDGERS: u32 = 17280;
// pub(crate) const INSTANCE_BUMP_AMOUNT: u32 = 7 * DAY_IN_LEDGERS;
// pub(crate) const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;

// pub(crate) const BALANCE_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
// pub(crate) const BALANCE_LIFETIME_THRESHOLD: u32 = BALANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;

#[contracttype]
pub struct SBT {
    pub circuit_id: U256,
    pub id: U256,
    pub recipient: Address,
    pub expiry: u64,
    pub action_nullifier: U256,
    pub public_values: Vec<U256>,
    pub revoked: bool,
    pub minter: Address,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    /// For storing (id => SBT) mapping, where id is keccak256(recipient, circuit_id)
    SBTID(U256),
    /// For storing (action_nullifier => SBTID) mapping
    Nullifier(U256),
    Verifier
}