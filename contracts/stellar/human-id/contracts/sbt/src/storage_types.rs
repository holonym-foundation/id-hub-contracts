use soroban_sdk::{contracttype, Address, U256, BytesN, Vec};

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
    Admin
}