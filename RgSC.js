const shim = require('fabric-shim');
const utils = require('./utils')

var Chaincode = class {
    async Init(stub) {
        // do nothing in the init
        return shim.success();
    }

    async Invoke(stub) {
        let input = stub.getFunctionAndParameters();
        if (input.fun != "select") {
            return shim.error("the invoke function is incorrect");
        }
        let params = input.params;

        let so = []
        let vrfDictionary = []
        let r = params["requestData"];
        let o = await stub.getState("scosInfo");
        if (r.length < o.length) {
            for (let i in o) {
                let seed = i + Date.now()
                let randomValue = utils.vrf(seed, global.Hyperledger.privatePEM)
                vrfDictionary.push([i, randomValue])
            }
            vrfDictionary = utils.sortByValuesDesc(vrfDictionary)
            so = utils.getKeys(vrfDictionary.slice(0, r.length))
        }
        else {
            so = o
        }

        return shim.success(so)
    }
}

shim.start(new Chaincode());