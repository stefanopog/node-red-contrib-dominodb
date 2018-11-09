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
  var __moduleName = 'D10_deleteDocuments';


  console.log("*****************************************");
  console.log("* Debug mode is " + (__isDebug ? "enabled" : "disabled") + ' for module ' + __moduleName);
  console.log("*****************************************");

  function D10_deleteDocuments(config) {
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
      let itemNames = null;
      let queryLimits = null;
      let bulkCmdConfig = {};
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
      //  Processing itemNames
      //
      if (documentsOrItems === 'items') {
        if ((config.itemNames.trim() === '') && 
            (!msg.DDB_itemNames || ((typeof msg.DDB_itemNames) !== 'string') || (msg.DDB_itemNames.trim() === ''))) {
          //
          //  No Items names
          //
          let errString = __moduleName + ": No Item Names";
          console.log(errString);
          msg.DDB_fatal = {message: errString};
          node.status({fill: "red", shape: "dot", text: errString});
          node.error(errString, msg);
          return;
        } else {
          //
          //  transofrming to Array
          //
          if (config.itemNames.trim() !== '') {
            itemNames = config.itemNames.trim();
          } else {
            itemNames = msg.DDB_itemNames.trim();
          }
          //
          //  Transform comma-separated string into array
          //
          itemNames = itemNames.trim().split(',');
          for (let i=0; i < itemNames.length; i++) {
            itemNames[i] = itemNames[i].trim();
          }
        }
      } else {
        //
        //  itemNames is NOT required
        //
        itemNames = null;
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
      } else {
        //
        //  Comma-separated list of docunids
        //
        if ((config.unids.trim() === '') && 
           ((msg.DDB_unids === undefined) || ((typeof msg.DDB_unids) !== 'string') || (msg.DDB_unids.trim() === ''))) {
            let errString = __moduleName + ": Missing Docunids";
            console.log(errString);
            msg.DDB_fatal = {message: errString};
            node.status({fill: "red", shape: "dot", text: errString});
            node.error(errString, msg);
            return;
        } else {
          if (config.unids.trim() !== '') {
            unids = config.unids;
          } else {
            unids = msg.DDB_unids;
          }
          //
          //  Transform comma-separated string into array
          //
          unids = unids.trim().split(',');
          for (let i=0; i < unids.length; i++) {
            unids[i] = unids[i].trim();
          }
        }
        //
        //  Prepare the Configuration to be executed
        //
        if (unids) bulkCmdConfig.unids = unids;
      }
      //
      //  Finish Configuration of the options for the call
      //
      if (itemNames && Array.isArray(itemNames) && (itemNames.length > 0)) bulkCmdConfig.itemNames = itemNames;
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
            //  DQL Query
            //
            if (documentsOrItems === 'documents') {
              docs = await  db.bulkDeleteDocuments(bulkCmdConfig);
            } else {
              docs = await  db.bulkDeleteItems(bulkCmdConfig);
            }
          } else {
            //
            //  Bulk by IDs
            //
            if (documentsOrItems === 'documents') {
              docs = await  db.bulkDeleteDocumentsByUnid(bulkCmdConfig);
            } else {
              docs = await  db.bulkDeleteItemsByUnid(bulkCmdConfig);
            }
          }
          msg.DDB_docs = docs.documents;
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
  RED.nodes.registerType("D10_deleteDocuments", D10_deleteDocuments);
  
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
