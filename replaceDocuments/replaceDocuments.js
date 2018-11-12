/**
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
module.exports = function(RED) {
  var __isDebug = process.env.d10Debug || false;
  var __moduleName = 'D10_replaceDocuments';


  console.log("*****************************************");
  console.log("* Debug mode is " + (__isDebug ? "enabled" : "disabled") + ' for module ' + __moduleName);
  console.log("*****************************************");

  function D10_replaceDocuments(config) {
    RED.nodes.createNode(this, config);
    this.application = RED.nodes.getNode(config.application);
    var node = this;
    //
    //  Get the dominoDB runtime
    //
    const { useServer } = require('@domino/domino-db');

    //
    //  ON Handler
    //
    this.on("input", function(msg) {
      let queryOrId = '';
      let documentsOrItems = '';
      let query = '';
      let maxViewEntries = 0;
      let maxDocuments = 0;
      let maxMillisecs = 0;
      let unids = null;
      let itemValues = null;
      let itemValuesById = null;
      let queryLimits = null;
      let bulkCmdConfig = {};
      const betweenQuotes = /"([^"\\]*(\\.[^"\\]*)*)"/;
      const parExp = /(\S+)\s*=\s*([^\s"]+|"[^"]*")/;
      const arrayToObject = (array, keyField) =>
      array.reduce((obj, item) => {
        obj[item[keyField]] = item.value;
        return obj;
      }, {});
      //
      //  Check for token on start up
      //
      if (!node.application) {
        let errString = __moduleName + ": Please configure your Domino DB first!";
        msg.DDB_fatal = {message: errString};
        node.status({fill: "red", shape: "dot", text: errString});
        node.error(errString, msg);
        return;
      }
      let creds = node.application.getCredentials();
      //
      //  Query or Docunids ?
      //
      if ((config.queryOrId.trim() === '') && 
          (msg.DDB_queryOrId || (msg.DDB_queryOrId.trim() === ''))) {
            let errString = __moduleName + ": Missing QueryOrID string";
            console.log(errString);
            msg.DDB_fatal = {message: errString};
            node.status({fill: "red", shape: "dot", text: errString});
            node.error(errString, msg);
            return;
      }
      if (config.queryOrId.trim() !== '') {
        if (config.queryOrId === 'fromMsg') {
          if (!msg.DDB_queryOrId || (msg.DDB_queryOrId.trim() === '')) {
            let errString = __moduleName + ": Missing QueryOrID string";
            console.log(errString);
            msg.DDB_fatal = {message: errString};
            node.status({fill: "red", shape: "dot", text: errString});
            node.error(errString, msg);
            return;
          } else {
            queryOrId = msg.DDB_queryOrId.trim();
          }
        } else {
          queryOrId = config.queryOrId.trim();
        }
      } else {
        queryOrId = msg.DDB_queryOrId.trim();
      }
      if ((queryOrId !== 'query') && (queryOrId !== 'ids')) {
        let errString = __moduleName + ": Invalid QueryOrID string : " + queryOrId;
        console.log(errString);
        msg.DDB_fatal = {message: errString};
        node.status({fill: "red", shape: "dot", text: errString});
        node.error(errString, msg);
        return;
      }
      //
      //  Deleting Documents or Items ?
      //
      if ((config.documentsOrItems.trim() === '') && 
          (msg.DDB_documentsOrItems || (msg.DDB_documentsOrItems.trim() === ''))) {
            let errString = __moduleName + ": Missing documentsOrItems string";
            console.log(errString);
            msg.DDB_fatal = {message: errString};
            node.status({fill: "red", shape: "dot", text: errString});
            node.error(errString, msg);
            return;
      }
      if (config.documentsOrItems.trim() !== '') {
        if (config.documentsOrItems === 'fromMsg') {
          if (!msg.DDB_documentsOrItems || (msg.DDB_documentsOrItems.trim() === '')) {
            let errString = __moduleName + ": Missing documentsOrItems string";
            console.log(errString);
            msg.DDB_fatal = {message: errString};
            node.status({fill: "red", shape: "dot", text: errString});
            node.error(errString, msg);
            return;
          } else {
            documentsOrItems = msg.DDB_documentsOrItems.trim();
          }
        } else {
          documentsOrItems = config.documentsOrItems.trim();
        }
      } else {
        documentsOrItems = msg.DDB_documentsOrItems.trim();
      }
      if ((documentsOrItems !== 'documents') && (documentsOrItems !== 'items')) {
        let errString = __moduleName + ": Invalid documentsOrItems string : " + documentsOrItems;
        console.log(errString);
        msg.DDB_fatal = {message: errString};
        node.status({fill: "red", shape: "dot", text: errString});
        node.error(errString, msg);
        return;
      }
      //
      //  Check Consistency
      //
      if ((documentsOrItems === 'documents') && (queryOrId === 'query')) {
        //
        //  NOT an aption
        //
        let errString = __moduleName + ": Cannot replace documents by Query";
        console.log(errString);
        msg.DDB_fatal = {message: errString};
        node.status({fill: "red", shape: "dot", text: errString});
        node.error(errString, msg);
        return;
      }
      //
      //  Process itemValuesById
      //
      if ((documentsOrItems === 'documents') ||
          ((documentsOrItems === 'items') && (queryOrId === 'ids'))) {
        //
        //  For replaceDocuments or replaceItemsByUnid we need to parse itemValuesById
        //
        if (!msg.DDB_itemValuesById || !Array.isArray(msg.DDB_itemValuesById)) {
          let errString = __moduleName + ": No Item Values By ID";
          console.log(errString);
          msg.DDB_fatal = {message: errString};
          node.status({fill: "red", shape: "dot", text: errString});
          node.error(errString, msg);
          return;
        } else {
          //
          //  Processing
          //  We assume that the input Array is already in the right format
          //
          itemValuesById = msg.DDB_itemValuesById;
          //
          //  Let's check that each record in the array has the @unid property
          //
          for (let i=0; i < itemValuesById.length; i++) {
            if (!itemValuesById[i]['@unid']) {
              let errString = __moduleName + ": itemValuesById item " + i + " is missing @unid";
              console.log(errString);
              console.log(JSON.stringify(itemValuesById[i], ' ', 2));
              msg.DDB_fatal = {message: errString, item: itemValuesById[i]};
              node.status({fill: "red", shape: "dot", text: errString});
              node.error(errString, msg);
              return;
            }
          }
        }
      }
      //
      //  Process ItemValues
      //
      if (documentsOrItems === 'items') {
        //
        //  In this case we may need itemValues
        //
        let _itemValues = [];
        if ((config.itemValues.trim() === '') && 
            (!msg.DDB_itemValues || !Array.isArray(msg.DDB_itemValues))) {
          //
          //  No Items to be modified! 
          //  This would be an INFORMATION if "ids" but an error if "Query"
          //
          if (queryOrId === 'query') {
            let errString = __moduleName + ": No Item Values";
            console.log(errString);
            msg.DDB_fatal = {message: errString};
            node.status({fill: "red", shape: "dot", text: errString});
            node.error(errString, msg);
            return;
          } else {
            let warnString = __moduleName + ": No Item Values";
            console.log(warnString);
            node.status({fill: "yellow", shape: "dot", text: warnString});
            node.warn(warnString);
            itemValues = null
          }
        } else {
          if (config.itemValues.trim() !== '') {
            //
            //  List of properties is a comma-separated list of  name=value
            //
            let theList = config.itemValues.trim().split(',');
            for (let i=0; i < theList.length; i++) {
              let tt = theList[i].match(parExp);
              if (tt) {
                //
                //  well written name = value   pair
                //
                let theItem = {};
                theItem.name = tt[1].trim();
                let tmpS = tt[2].trim();
                if (tmpS.match(betweenQuotes)) {
                  theItem.value = tmpS.match(betweenQuotes)[1];
                } else {
                  theItem.value = tmpS;
                }
                _itemValues.push(theItem);
              }
            }
            //
            //  Now we should have processed all the pairs in the config input
            //
          } else {
            //
            //  if inpput comes as "msg.DDB_itemValues" we assume that it is already formatted as an array of name and values
            //
            _itemValues = msg.DDB_itemValues;
          }
        }
        //
        //  Now transform the array into an object
        //
        itemValues = arrayToObject(_itemValues, "name");
      }
      //
      //  Input validation 
      //
      if (queryOrId === "query") {
        //
        //  DQL Query String
        //
        if ((config.query.trim() === '') && 
           ((msg.DDB_query === undefined) || (msg.DDB_query.trim() === ''))) {
            let errString = __moduleName + ": Missing DQL query string";
            console.log(errString);
            msg.DDB_fatal = {message: errString};
            node.status({fill: "red", shape: "dot", text: errString});
            node.error(errString, msg);
            return;
        }
        if (config.query.trim() !== '') {
          query = config.query.trim();
        } else {
          query = msg.DDB_query.trim();
        }
        //
        //  Check if we need to care about the options
        //
        if (!config.defaultOptions) {
          //
          //  Max View Entries
          //
          if ((config.maxViewEntries.trim() === '') && 
            ((msg.DDB_maxViewEntries === undefined) || (msg.DDB_maxViewEntries.trim() === ''))) {
              let warnString = __moduleName + ": maxViewEntries set to default";
              console.log(warnString);
              node.status({fill: "yellow", shape: "dot", text: warnString});
              node.warn(warnString);
          } else {
            if (config.maxViewEntries !== '') {
              maxViewEntries = config.maxViewEntries;
            } else {
              maxViewEntries = msg.DDB_maxViewEntries;
            }
            if (Number(maxViewEntries) && Number.isInteger(maxViewEntries) && (maxViewEntries > 0)) {
              //
              //  This is an OK value
              //
              if (! queryLimits) queryLimits = {};
              queryLimits.maxViewEntriesScanned = maxViewEntries;
            } else {
              //
              //  Not numeric, or not integer or negative integer
              //
              let warnString = __moduleName + ": maxViewEntries set to default";
              console.log(warnString);
              node.status({fill: "yellow", shape: "dot", text: warnString});
              node.warn(warnString);
            }
          }
          //
          //  Max Documents
          //
          if ((config.maxDocuments.trim() === '') && 
            ((msg.DDB_maxDocuments === undefined) || (msg.DDB_maxDocuments.trim() === ''))) {
              let warnString = __moduleName + ": maxDocuments set to default";
              console.log(warnString);
              node.status({fill: "yellow", shape: "dot", text: warnString});
              node.warn(warnString);
          } else {
            if (config.maxDocuments !== '') {
              maxDocuments = config.maxDocuments;
            } else {
              maxDocuments = msg.DDB_maxDocuments;
            }
            if (Number(maxDocuments) && Number.isInteger(maxDocuments) && (maxDocuments > 0)) {
              //
              //  This is an OK value
              //
              if (! queryLimits) queryLimits = {};
              queryLimits.maxDocumentsScanned = maxDocuments;
            } else {
              //
              //  Not numeric, or not integer or negative integer
              //
              let warnString = __moduleName + ": maxDocuments set to default";
              console.log(warnString);
              node.status({fill: "yellow", shape: "dot", text: warnString});
              node.warn(warnString);
            }
          }
          //
          //  Max Milliseconds
          //
          if ((config.maxMillisecs.trim() === '') && 
            ((msg.DDB_maxMillisecs === undefined) || (msg.DDB_maxMillisecs.trim() === ''))) {
              let warnString = __moduleName + ": maxMillisecs set to default";
              console.log(warnString);
              node.status({fill: "yellow", shape: "dot", text: warnString});
              node.warn(warnString);
          } else {
            if (config.maxMillisecs !== '') {
              maxMillisecs = config.maxMillisecs;
            } else {
              maxMillisecs = msg.DDB_maxMillisecs;
            }
            if (Number(maxMillisecs) && Number.isInteger(maxMillisecs) && (maxMillisecs > 0)) {
              //
              //  This is an OK value
              //
              if (! queryLimits) queryLimits = {};
              queryLimits.maxMilliSeconds = maxMillisecs;
            } else {
              //
              //  Not numeric, or not integer or negative integer
              //
              let warnString = __moduleName + ": maxMillisecs set to default";
              console.log(warnString);
              node.status({fill: "yellow", shape: "dot", text: warnString});
              node.warn(warnString);
            }
          }
        } else {
          console.log(__moduleName + ": Using Default Options");
        }
        //
        //  Prepare the Configuration to be executed
        //
        bulkCmdConfig.query = `${query}`;
        if (queryLimits) bulkCmdConfig.queryLimits = queryLimits;
        bulkCmdConfig.replaceItems = itemValues;
      } else {
        //
        //  Prepare the Configuration to be executed
        //
        if (unids) bulkCmdConfig.unids = unids;
        if (documentsOrItems === 'documents') {
          //
          //  ONLY itemValuesById is required
          //
          bulkCmdConfig.documents = itemValuesById;
        } else {
          //
          //  We may need both itemValuesById and itemValues
          //
          if (itemValues) bulkCmdConfig.replaceItems = itemValues;
          bulkCmdConfig.replaceItemsByUnid = itemValuesById;
        }
      }
      //
      //  Finish Configuration of the options for the call
      //
      bulkCmdConfig.onErrorOptions = config.onError;
      //
      //  Preparing
      //
      _logJson("executing with the following options: ", bulkCmdConfig);
      const serverConfig = {
        hostName: creds.D10_server, 
        connection: {
          port: creds.D10_port, 
        },
      };
      const databaseConfig = {
        filePath: creds.D10_db
      };
      
      useServer(serverConfig).then(async server => {
        //
        //  Get the Domino Database
        //
        let db;
        try {
          db = await server.useDatabase(databaseConfig);
        } catch (err) {
          let errString = __moduleName + ": Error Accessing database config";
          console.log(errString);
          console.log(JSON.stringify(databaseConfig, ' ', 2));
          console.log(__moduleName + ': Error follows : ');
          console.log(JSON.stringify(err, ' ', 2));
          msg.DDB_fatal = err;
          node.status({fill: "red", shape: "dot", text: errString});
          node.error(errString, msg);
          return;
        }
        let docs = null;
        try {
          if (queryOrId === "query") {
            //
            //  Can ONLY be bulkReplaceItems
            //
            docs = await  db.bulkReplaceItems(bulkCmdConfig);
          } else {
            //
            //  Bulk by IDs
            //
            if (documentsOrItems === 'documents') {
              docs = await  db.bulkReplaceDocumentsByUnid(bulkCmdConfig);
            } else {
              docs = await  db.bulkReplaceItemsByUnid(bulkCmdConfig);
            }
          }
          //
          //  Building the results
          //
          msg.DDB_docs = docs.documents;
          msg.DDB_result = docs;
          if ((msg.DDB_result) && (msg.DDB_result.documents)) delete(msg.DDB_result.documents);
          node.status({fill:"green", shape:"dot", text:"OK"});
          node.send(msg);
          _log("succesfully exiting ");
          //
          //  Reset visual status on success
          //
          setTimeout(() => {node.status({});}, 2000);
        } catch(err) {
          let errString = __moduleName + ": Error Getting Results";
          console.log(errString);
          console.log(JSON.stringify(err, ' ', 2));
          msg.DDB_fatal = err;
          node.status({fill: "red", shape: "dot", text: errString});
          node.error(errString, msg);
          return;
        }
      })
      .catch(err => {
        let errString = __moduleName + ': Error accessing Server with the following configuration';
        console.log(errString);
        console.log(JSON.stringify(serverConfig, ' ', 2));
        console.log(__moduleName + ': Error follows : ');
        console.log(JSON.stringify(err, ' ', 2));
        msg.DDB_fatal = err;
        node.status({fill: "red", shape: "dot", text: errString});
        node.error(errString, msg);
        return;
     });
    });
    //
    //  CLOSE Handler
    //
    this.on('close', function(removed, done) {
      if (removed) {
          // This node has been deleted
      } else {
          // This node is being restarted
      }
      done();
    });
  }

  //
  //  Node Registration
  //
  RED.nodes.registerType("D10_replaceDocuments", D10_replaceDocuments);
  
    //
    //  Internal Helper Functions
    //
    //  Common logging function
    //
  function _log(logMsg){
    if (__isDebug) {
        console.log(__moduleName + " => " + logMsg);
    };
  };
  //
  //  Common logging function with JSON Objects
  //
  function _logJson(logMsg, jsonObj) {
      if (__isDebug) {
        console.log(__moduleName + " => " + (logMsg ? logMsg : ""));
        console.log(JSON.stringify(jsonObj, " ", 2));
    };
  };
};
