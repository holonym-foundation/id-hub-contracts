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
            
            return fields;
        }
        
        return null;
        
    } catch (error) {
        console.error('❌ Error getting SBT details:', error);
        throw error;
    }
}

/**
 * Test SBT accessor functions (these don't require clock)
 */
async function testAccessorFunctions() {
    console.log('🔧 Testing SBT accessor functions...');
    
    try {
        const tx = new TransactionBlock();
        
        // Test all the accessor functions
        tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::get_sbt_recipient`,
            arguments: [tx.object(SBT_OBJECT_ID)]
        });
        
        tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::get_sbt_circuit_id`,
            arguments: [tx.object(SBT_OBJECT_ID)]
        });
        
        tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::get_sbt_action_id`,
            arguments: [tx.object(SBT_OBJECT_ID)]
        });
        
        tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::is_sbt_revoked`,
            arguments: [tx.object(SBT_OBJECT_ID)]
        });
        
        const devResult = await client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: SBT_OWNER,
        });
        
        console.log('📊 Accessor functions result:');
        if (devResult.effects.status.status === 'success') {
            console.log('✅ Accessor functions executed successfully');
            
            // Extract return values from the results
            if (devResult.results) {
                devResult.results.forEach((result, index) => {
                    if (result.returnValues) {
                        result.returnValues.forEach((returnValue, valueIndex) => {
                            console.log(`  Function ${index}, Return ${valueIndex}:`, returnValue);
                        });
                    }
                });
            }
        } else {
            console.log('❌ Accessor functions failed:', devResult.effects.status.error);
        }
        
        return devResult;
        
    } catch (error) {
        console.error('❌ Error in accessor functions:', error);
        throw error;
    }
}

/**
 * Test time-based verification functions
 */
async function testTimeBasedVerification() {
    console.log('⏰ Testing time-based verification functions...');
    
    try {
        const tx = new TransactionBlock();
        
        // Test is_sbt_valid function with the shared Clock object
        tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::is_sbt_valid`,
            arguments: [
                tx.object(SBT_OBJECT_ID),
                tx.object('0x6') // Shared Clock object on mainnet
            ]
        });
        
        // Test is_sbt_expired function
        tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::is_sbt_expired`,
            arguments: [
                tx.object(SBT_OBJECT_ID),
                tx.object('0x6') // Shared Clock object on mainnet
            ]
        });
        
        const devResult = await client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: SBT_OWNER,
        });
        
        console.log('📊 Time-based verification result:');
        if (devResult.effects.status.status === 'success') {
            console.log('✅ Time-based verification executed successfully');
            
            // Extract return values
            if (devResult.results) {
                devResult.results.forEach((result, index) => {
                    if (result.returnValues) {
                        const functionName = index === 0 ? 'is_sbt_valid' : 'is_sbt_expired';
                        result.returnValues.forEach((returnValue: any) => {
                            // Boolean values are returned as [1] for true, [0] for false
                            const boolValue = Array.isArray(returnValue) && returnValue.length > 0 && returnValue[0] === 1;
                            console.log(`  ${functionName}: ${boolValue}`);
                        });
                    }
                });
            }
        } else {
            console.log('❌ Time-based verification failed:', devResult.effects.status.error);
        }
        
        return devResult;
        
    } catch (error) {
        console.error('❌ Error in time-based verification:', error);
        throw error;
    }
}

/**
 * Test circuit-specific verification
 */
async function testCircuitVerification(sbtFields: any) {
    console.log('🔧 Testing circuit-specific verification...');
    
    if (!sbtFields) {
        console.log('❌ No SBT fields available for testing');
        return;
    }
    
    try {
        const tx = new TransactionBlock();
        
        // Test with correct circuit ID
        tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::verify_sbt_for_circuit`,
            arguments: [
                tx.object(SBT_OBJECT_ID),
                tx.pure(sbtFields.circuit_id, 'u256'),
                tx.object('0x6') // Shared Clock object
            ]
        });
        
        // Test with incorrect circuit ID
        tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::verify_sbt_for_circuit`,
            arguments: [
                tx.object(SBT_OBJECT_ID),
                tx.pure('999999999', 'u256'), // Wrong circuit ID
                tx.object('0x6') // Shared Clock object
            ]
        });
        
        const devResult = await client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: SBT_OWNER,
        });
        
        console.log('📊 Circuit verification result:');
        if (devResult.effects.status.status === 'success') {
            console.log('✅ Circuit verification executed successfully');
            
            if (devResult.results) {
                devResult.results.forEach((result, index) => {
                    if (result.returnValues) {
                        const testType = index === 0 ? 'Correct Circuit ID' : 'Wrong Circuit ID';
                        result.returnValues.forEach((returnValue: any) => {
                            const boolValue = Array.isArray(returnValue) && returnValue.length > 0 && returnValue[0] === 1;
                            console.log(`  ${testType}: ${boolValue}`);
                        });
                    }
                });
            }
        } else {
            console.log('❌ Circuit verification failed:', devResult.effects.status.error);
        }
        
        return devResult;
        
    } catch (error) {
        console.error('❌ Error in circuit verification:', error);
        throw error;
    }
}

/**
 * Test action-specific verification
 */
async function testActionVerification(sbtFields: any) {
    console.log('🎯 Testing action-specific verification...');
    
    if (!sbtFields) {
        console.log('❌ No SBT fields available for testing');
        return;
    }
    
    try {
        const tx = new TransactionBlock();
        
        // Test with correct action ID
        tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::verify_sbt_for_action`,
            arguments: [
                tx.object(SBT_OBJECT_ID),
                tx.pure(sbtFields.action_id, 'u256'),
                tx.object('0x6') // Shared Clock object
            ]
        });
        
        // Test with incorrect action ID
        tx.moveCall({
            target: `${PACKAGE_ID}::sbt_verifier::verify_sbt_for_action`,
            arguments: [
                tx.object(SBT_OBJECT_ID),
                tx.pure('999999999', 'u256'), // Wrong action ID
                tx.object('0x6') // Shared Clock object
            ]
        });
        
        const devResult = await client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: SBT_OWNER,
        });
        
        console.log('📊 Action verification result:');
        if (devResult.effects.status.status === 'success') {
            console.log('✅ Action verification executed successfully');
            
            if (devResult.results) {
                devResult.results.forEach((result, index) => {
                    if (result.returnValues) {
                        const testType = index === 0 ? 'Correct Action ID' : 'Wrong Action ID';
                        result.returnValues.forEach((returnValue: any) => {
                            const boolValue = Array.isArray(returnValue) && returnValue.length > 0 && returnValue[0] === 1;
                            console.log(`  ${testType}: ${boolValue}`);
                        });
                    }
                });
            }
        } else {
            console.log('❌ Action verification failed:', devResult.effects.status.error);
        }
        
        return devResult;
        
    } catch (error) {
        console.error('❌ Error in action verification:', error);
        throw error;
    }
}

/**
 * Main function to run all tests
 */
async function main() {
    console.log('🚀 Starting SBT Verifier Tests (Simplified)');
    console.log('==========================================');
    console.log(`📦 Package ID: ${PACKAGE_ID}`);
    console.log(`🎯 SBT Object ID: ${SBT_OBJECT_ID}`);
    console.log(`👤 SBT Owner: ${SBT_OWNER}`);
    console.log('');
    
    try {
        // Get SBT details first
        const sbtFields = await getSBTDetails();
        console.log('');
        
        // Test accessor functions (no clock needed)
        await testAccessorFunctions();
        console.log('');
        
        // Test time-based verification functions
        await testTimeBasedVerification();
        console.log('');
        
        // Test circuit verification
        await testCircuitVerification(sbtFields);
        console.log('');
        
        // Test action verification
        await testActionVerification(sbtFields);
        console.log('');
        
        console.log('✅ All SBT verifier tests completed!');
        
    } catch (error) {
        console.error('💥 Test suite failed:', error);
        process.exit(1);
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}