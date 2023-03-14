const shim = require('fabric-shim');
const utils = require('./utils')

var Chaincode = class {
    async Init(stub) {
        // do nothing in the init
        return shim.success();
    }

    async Invoke(stub) {
        let input = stub.getFunctionAndParameters();
        if (input.fun != "genRequest") {
            return shim.error("the invoke function is incorrect");
        }
        let params = input.params;

        let r = []
        let stakeholder = params["stakeholder"]
        let dataContentRequested = params["dataContentRequested"]
        let o = await stub.getState("oracles");
        let interval = await stub.getState("interval");
        let scoNumber = await stub.getState("scoNumber");
        if (utils.authenticate(stakeholder)) {
            for (let i of o) {
                let now = utils.round(Date.Now(), interval)
                let signData = utils.genSign(dataContentRequested, stakeholder, scoNumber, i["address"], now)
                r.push(utils.signSslJwt(signData))
            }
        }
        
        return shim.success(r)
    }
}

shim.start(new Chaincode());