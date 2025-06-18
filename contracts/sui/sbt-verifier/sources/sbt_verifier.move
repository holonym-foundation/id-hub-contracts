module sbt_verifier::sbt_verifier {
    use human_id::sbt::{Self, SoulBoundToken};
    use sui::clock::Clock;

    const ESBTExpired: u64 = 1;
    const ESBTRevoked: u64 = 2;
    const EInvalidCircuit: u64 = 3;
    const EInvalidAction: u64 = 4;

    public struct VerificationResult has copy, drop {
        is_valid: bool,
        recipient: address,
        circuit_id: u256,
        action_id: u256,
        expiry: u64,
        is_expired: bool,
        is_revoked: bool,
    }

    public fun verify_sbt(
        sbt: &SoulBoundToken,
        clock: &Clock
    ): VerificationResult {
        let current_time_ms = sui::clock::timestamp_ms(clock);
        let current_time_s = current_time_ms / 1000;
        let expiry_time = sbt::expiry(sbt);
        let is_expired = current_time_s > expiry_time;
        let is_revoked = sbt::revoked(sbt);
        let is_valid = !is_expired && !is_revoked;

        VerificationResult {
            is_valid,
            recipient: sbt::recipient(sbt),
            circuit_id: sbt::circuit_id(sbt),
            action_id: sbt::action_id(sbt),
            expiry: expiry_time,
            is_expired,
            is_revoked,
        }
    }

    public fun verify_sbt_for_circuit(
        sbt: &SoulBoundToken,
        expected_circuit_id: u256,
        clock: &Clock
    ): bool {
        let result = verify_sbt(sbt, clock);
        result.is_valid && result.circuit_id == expected_circuit_id
    }

    public fun verify_sbt_for_action(
        sbt: &SoulBoundToken,
        expected_action_id: u256,
        clock: &Clock
    ): bool {
        let result = verify_sbt(sbt, clock);
        result.is_valid && result.action_id == expected_action_id
    }

    public fun verify_sbt_for_circuit_and_action(
        sbt: &SoulBoundToken,
        expected_circuit_id: u256,
        expected_action_id: u256,
        clock: &Clock
    ): bool {
        let result = verify_sbt(sbt, clock);
        result.is_valid && 
        result.circuit_id == expected_circuit_id &&
        result.action_id == expected_action_id
    }

    public fun is_sbt_valid(sbt: &SoulBoundToken, clock: &Clock): bool {
        let result = verify_sbt(sbt, clock);
        result.is_valid
    }

    public fun is_sbt_expired(sbt: &SoulBoundToken, clock: &Clock): bool {
        let current_time_ms = sui::clock::timestamp_ms(clock);
        let current_time_s = current_time_ms / 1000;
        current_time_s > sbt::expiry(sbt)
    }

    public fun is_sbt_revoked(sbt: &SoulBoundToken): bool {
        sbt::revoked(sbt)
    }

    public fun get_sbt_recipient(sbt: &SoulBoundToken): address {
        sbt::recipient(sbt)
    }

    public fun get_sbt_circuit_id(sbt: &SoulBoundToken): u256 {
        sbt::circuit_id(sbt)
    }

    public fun get_sbt_action_id(sbt: &SoulBoundToken): u256 {
        sbt::action_id(sbt)
    }

    public fun assert_sbt_valid(sbt: &SoulBoundToken, clock: &Clock) {
        assert!(!is_sbt_expired(sbt, clock), ESBTExpired);
        assert!(!is_sbt_revoked(sbt), ESBTRevoked);
    }

    public fun assert_sbt_for_circuit(
        sbt: &SoulBoundToken,
        expected_circuit_id: u256,
        clock: &Clock
    ) {
        assert_sbt_valid(sbt, clock);
        assert!(sbt::circuit_id(sbt) == expected_circuit_id, EInvalidCircuit);
    }

    public fun assert_sbt_for_action(
        sbt: &SoulBoundToken,
        expected_action_id: u256,
        clock: &Clock
    ) {
        assert_sbt_valid(sbt, clock);
        assert!(sbt::action_id(sbt) == expected_action_id, EInvalidAction);
    }

    public fun assert_sbt_for_circuit_and_action(
        sbt: &SoulBoundToken,
        expected_circuit_id: u256,
        expected_action_id: u256,
        clock: &Clock
    ) {
        assert_sbt_valid(sbt, clock);
        assert!(sbt::circuit_id(sbt) == expected_circuit_id, EInvalidCircuit);
        assert!(sbt::action_id(sbt) == expected_action_id, EInvalidAction);
    }

    public fun result_is_valid(result: &VerificationResult): bool {
        result.is_valid
    }

    public fun result_recipient(result: &VerificationResult): address {
        result.recipient
    }

    public fun result_circuit_id(result: &VerificationResult): u256 {
        result.circuit_id
    }

    public fun result_action_id(result: &VerificationResult): u256 {
        result.action_id
    }

    public fun result_expiry(result: &VerificationResult): u64 {
        result.expiry
    }

    public fun result_is_expired(result: &VerificationResult): bool {
        result.is_expired
    }

    public fun result_is_revoked(result: &VerificationResult): bool {
        result.is_revoked
    }
}