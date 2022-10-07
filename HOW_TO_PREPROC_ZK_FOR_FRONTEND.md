Example with `antiSybil.zok`
```
const { initialize } = require('zokrates-js')
initialize().then(z=>(zp=z))

antiSybilCode = fs.readFileSync('/path/to/antiSybil.zok')

antiSybilArtifacts = zp.compile(antiSybilCode.toString())

antiSybilABI = JSON.stringify(antiSybilArtifacts.abi) 
// copy/paste antiSybilABI into the frontend's src/constants/abi/ZokABIs.json under antiSybil key

fs.createWriteStream("./antiSybilProgram").write(Buffer.from(antiSybilArtifacts.program)) 
//then upload antiSybilProgram to preproc-zkp bucket on s3
```