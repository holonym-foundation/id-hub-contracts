use crate::CleanHandsSBTContract;
use dep::aztec::{
    prelude::{AztecAddress},
    test::helpers::{test_environment::TestEnvironment},
    protocol_types::{traits::{ToField}},
};

// ----- Utils -----

pub unconstrained fn setup() -> (&mut TestEnvironment, AztecAddress, AztecAddress, AztecAddress) {
    // Setup env, generate keys
    let mut env = TestEnvironment::new();
    // let owner = env.create_account();
    // let recipient = env.create_account();
    let owner = env.create_account_contract(1);
    let recipient = env.create_account_contract(2);

    // Start the test in the account contract address
    env.impersonate(owner);

    // Deploy contract
    let initializer_call_interface = CleanHandsSBTContract::interface().constructor(owner);
    let sbt_contract = env.deploy_self("CleanHandsSBTContract").with_public_void_initializer(initializer_call_interface);
    let contract_address = sbt_contract.to_address();
    env.advance_block_by(1);
    (&mut env, contract_address, owner, recipient)
}

// ----- END: Utils -----

#[test]
unconstrained fn access_control() {
    // Setup without account contracts. We are not using authwits here, so dummy accounts are enough
    let (env, contract_address, owner, recipient) = setup();

    // Set a new owner
    CleanHandsSBTContract::at(contract_address).set_owner(recipient).call(&mut env.public());

    // Check it worked
    let owner = CleanHandsSBTContract::at(contract_address).get_owner().view(&mut env.public());
    assert(owner == recipient);

    // Impersonate original owner
    // env.impersonate(owner);

    // Try to set ourselves as owner, fail miserably
    env.assert_public_call_fails(CleanHandsSBTContract::at(contract_address).set_owner(recipient));
}
