// import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

// // Mainnet
// // const PACKAGE_ID = '0x53ddebd997f0e57dc899d598f12001930e228dddadf268a41d4c9a7c1df47a97'; // e.g., 0x1234...
// // Testnet
// const PACKAGE_ID = '0x3cd97d775e0cfdf9eebff0b48ebcb9f67fa19a8305fcc056e1e48cdc5a6ce051';
// const SBT_TYPE = `${PACKAGE_ID}::sbt::SoulBoundToken`;

// // Configure the Sui client (e.g., Testnet)
// const client = new SuiClient({
//     // url: getFullnodeUrl('mainnet'), // Use 'mainnet' for Mainnet, 'devnet' for Devnet, etc.
//     url: getFullnodeUrl('testnet'),
// });

// /**
//  * Check if an address owns an SBT of the specified type.
//  * @param address The Sui address to check (e.g., 0xabc...)
//  * @returns Promise<boolean> True if the address owns an SBT, false otherwise
//  */
// async function hasSBT(address: string): Promise<boolean> {
//     try {
//         // Query all objects owned by the address
//         const objects = await client.getOwnedObjects({
//             owner: address,
//             options: { showType: true }, // Include object type in the response
//         });

//         // Check if any object matches the SBT type
//         const hasSbt = objects.data.some((obj) => {
//             const type = obj.data?.type;
//             return type === SBT_TYPE;
//         });

//         return hasSbt;
//     } catch (error) {
//         console.error('Error querying SBT ownership:', error);
//         return false; // Handle errors gracefully
//     }
// }

// /**
//  * Example usage
//  */
// async function main(userAddress: string) {
//     // Replace with the address you want to check
//     // const userAddress = '0x643b7f742bb118e732b280c8ae03c537d23d0b34aef4e9e249bac024087cc1d0'; // e.g., the address that received the minted SBT

//     const ownsSBT = await hasSBT(userAddress);
//     console.log(`Address ${userAddress} owns an SBT: ${ownsSBT}`);

//     // Optional: If you want more details, fetch and log the SBT objects
//     if (ownsSBT) {
//         const sbtObjects = await client.getOwnedObjects({
//             owner: userAddress,
//             filter: { StructType: SBT_TYPE }, // Filter by SBT type
//             options: { showContent: true }, // Include object fields
//         });
//         console.log('SBT Details:', JSON.stringify(sbtObjects.data, null, 2));
//     }
// }

// async function actualMain() {
//   const addresses = [
//     '0x0624e81433086fce436f2f1a7e6417d47d8120527b935323c61908c8b0ee972a',
//     '0x0ae79b79c11bdc385eb37e452fa5927faca161dead92345d5328a6ceccf6124f',
//     '0x0d79e208ffbf1b4bea866bd862028c46abcbd8f9d9e629fdd2d7cac1c0e65777',
//     '0x1892db28ae5271b0bc9c4baf4bde19eab8fe0c8bc1ee5ca736369a3952365b51',
//     '0x1f61cf07e77f29d0d2a6f796f6f0f1dababdc461576daa5d038109df70cc183d',
//     '0x942f33c53f992fcc453ad6e702623bcd43a761fcfeb2051e3657c8eaa82c4052',
//     '0x96a5cbb66c3150eb5e61ebab9cef55b17083ee2ab903295dc90292a477acabbc',
//     '0xe86009704aa411c294da19518438ee70d2e530293fea0b63d1441cffaf29925b',
//   ]

//   for (const addr of addresses) {
//     try {
//         await main(addr)
//     } catch (err) {
//         console.log('err for addr', addr, err)
//     }
//   }
// }
// // Run the script
// actualMain().catch(console.error);


import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({
  url: getFullnodeUrl('mainnet'), // Use 'mainnet' for Mainnet, 'devnet' for Devnet, etc.
  // url: getFullnodeUrl('testnet'),
});

const PACKAGE = '0x53ddebd997f0e57dc899d598f12001930e228dddadf268a41d4c9a7c1df47a97'
const SBT_EVENT = '0x53ddebd997f0e57dc899d598f12001930e228dddadf268a41d4c9a7c1df47a97::sbt::SBTMinted'
const RELAYER_ADDR = '0x0ae79b79c11bdc385eb37e452fa5927faca161dead92345d5328a6ceccf6124f'

async function main() {
  let totalEvents = 0
  let successCount = 0

  let cursor = null
  do {
    const result = await client.queryEvents({
      query: {
        Sender: RELAYER_ADDR
      },
      cursor,
    })

    totalEvents += result.data.length
    for (const event of result.data) {
      if (event.type == SBT_EVENT) {
        successCount++;
      }
    }

    if (result.nextCursor != cursor) {
      cursor = result.nextCursor
    } else {
      cursor = null
    }
    
    console.log('Successful SBT mints:', successCount)
  } while (cursor)

  console.log('totalEvents:', totalEvents)
  console.log('Successful SBT mints:', successCount)

}

main()
  .then(() => {
    process.exit(0)
  })
  .catch(() => {
    process.exit(1)
  })
