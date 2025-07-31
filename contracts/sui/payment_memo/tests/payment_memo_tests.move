#[test_only]
module payment_memo::payment_memo_tests {
    use payment_memo::payment_memo;
    use sui::test_scenario::{Self as ts};
    use sui::clock;
    use std::string;

    const SENDER: address = @0xA;

    #[test]
    fun test_emit_memo_basic() {
        let mut scenario = ts::begin(SENDER);
        
        // Create a clock for testing
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);
        
        let ctx = ts::ctx(&mut scenario);
        
        // Test emitting a basic memo - function call verifies it compiles and runs
        let memo_text = string::utf8(b"Test payment memo");
        payment_memo::emit_memo(memo_text, &clock, ctx);
        
        // Clean up
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

}
