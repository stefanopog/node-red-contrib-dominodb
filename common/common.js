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
    //
    //  This function retrieves a NUMERIC value which can be provided
    //  - either by the Configuration Panel
    //  - or by an input msg. attribute
    //
    //  The value from the COnfiguration Panel takes precedence over the input msg. attribute
    //
    //  If no value is provided, an WARNING is generated
    //
    //  The value is returned in an object (named array) which can either be created by this function or taken as an input parameter
    //
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

function __getMandatoryInputFromSelect(moduleName, fromConfig, fromMsg, label, values, theMsg, theNode) {
    //
    //  This function gets the final value of an input which could be provided by :
    //  - either the Configuration Panel
    //  - or by an input msg. attribute
    //
    //  The Configuration Panel can provide the user the choice among the values stored in the "values" input paramter of this function
    //  with the addition of the "fromMsg" value.
    //  In case the Configuration Panel is set to be "fromMsg", then the value is taken from the input msg. attribute
    //
    //  In case the final value is not in the input "values" paramter array, a NULL value is returned
    //
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
    //
    //  This function retrieves a value which can be provided
    //  - either by the Configuration Panel
    //  - or by an input msg. attribute
    //
    //  The value from the COnfiguration Panel takes precedence over the input msg. attribute
    //
    //  If no value is provided, an ERROR is generated
    //
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
    //
    //  This function retrieves a value which can be provided
    //  - either by the Configuration Panel
    //  - or by an input msg. attribute
    //
    //  The value from the COnfiguration Panel takes precedence over the input msg. attribute
    //
    //  If no value is provided, an WARNING is generated
    //
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

function __getNameValueArray(inputString) {
    //
    //  This function takes a comma-separated input string containing < name = "value" > pairs and returns an array of objects
    //  where each object has the name and the value attribute
    //  The < value > can be enclosed in double-quotes or single-quotes in the original string
    //
    const betweenQuotes = /((?<![\\])['"])((?:.(?!(?<![\\])\1))*.?)\1/;
    const parExp = /(\w+)\s*=\s*(["'])((?:(?!\2).)*)\2[\s*,\s*]?/g; // https://stackoverflow.com/questions/17007616/regular-expression-to-match-key-value-pairs-where-value-is-in-quotes-or-apostrop
    var m;
    var outArray = [];
    while (m = parExp.exec(inputString)) {
        let obj = {};
        obj.name = m[1];
        obj.value = m[3];
        outArray.push(obj);
    }
    return outArray;
}

module.exports = {__log, 
                  __logJson, 
                  __logError, 
                  __logWarning, 
                  __getOptionValue, 
                  __getMandatoryInputFromSelect, 
                  __getMandatoryInputString, 
                  __getOptionalInputString,
                  __getNameValueArray};
