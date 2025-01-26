use dep::aztec::{
    prelude::AztecAddress,
    protocol_types::{traits::{Serialize, Deserialize, Packable}},
};
use std::meta::derive;

#[derive(Serialize, Deserialize)]
pub struct SBT {
    id: Field,
    // The address of the user that the SBT is attesting for
    recipient: AztecAddress,
    // TODO: is u64 the right type for this? Should we use a date library?
    expiry: u64,
    action_id: Field,
    action_nullifier: Field,
    revoked: bool,
    // We store the minter, in case we change it and need to revoke all SBTs minted by a specific minter
    minter: AztecAddress,
}

// impl Deserialize<LEADER_SERIALIZED_LEN> for Leader {
//     fn deserialize(fields: [Field; LEADER_SERIALIZED_LEN]) -> Self {
//         Leader { account: AztecAddress::from_field(fields[0]), points: fields[1] as u8 }
//     }
// }

// impl Serialize<LEADER_SERIALIZED_LEN> for Leader {
//     fn serialize(self) -> [Field; LEADER_SERIALIZED_LEN] {
//         [self.account.to_field(), self.points as Field]
//     }
// }

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
