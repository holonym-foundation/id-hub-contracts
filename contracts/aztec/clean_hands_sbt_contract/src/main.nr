mod test;
mod sbt;

use dep::aztec::macros::aztec;

#[aztec]
pub contract CleanHandsSBTContract {
    use crate::sbt::SBT;
    use dep::aztec::{
        macros::{
            functions::{initializer, public, view},
            storage::storage,
        },
        prelude::{AztecAddress, Map, PublicImmutable, PublicMutable},
        protocol_types::{traits::{Serialize, FromField, ToField}},
    };

    #[storage]
    struct Storage<Context> {
        // Contract owner and the only address that can mint SBTs
        owner: PublicMutable<AztecAddress, Context>,
        sbt_count: PublicMutable<Field, Context>,
        sbts: Map<Field, PublicMutable<SBT, Context>, Context>,
        address_to_sbt_id: Map<AztecAddress, PublicImmutable<Field, Context>, Context>,
        nullifier_to_sbt_id: Map<Field, PublicImmutable<Field, Context>, Context>,
    }

    #[public]
    #[initializer]
    fn constructor(owner: AztecAddress) {
        assert(!owner.is_zero(), "invalid owner");
        storage.owner.write(owner);
    }

    #[public]
    fn set_owner(new_owner: AztecAddress) {
        assert(storage.owner.read().eq(context.msg_sender()), "caller is not an owner");
        storage.owner.write(new_owner);
    }

    /// Mint a new SBT.
    #[public]
    fn mint(
        recipient: AztecAddress,
        action_id: Field,
        action_nullifier: Field,
        expiry: u64
    ) {
        assert(storage.owner.read() == context.msg_sender(), "caller is not a owner");
        assert(storage.address_to_sbt_id.at(recipient).read() == 0, "recipient already has an SBT");
        assert(storage.nullifier_to_sbt_id.at(action_nullifier).read() == 0, "an SBT with this action nullifier already exists");

        let sbt_id = storage.sbt_count.read();
        let new_sbt = SBT {
            id: sbt_id,
            recipient,
            expiry,
            action_id,
            action_nullifier,
            revoked: false,
            minter: context.msg_sender(),
        };
        storage.sbts.at(sbt_id).write(new_sbt);
        storage.address_to_sbt_id.at(recipient).initialize(sbt_id);
        storage.nullifier_to_sbt_id.at(action_nullifier).initialize(sbt_id);
        storage.sbt_count.write(sbt_id + 1);
    }

    #[public]
    #[view]
    fn get_owner() -> AztecAddress {
        storage.owner.read()
    }

    #[public]
    #[view]
    fn get_sbt_by_id(sbt_id: Field) -> SBT {
        storage.sbts.at(sbt_id).read()
    }

    #[public]
    #[view]
    fn get_sbt_by_address(addr: AztecAddress) -> SBT {
        let id = storage.address_to_sbt_id.at(addr).read();
        storage.sbts.at(id).read()
    }

    #[public]
    #[view]
    fn get_sbt_by_nullifier(action_nullifier: Field) -> SBT {
        let id = storage.nullifier_to_sbt_id.at(action_nullifier).read();
        storage.sbts.at(id).read()
    }

    #[public]
    fn revoke(sbt_id: Field) {
        assert(storage.owner.read() == context.msg_sender(), "caller is not the contract owner");
        let sbt = storage.sbts.at(sbt_id).read();
        let new_sbt = SBT { 
            id: sbt.id,
            recipient: sbt.recipient,
            expiry: sbt.expiry,
            action_id: sbt.action_id,
            action_nullifier: sbt.action_nullifier,
            minter: sbt.minter,
            revoked: true,
        };
        storage.sbts.at(sbt_id).write(new_sbt);
    }
}
