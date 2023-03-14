const shim = require('fabric-shim');
const utils = require('./utils')

var Chaincode = class {
    async Init(stub) {
        // do nothing in the init
        return shim.success();
    }

    async Invoke(stub) {
        let input = stub.getFunctionAndParameters();
        if (input.fun != "verify") {
            return shim.error("the invoke function is incorrect");
        }
        let params = input.params;

        // Cross-validation with public data and signature verification
        let scoSigVerified = []
        let sosco = params["sosco"]
        let temperatureThreshold = await stub.getState("temperatureThreshold");
        let pu = await stub.getState("pubKeyHash");
        for (let sco of sosco) {
            let dataAndSigs = utils.getDataAndSig(sco)
            let puVerify = []
            for (let dataAndSig of dataAndSigs) {
                let dataUnit = dataAndSig[0]
                let sig = dataAndSig[1]
                let vp = utils.getPublicData(dataUnit)
                if ((dataUnit["temperature"] - vp["temperature"]) < temperatureThreshold) {
                    puVerify.push([dataUnit, sig])
                }
            }
            let puHash = utils.genHashTree(puVerify)
            if (puHash == pu) {
                scoSigVerified.push(sco)
            }
        }

        // Cross-validation between SCOs
        let dataSigVerified = utils.getAllData(scoSigVerified)
        let dataCounter = []
        let resolution = await stub.getState("resolution");
        for (let i of dataSigVerified) {
            let data = utils.round(i, resolution)
            if (dataCounter[data]) {
                dataCounter[data]++
            }
            else {
                dataCounter[data] = 1
            }
        }
        let maxValueData = utils.getMaxValue(dataCounter)
        if (maxValueData.value < scoSigVerified.length/2) {
            let scoVerified = utils.invokeChaincode("reputationSideChain", "reputionChaincode", "getTopReputation", scoSigVerified)
            scoVerified["reputationScore"] = 100
            return shim.success(scoVerified)
        }
        else {
            let scoVerifieds = utils.getMatchedSco(maxValueData)
            for (let scoVerified of scoVerifieds) {
                scoVerified["reputationScore"] = 100
            }
            return shim.success(scoVerifieds)
        }
    }
}

shim.start(new Chaincode());