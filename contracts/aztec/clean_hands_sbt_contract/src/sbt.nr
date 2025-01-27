use dep::aztec::{
    prelude::AztecAddress,
    protocol_types::{traits::{Serialize, Deserialize, Packable, FromField, ToField}},
};
use std::meta::derive;

#[derive(Serialize, Deserialize)]
pub struct SBT {
    pub id: Field,
    // The address of the user that the SBT is attesting for
    pub recipient: AztecAddress,
    /// Expiry should be UNIX timestamp in seconds
    // TODO: is u64 the right type for this? Should we use a date library?
    pub expiry: u64,
    pub action_id: Field,
    pub action_nullifier: Field,
    pub revoked: bool,
    // We store the minter, in case we change it and need to revoke all SBTs minted by a specific minter
    pub minter: AztecAddress,
}

global SBT_SERIALIZED_LEN: u32 = 7;

impl Packable<SBT_SERIALIZED_LEN> for SBT {
    fn pack(sbt: SBT) -> [Field; SBT_SERIALIZED_LEN] {
        [
            sbt.id,
            sbt.recipient.to_field(),
            sbt.expiry.to_field(),
            sbt.action_id,
            sbt.action_nullifier,
            sbt.revoked.to_field(),
            sbt.minter.to_field(),
        ]
    }

    fn unpack(fields: [Field; SBT_SERIALIZED_LEN]) -> SBT {
        SBT {
            id: fields[0],
            recipient: AztecAddress::from_field(fields[1]),
            expiry: fields[2] as u64,
            action_id: fields[3],
            action_nullifier: fields[4],
            revoked: fields[5] as bool,
            minter: AztecAddress::from_field(fields[6]),
        }
    }
}
