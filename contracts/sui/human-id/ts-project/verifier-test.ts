import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';

// Deployed SBT Verifier package ID (latest deployment)
const PACKAGE_ID = '0x4527711bfa5dc375903e431f43e013e59c1973864b37270d4c2355b0bbc64ec0';

// SBT to test with
const SBT_OBJECT_ID = '0x3ac49ae57a7cf046b1f212803cb8e1db3d6a29a699a158b2a55b81338c664ea8';
const SBT_OWNER = '0x643b7f742bb118e732b280c8ae03c537d23d0b34aef4e9e249bac024087cc1d0';

// Configure the Sui client for mainnet
const client = new SuiClient({
    url: getFullnodeUrl('mainnet'),
});

/**
 * Test the SBT verifier with basic verification
 */
async function testBasicVerification() {
    console.log('🧪 Testing basic SBT verification...');
    
    try {
        const tx = new TransactionBlock();
        
        // Call is_sbt_valid function with the shared Clock object
        const result = tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::is_sbt_valid`,
            arguments: [
                tx.object(SBT_OBJECT_ID),
                tx.object('0x6') // Shared Clock object on mainnet
            ]
        });
        
        // Since we can't execute transactions without a keypair, let's use devInspect
        const devResult = await client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: SBT_OWNER,
        });
        
        console.log('📊 Basic verification result:');
        if (devResult.effects.status.status === 'success') {
            console.log('✅ SBT verification successful');
        } else {
            console.log('❌ SBT verification failed:', devResult.effects.status.error);
        }
        
        return devResult;
        
    } catch (error) {
        console.error('❌ Error in basic verification:', error);
        throw error;
    }
}

/**
 * Test detailed SBT verification that returns a VerificationResult
 */
async function testDetailedVerification() {
    console.log('🔍 Testing detailed SBT verification...');
    
    try {
        const tx = new TransactionBlock();
        
        // Call verify_sbt function
        const result = tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::verify_sbt`,
            arguments: [
                tx.object(SBT_OBJECT_ID),
                tx.object('0x6') // Clock object
            ]
        });
        
        // Test the result accessors
        tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::result_is_valid`,
            arguments: [result]
        });
        
        tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::result_recipient`,
            arguments: [result]
        });
        
        tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::result_circuit_id`,
            arguments: [result]
        });
        
        const devResult = await client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: SBT_OWNER,
        });
        
        console.log('📊 Detailed verification result:', devResult);
        return devResult;
        
    } catch (error) {
        console.error('❌ Error in detailed verification:', error);
        throw error;
    }
}

/**
 * Test circuit-specific verification
 */
async function testCircuitVerification() {
    console.log('🔧 Testing circuit-specific verification...');
    
    try {
        // From the SBT data we saw: circuit_id = 19423862195071118118035339997374069146889939500094220754464143644873512189952
        const expectedCircuitId = '19423862195071118118035339997374069146889939500094220754464143644873512189952';
        
        const tx = new TransactionBlock();
        
        // Test with correct circuit ID
        const validResult = tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::verify_sbt_for_circuit`,
            arguments: [
                tx.object(SBT_OBJECT_ID),
                tx.pure(expectedCircuitId, 'u256'),
                tx.object('0x6') // Clock object
            ]
        });
        
        // Test with incorrect circuit ID
        const invalidResult = tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::verify_sbt_for_circuit`,
            arguments: [
                tx.object(SBT_OBJECT_ID),
                tx.pure('999999999', 'u256'), // Wrong circuit ID
                tx.object('0x6') // Clock object
            ]
        });
        
        const devResult = await client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: SBT_OWNER,
        });
        
        console.log('📊 Circuit verification result:', devResult);
        return devResult;
        
    } catch (error) {
        console.error('❌ Error in circuit verification:', error);
        throw error;
    }
}

/**
 * Test action-specific verification
 */
async function testActionVerification() {
    console.log('🎯 Testing action-specific verification...');
    
    try {
        // From the SBT data we saw: action_id = 123456789
        const expectedActionId = '123456789';
        
        const tx = new TransactionBlock();
        
        // Test with correct action ID
        const validResult = tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::verify_sbt_for_action`,
            arguments: [
                tx.object(SBT_OBJECT_ID),
                tx.pure(expectedActionId, 'u256'),
                tx.object('0x6') // Clock object
            ]
        });
        
        // Test with incorrect action ID
        const invalidResult = tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::verify_sbt_for_action`,
            arguments: [
                tx.object(SBT_OBJECT_ID),
                tx.pure('999999999', 'u256'), // Wrong action ID
                tx.object('0x6') // Clock object
            ]
        });
        
        const devResult = await client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: SBT_OWNER,
        });
        
        console.log('📊 Action verification result:', devResult);
        return devResult;
        
    } catch (error) {
        console.error('❌ Error in action verification:', error);
        throw error;
    }
}

/**
 * Get SBT details for verification
 */
async function getSBTDetails() {
    console.log('📋 Getting SBT details...');
    
    try {
        const sbtObject = await client.getObject({
            id: SBT_OBJECT_ID,
            options: { showContent: true }
        });
        
        console.log('📄 SBT Object Details:');
        console.log(`  Object ID: ${SBT_OBJECT_ID}`);
        console.log(`  Owner: ${SBT_OWNER}`);
        
        if (sbtObject.data?.content && 'fields' in sbtObject.data.content) {
            const fields = sbtObject.data.content.fields as any;
            console.log(`  Circuit ID: ${fields.circuit_id}`);
            console.log(`  Action ID: ${fields.action_id}`);
            console.log(`  Action Nullifier: ${fields.action_nullifier}`);
            console.log(`  Recipient: ${fields.recipient}`);
            console.log(`  Minter: ${fields.minter}`);
            console.log(`  Expiry: ${fields.expiry} (${new Date(parseInt(fields.expiry) * 1000).toISOString()})`);
            console.log(`  Revoked: ${fields.revoked}`);
        }
        
        return sbtObject;
        
    } catch (error) {
        console.error('❌ Error getting SBT details:', error);
        throw error;
    }
}

/**
 * Test SBT accessor functions
 */
async function testAccessorFunctions() {
    console.log('🔧 Testing SBT accessor functions...');
    
    try {
        const tx = new TransactionBlock();
        
        // Test all the accessor functions
        const recipient = tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::get_sbt_recipient`,
            arguments: [tx.object(SBT_OBJECT_ID)]
        });
        
        const circuitId = tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::get_sbt_circuit_id`,
            arguments: [tx.object(SBT_OBJECT_ID)]
        });
        
        const actionId = tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::get_sbt_action_id`,
            arguments: [tx.object(SBT_OBJECT_ID)]
        });
        
        const expired = tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::is_sbt_expired`,
            arguments: [
                tx.object(SBT_OBJECT_ID),
                tx.object('0x6') // Clock object
            ]
        });
        
        const revoked = tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::is_sbt_revoked`,
            arguments: [tx.object(SBT_OBJECT_ID)]
        });
        
        const devResult = await client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: SBT_OWNER,
        });
        
        console.log('📊 Accessor functions result:', devResult);
        return devResult;
        
    } catch (error) {
        console.error('❌ Error in accessor functions:', error);
        throw error;
    }
}

/**
 * Main function to run all tests
 */
async function main() {
    console.log('🚀 Starting SBT Verifier Tests');
    console.log('===============================');
    console.log(`📦 Package ID: ${PACKAGE_ID}`);
    console.log(`🎯 SBT Object ID: ${SBT_OBJECT_ID}`);
    console.log(`👤 SBT Owner: ${SBT_OWNER}`);
    console.log('');
    
    try {
        // Get SBT details first
        await getSBTDetails();
        console.log('');
        
        // Run all verification tests
        await testBasicVerification();
        console.log('');
        
        await testDetailedVerification();
        console.log('');
        
        await testCircuitVerification();
        console.log('');
        
        await testActionVerification();
        console.log('');
        
        await testAccessorFunctions();
        console.log('');
        
        console.log('✅ All SBT verifier tests completed successfully!');
        
    } catch (error) {
        console.error('💥 Test suite failed:', error);
        process.exit(1);
    }
}

// Export functions for potential reuse
export {
    testBasicVerification,
    testDetailedVerification,
    testCircuitVerification,
    testActionVerification,
    getSBTDetails,
    testAccessorFunctions
};

// Run the tests if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}