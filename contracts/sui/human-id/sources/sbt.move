module human_id::sbt {
    use sui::event;

    public struct SoulBoundToken has key {
        id: UID,
        recipient: address,
        expiry: u64,
        circuit_id: u256,
        action_id: u256,
        action_nullifier: u256,
        revoked: bool,
        minter: address,
    }

	public struct MinterCap has key, store {
		id: UID,
	}

    // --- Events ---

    public struct SBTMinted has copy, drop {
        id: ID,
        recipient: address,
        circuit_id: u256,
        action_id: u256,
        action_nullifier: u256,
        minter: address
    }

	public struct SBTRevoked has copy, drop {
		id: ID,
		recipient: address,
		minter: address
	}

	public struct MinterChanged has copy, drop {
		old_minter: address,
		new_minter: address
	}

    // --- END: Events ---

    fun init(ctx: &mut TxContext) {
        let minter_cap = MinterCap {
            id: object::new(ctx),
        };
        transfer::transfer(minter_cap, tx_context::sender(ctx));
    }

    // Add a test-only function for initialization in tests
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx)
    }

    public entry fun set_minter(
		cap: MinterCap,  // Passing the capability ensures only the minter can call
		new_minter: address,
		ctx: &mut TxContext
	) {
        transfer::public_transfer(cap, new_minter);

		event::emit(MinterChanged {
			old_minter: tx_context::sender(ctx),
			new_minter
		});
    }

    public entry fun mint(
		_cap: &MinterCap,  // Reference to the capability ensures only the minter can call
        recipient: address,
        circuit_id: u256,
        action_id: u256,
        action_nullifier: u256,
        expiry: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let sbt = SoulBoundToken {
            id: object::new(ctx),
            recipient,
            expiry,
            circuit_id,
            action_id,
            action_nullifier,
            revoked: false,
            minter: sender
        };

		event::emit(SBTMinted {
			id: object::uid_to_inner(&sbt.id),
			recipient,
			circuit_id,
			action_id,
			action_nullifier,
			minter: sender
		});

        transfer::transfer(sbt, recipient);
    }

    public entry fun revoke(
		_cap: &MinterCap,  // Reference to the capability ensures only the minter can call
        sbt: &mut SoulBoundToken
    ) {
		let minter = sbt.minter;
		let recipient = sbt.recipient;

		sbt.revoked = true;

		event::emit(SBTRevoked {
			id: object::uid_to_inner(&sbt.id),
			recipient,
			minter
		});
    }

    // --- Accessors ---

    public fun recipient(sbt: &SoulBoundToken): address {
        sbt.recipient
    }

    public fun circuit_id(sbt: &SoulBoundToken): u256 {
        sbt.circuit_id
    }

    public fun expiry(sbt: &SoulBoundToken): u64 {
        sbt.expiry
    }

    public fun action_id(sbt: &SoulBoundToken): u256 {
        sbt.action_id
    }

    public fun action_nullifier(sbt: &SoulBoundToken): u256 {
        sbt.action_nullifier
    }

    public fun revoked(sbt: &SoulBoundToken): bool {
        sbt.revoked
    }

    public fun minter(sbt: &SoulBoundToken): address {
        sbt.minter
    }

    // --- END: Accessors ---
}

#[test_only]
module human_id::tests {
    use 0x0::sbt;

    #[test]
    fun test_mint_and_revoke() {
        use sui::test_scenario;

        // Create test addresses
        let admin = @0xABCD;
        let recipient = @0xBEEF;

        // Start testing scenario
        let mut scenario = test_scenario::begin(admin);
        
        // First transaction: Create minter capability
        {
            let ctx = test_scenario::ctx(&mut scenario);
            sbt::init_for_testing(ctx);
        };
        test_scenario::next_tx(&mut scenario, admin); // Advance to next tx

        // Second transaction: Mint an SBT
        {
            let cap = test_scenario::take_from_sender<sbt::MinterCap>(&scenario);
            
            // Scope for ctx usage
            {
                let ctx = test_scenario::ctx(&mut scenario);
                sbt::mint(
                    &cap,
                    recipient,
                    123, // circuit_id
                    1337, // action_id
                    7331, // action_nullifier  
                    100,  // expiry
                    ctx
                );
            };

            test_scenario::return_to_sender(&scenario, cap);
        };
        test_scenario::next_tx(&mut scenario, admin); // Advance to next tx

        // Third transaction: Check SBT properties and revoke
        {
            let cap = test_scenario::take_from_sender<sbt::MinterCap>(&scenario);
            let mut sbt = test_scenario::take_from_address<sbt::SoulBoundToken>(&scenario, recipient);
            
            // Verify SBT properties
            assert!(sbt::recipient(&sbt) == recipient, 0);
            assert!(sbt::circuit_id(&sbt) == 123, 1);
            assert!(sbt::action_id(&sbt) == 1337, 1);
            assert!(sbt::action_nullifier(&sbt) == 7331, 2);
            assert!(sbt::expiry(&sbt) == 100, 3);
            assert!(sbt::revoked(&sbt) == false, 4);
            assert!(sbt::minter(&sbt) == admin, 5);

            // Revoke the SBT
            sbt::revoke(&cap, &mut sbt);
            
            // Verify it was revoked
            assert!(sbt::revoked(&sbt) == true, 6);

            // Return objects
            test_scenario::return_to_sender(&scenario, cap);
            test_scenario::return_to_address(recipient, sbt);
        };

        test_scenario::end(scenario);
    }
}
