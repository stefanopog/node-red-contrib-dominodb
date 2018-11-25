function __log(moduleName, isDebug, logMsg) {
    if (isDebug) {
        console.log(moduleName + " => " + logMsg);
    };
};
//
//  Common logging function with JSON Objects
//
function __logJson(moduleName, isDebug, logMsg, jsonObj) {
    if (isDebug) {
        console.log(moduleName + " => " + (logMsg ? logMsg : ""));
        console.log(JSON.stringify(jsonObj, " ", 2));
    };
};

function __logError(moduleName, theString, config, error, theMsg, theNode) {
    var errString = moduleName + ' : ' + theString;
    console.log(errString);
    if (config) console.log(JSON.stringify(config, ' ', 2));
    if (error) {
        console.log(moduleName + ' : Error Follows : ');
        console.log(JSON.stringify(error, ' ', 2));
    }
    if (error) {
        theMsg.DDB_fatal = error;
    } else {
        if (config) {
            theMsg.DDB_fatal = {
                message: errString,
                details: config};
        } else {
            theMsg.DDB_fatal = {
                message: errString
            };
        }
    }
    theNode.status({
        fill: "red",
        shape: "dot",
        text: errString
    });
    theNode.error(errString, theMsg);
}

function __logWarning(moduleName, theString, theNode) {
    var warnString = moduleName + ' : ' + theString;
    console.log(warnString);
    theNode.status({fill: "yellow", shape: "dot", text: warnString});
    theNode.warn(warnString);
}

function __getOptionValue(moduleName, theLimits, theOption, fromConfig, fromMsg, theNode) {
    var value = 0;
    if ((fromConfig.trim() === '') && ((fromMsg === undefined) || (fromMsg.trim() === ''))) {
        __logWarning(moduleName, theOption + ' set to default', theNode);
    } else {
        if (fromConfig !== '') {
            value = fromConfig;
        } else {
            value = fromMsg;
        }
        if (Number(value) && Number.isInteger(Number(value)) && (value > 0)) {
            //
            //  This is an OK value
            //
            if (!theLimits) theLimits = {};
            theLimits[theOption] = value;
        } else {
            //
            //  Not numeric, or not integer or negative integer
            //
            __logWarning(moduleName, theOption + ' set to default', theNode);
        }
    }
    return theLimits;
}

function __getMandatorInputFromSelect(moduleName, fromConfig, fromMsg, label, values, theMsg, theNode) {
    var theValue = null;
    if ((fromConfig.trim() === '') && (!fromMsg || (fromMsg.trim() === ''))) {
        __logError(moduleName, "Missing " + label + " string", null, null, theMsg, theNode);
    } else {
        if (fromConfig.trim() !== '') {
            if (fromConfig === 'fromMsg') {
                if (!fromMsg || (fromMsg.trim() === '')) {
                    __logError(moduleName, "Missing " + label + " string", null, null, msg, node);
                    return;
                } else {
                    theValue = fromMsg.trim();
                }
            } else {
                theValue = fromConfig.trim();
            }
        } else {
            theValue = fromMsg.trim();
        }
        if (!values.includes(theValue)) {
            __logError(moduleName, "Invalid " + label + " string : " + theValue, null, null, theMsg, theNode);
            theValue = null;
        }
    }
    return theValue;
}

function __getMandatoryInputString(moduleName, fromConfig, fromMsg, label, theMsg, theNode) {
    var theValue = null;
    if ((fromConfig.trim() === '') && ((fromMsg === undefined) || ((typeof fromMsg) !== 'string') || (fromMsg.trim() === ''))) {
        __logError(moduleName, "Missing " + label + " string", null, null, theMsg, theNode);
    } else {
        if (fromConfig.trim() !== '') {
            theValue = fromConfig.trim();
        } else {
            theValue = fromMsg.trim();
        }
    }
    return theValue;
}

function __getOptionalInputString(moduleName, fromConfig, fromMsg, label, theMsg, theNode) {
    var theValue = null;
    if ((fromConfig.trim() === '') && ((fromMsg === undefined) || ((typeof fromMsg) !== 'string') || (fromMsg.trim() === ''))) {
        __logWarning(moduleName, "Missing " + label + " string", theNode);
    } else {
        if (fromConfig.trim() !== '') {
            theValue = fromConfig.trim();
        } else {
            theValue = fromMsg.trim();
        }
    }
    return theValue;
}

module.exports = {__log, __logJson, __logError, __logWarning, __getOptionValue, __getMandatorInputFromSelect, __getMandatoryInputString, __getOptionalInputString};
