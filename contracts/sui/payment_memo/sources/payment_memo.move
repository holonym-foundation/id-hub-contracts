/*
/// Module: payment_memo
module payment_memo::payment_memo;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions

module payment_memo::payment_memo {
    use std::string::String;
    use sui::event;

    /// Event emitted when a payment memo is recorded
    public struct PaymentMemo has copy, drop {
        sender: address,
        memo: String,
        timestamp: u64,
    }

    /// Emit a payment memo event
    /// Include this in the same PTB as a transfer to associate your payment memo with
    /// the actual payment
    public fun emit_memo(memo: String, clock: &sui::clock::Clock, ctx: &TxContext) {
        let payment_memo = PaymentMemo {
            sender: ctx.sender(),
            memo,
            timestamp: sui::clock::timestamp_ms(clock),
        };
        
        event::emit(payment_memo);
    }
}
