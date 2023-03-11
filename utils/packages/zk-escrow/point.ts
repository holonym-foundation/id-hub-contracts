// class Point {

//     x: BigInt
//     y: BigInt

//     constructor(x: BigInt, y: BigInt){
//         this.x = x;
//         this.y = y;
//     }
//     fromDecStrings(x: string, y: string): Point {
//         return new Point(
//             BigInt(x),
//             BigInt(y)
//         );
//     }
//     fromHexStrings(x: string, y: string): Point {
//         let [x_, y_] = [x,y].map(i=> 
//             i.startsWith('0x') ? BigInt(i) : BigInt('0x' + i)
//         );
//         return new Point(x_, y_);
//     }
    
//     toRepr(): PointRepr {
//         return {
//             x: this.x.toString(),
//             y: this.y.toString()
//         }
//     }

// }
// // function hexPointToPoint(h: HexStringPoint): Point {
// //     return BigInt:
// // }
// // function decPointToPoint(d: DecStringPoint): Point {

// // }
// // function pointToDecPoint()
// module.exports = {
//     Point: Point
// }
