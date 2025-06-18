# SBT Verifier - Sui Mainnet Deployment

## Deployment Summary
- **Transaction Digest**: `9pegBpXgRhMyyeuSHYPSD8VFGjfExhNyrz5P3rxhm58V`

## Package Information
- **Package ID**: `0x4527711bfa5dc375903e431f43e013e59c1973864b37270d4c2355b0bbc64ec0`
- **Version**: 1
- **Modules**: `sbt_verifier`
- **Owner**: Immutable

## Dependencies
- **Human-ID Package**: `0x53ddebd997f0e57dc899d598f12001930e228dddadf268a41d4c9a7c1df47a97`
- **Sui Framework**: `0x0000000000000000000000000000000000000000000000000000000000000002`
- **Move Standard Library**: `0x0000000000000000000000000000000000000000000000000000000000000001`

## Created Objects

### UpgradeCap
- **Object ID**: `0x62b60e8339022ce2348aed4967dffa09ffecb942bc85ec79a83f82692b599325`
- **Owner**: `0x0ae79b79c11bdc385eb37e452fa5927faca161dead92345d5328a6ceccf6124f`
- **Type**: `0x2::package::UpgradeCap`

## Usage Examples

### TypeScript Integration

```typescript
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';

const VERIFIER_PACKAGE_ID = '0x4527711bfa5dc375903e431f43e013e59c1973864b37270d4c2355b0bbc64ec0';
const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

async function verifySBT(sbtObjectId: string, ownerAddress: string) {
    const tx = new TransactionBlock();
    
    // Check if SBT is valid
    tx.moveCall({
        target: `${VERIFIER_PACKAGE_ID}::sbt_verifier::is_sbt_valid`,
        arguments: [
            tx.object(sbtObjectId),
            tx.object('0x6') // Shared Clock object
        ]
    });
    
    const result = await client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: ownerAddress,
    });
    
    return result;
}

// Circuit-specific verification
async function verifyForCircuit(sbtObjectId: string, circuitId: string, ownerAddress: string) {
    const tx = new TransactionBlock();
    
    tx.moveCall({
        target: `${VERIFIER_PACKAGE_ID}::sbt_verifier::verify_sbt_for_circuit`,
        arguments: [
            tx.object(sbtObjectId),
            tx.pure(circuitId, 'u256'),
            tx.object('0x6')
        ]
    });
    
    return await client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: ownerAddress,
    });
}
```
