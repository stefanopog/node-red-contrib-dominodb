//
//  Utility to transfor an Array to an OBJECT
//  Used in previous versions
//
/*
const arrayToObject = (array, keyField) =>
array.reduce((obj, item) => {
  obj[item[keyField]] = item.value;
  return obj;
}, {});
*/

function __log(moduleName, isDebug, logMsg) {
    if (isDebug) {
        console.log(moduleName + " => " + logMsg);
    };
};
//
//  Common logging function with JSON Objects
//
function __logJson(moduleName, isDebug, logMsg, jsonObj, isConfig=false) {
    if (isDebug) {
        if (isConfig) {
            console.log(moduleName + " => " + (logMsg ? logMsg : ""));
            console.log('hostName : ' + jsonObj.hostName);
            console.log(JSON.stringify(jsonObj.connection, " ", 2));
        } else {
            console.log(moduleName + " => " + (logMsg ? logMsg : ""));
            console.log(JSON.stringify(jsonObj, " ", 2));
        }
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

function __getMandatoryInputString(moduleName, fromConfig, fromMsg, onlyFromMsg, label, theMsg, theNode) {
    //
    //  This function retrieves a value which can be provided
    //  - either by the Configuration Panel
    //  - or by an input msg. attribute
    //
    //  The value from the COnfiguration Panel takes precedence over the input msg. attribute
    //
    //  IF onlyFromMsg==="fromMsg", then any value from the ConfigurationPanel will NOT be taken in account (())
    //
    //  If no value is provided, an ERROR is generated
    //
    var theValue = null;
    if (onlyFromMsg === 'fromMsg') {
        if ((fromMsg === undefined) || ((typeof fromMsg) !== 'string') || (fromMsg.trim() === '')) {
            __logError(moduleName, "Missing " + label + " string", null, null, theMsg, theNode);
        } else {
            theValue = fromMsg.trim();
        }
    } else {
        if ((fromConfig.trim() === '') && ((fromMsg === undefined) || ((typeof fromMsg) !== 'string') || (fromMsg.trim() === ''))) {
            __logError(moduleName, "Missing " + label + " string", null, null, theMsg, theNode);
        } else {
            if (fromConfig.trim() !== '') {
                theValue = fromConfig.trim();
            } else {
                theValue = fromMsg.trim();
            }
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
    //  If no value is provided, a WARNING is generated
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
//
//  If the input is an Array of objects, where each object has a "name" and a "value" attributes, it transforms it 
//  in an object where each "name" becomes a first class attribute (with its associated value)
//
function __getItemValuesFromMsg(theInput) {
    if (theInput) {
        if (Array.isArray(theInput)) {
            //
            //  Old-Style Array
            //  We need to convert into an Object
            //
            tmpObj = {};
            for (let i=0; i < theInput.length; i++) {
                if (theInput[i].name && theInput[i].value) {
                    tmpObj[theInput[i].name] = theInput[i].value;
                }
            }
             return tmpObj;
        } else {
            return theInput;
        }
    } else {
        return theInput;
    }
}
function __getNameValueArray(inputString) {
    //
    //  This function takes a comma-separated input string containing the following types of pairs:
    //      String pairs    :   name = "theString"    or   name = 'theString'
    //      Numerica pairs  :   name = 123  or name = 123.45   (no quotes nor double quotes)
    //      Date pairs      :   name = dt('ISO FORMATTED DATE STRING')    (using single quotes)
    //  Equal sign can be surrounded by 0 or more white spaces (before and after)
    //
    //  Thanks to :
    //      - https://stackoverflow.com/questions/17007616/regular-expression-to-match-key-value-pairs-where-value-is-in-quotes-or-apostrop
    //        for the RegEx matching string pairs
    //      - https://stackoverflow.com/questions/21686539/regular-expression-for-full-iso-8601-date-syntax
    //        for the RegEx matching an ISO Date
    //
    //  I use https://regexr.com/ to test my Regular expressions
    //
    const betweenQuotes = /((?<![\\])['"])((?:.(?!(?<![\\])\1))*.?)\1/;
    //const parExp = /(\w+)\s*=\s*(["'])((?:(?!\2).)*)\2[\s*,\s*]?/g; 
    //const parExp = /(\w+)\s*=\s*(((["'])((?:(?!\4).)*)\4)|([-+]?[0-9]*\.?[0-9]+))[\s*,\s*]?/g; // Modified for numbers
    const parExp = /(\w+)\s*=\s*(((["'])((?:(?!\4).)*)\4)|(@dt)\('([\dTtZz\+-:]+)'\)|([-+]?[0-9]*\.?[0-9]+))[\s,]?/g; // Modified for Numbers and Dates
    const dateISO = /@dt\('([\+-]?\d{4}(?!\d{2}\b))(?:(-?)(?:(0[1-9]|1[0-2])(?:\2([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))(?:[T\s](?:(?:([01]\d|2[0-3])(?:(:?)([0-5]\d))?|24\:?00)([\.,]\d+(?!:))?)?(?:\10([0-5]\d)([\.,]\d+)?)?([zZ]|([\+-](?:[01]\d|2[0-3])):?([0-5]\d)?)?)?)?'\)/;
    var m;
    var outObject = {};
    while (m = parExp.exec(inputString)) {
        let name = '';
        name = m[1];
        if (m[3] === undefined) {
            if (m[6] === undefined) {
                //
                //  It is a number. We need to convert it
                //
                outObject[name] = Number(m[2]);
            } else {
                //
                //  Potentially a Date ?
                //
                if (m[6] === '@dt') {
                    //
                    //  It is a Date
                    //
                    if (dateISO.test(m[2])) {
                        //
                        //  Valid Date
                        //
                        outObject[name] = {type: "datetime", data : m[7]};
                    } else {
                        console.log('__getNameValueArray : NOT A VALID ISO DATE : ' + m[2]);
                    }
                }
            }
        } else {
            //
            //  It is a string
            //
            outObject[name] = m[5];
        }
    }
    return outObject;


    /*
    //
    //  OLD IMPLEMENTAATION
    //
    var outArray = [];
    while (m = parExp.exec(inputString)) {
        let obj = {};
        obj.name = m[1];
        if (m[3] === undefined) {
            if (m[6] === undefined) {
                //
                //  It is a number
                //
                obj.value = Number(m[2]);
                outArray.push(obj);
            } else {
                //
                //  Potentially a Date ?
                //
                if (m[6] === '@dt') {
                    //
                    //  It is a Date
                    //
                    if (dateISO.test(m[2])) {
                        //
                        //  Valid Date
                        //
                        obj.value = {type: "datetime", data : m[7]};
                        outArray.push(obj);
                    }
                }
            }
        } else {
            //
            //  It is a number, so we convert it
            //
            obj.value = m[5];
            outArray.push(obj);
        }
        //console.dir('£££££££££');
        //console.dir(m);
        //console.dir(obj);
        //console.dir('£££££££££');
    }
    return outArray;
    */
}

module.exports = {__log, 
                  __logJson, 
                  __logError, 
                  __logWarning, 
                  __getOptionValue, 
                  __getMandatoryInputFromSelect, 
                  __getMandatoryInputString, 
                  __getOptionalInputString,
                  __getNameValueArray,
                  __getItemValuesFromMsg};
