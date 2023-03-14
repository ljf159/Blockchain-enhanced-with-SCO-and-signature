const shim = require('fabric-shim');
const utils = require('./utils')

var Chaincode = class {
    async Init(stub) {
        // do nothing in the init
        return shim.success();
    }

    async Invoke(stub) {
        let input = stub.getFunctionAndParameters();
        if (input.fun != "accumulateReputation") {
            return shim.error("the invoke function is incorrect");
        }
        let params = input.params;

        let maxAccumReputation = 0
        let scoMaxAccumReputation = {}
        let scoSigVerified = params["scoSigVerified"]
        for (let i of scoSigVerified) {
            if (i["accumReputationScore"] >= maxAccumReputation) {
                maxAccumReputation = i["accumReputationScore"]
                scoMaxAccumReputation = i
            }
        }
        
        return shim.success(scoMaxAccumReputation)
    }
}

shim.start(new Chaincode());