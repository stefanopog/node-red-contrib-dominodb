/*
Copyright IBM All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

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
    const { __log, __logJson, __logError, __logWarning, __getOptionValue, __getMandatoryInputFromSelect, __getMandatoryInputString, __getOptionalInputString } = require('../common/common.js');
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
      let displayResults = '';
      let startValue = 0;
      let countValue = 100;
      let unids = null;
      let itemNames = null;
      let queryLimits = null;
      let bulkCmdConfig = {};
      //
      //  Check for token on start up
      //
      if (!node.application) {
        __logError(__moduleName, "Please configure your Domino DB first!", null, null, msg, node);
        return;
      }
      let creds = node.application.getCredentials();
      //
      //  Query or Docunids ?
      //
      queryOrId = __getMandatoryInputFromSelect(__moduleName, config.queryOrId, msg.DDB_queryOrId, 'queryOrId', ['query', 'ids'], msg, node);
      if (!queryOrId) return;
      //
      //  Deleting Documents or Items ?
      //
      documentsOrItems = __getMandatoryInputFromSelect(__moduleName, config.documentsOrItems, msg.DDB_documentsOrItems, 'documentsOrItems', ['documents', 'items'], msg, node);
      if (!documentsOrItems) return;
      //
      //  Processing itemNames
      //
      if (documentsOrItems === 'items') {
        //
        //  Comma-separated list of itemNames
        //
        itemNames = __getMandatoryInputString(__moduleName, config.itemNames, msg.DDB_itemNames, 'itemNames', msg, node);
        if (!itemNames) return;
        //
        //  Transform comma-separated string into array
        //
        itemNames = itemNames.trim().split(',');
        for (let i=0; i < itemNames.length; i++) {
          itemNames[i] = itemNames[i].trim();
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
        query = __getMandatoryInputString(__moduleName, config.query, msg.DDB_query, 'DQL query', msg, node);
        if (!query) return;
        //
        //  Check how many records to retrieve
        //
        displayResults = __getMandatoryInputFromSelect(__moduleName, config.displayResults, msg.DDB_displayResults, 'displayResults', ['Default', 'All', 'byPage'], msg, node);
        if (!displayResults) return;
        if (displayResults === 'byPage') {
          if (msg.DDB_startValue) {
            startValue = msg.DDB_startValue;
          } else {
            startValue = config.startValue;
          }
          if (msg.DDB_countValue) {
            countValue = msg.DDB_countValue;
          } else {
            countValue = config.countValue;
          }
        }
        //
        //  Check if we need to care about the options
        //
        if (!config.defaultOptions) {
          //
          //  Max View Entries
          //
          queryLimits = __getOptionValue(__moduleName, queryLimits, 'maxViewEntriesScanned', config.maxViewEntries, msg.DDB_maxViewEntries, node);
          queryLimits = __getOptionValue(__moduleName, queryLimits, 'maxDocumentsScanned', config.maxDocuments, msg.DDB_maxDocuments, node);
          queryLimits = __getOptionValue(__moduleName, queryLimits, 'maxMilliSeconds', config.maxMillisecs, msg.DDB_maxMillisecs, node);
          __logJson(__moduleName, __isDebug, 'Using Query Limits', queryLimits);
        } else {
          __log(__moduleName, __isDebug, "Using Default Options");
        }
        //
        //  Prepare the Configuration to be executed
        //
        bulkCmdConfig.query = `${query}`;
        if (queryLimits) bulkCmdConfig.queryLimits = queryLimits;
        if (displayResults === 'byPage') {
          bulkCmdConfig.start = startValue;
          bulkCmdConfig.count = countValue;
        }
        if (displayResults === 'All') {
          bulkCmdConfig.start = 0;
          bulkCmdConfig.count = 200;
        }
      } else {
        //
        //  Comma-separated list of docunids
        //
        unids = __getMandatoryInputString(__moduleName, config.unids, msg.DDB_unids, 'DocUnids', msg, node);
        if (!unids) return;
        //
        //  Transform comma-separated string into array
        //
        unids = unids.trim().split(',');
        for (let i=0; i < unids.length; i++) {
          unids[i] = unids[i].trim();
        }
        //
        //  Prepare the Configuration to be executed
        //
        bulkCmdConfig.unids = unids;
      }
      //
      //  Finish Configuration of the options for the call
      //
      if (itemNames && Array.isArray(itemNames) && (itemNames.length > 0)) bulkCmdConfig.itemNames = itemNames;
      bulkCmdConfig.onErrorOptions = config.onError;
      //
      //  Preparing
      //
      __logJson(__moduleName, __isDebug, "executing with the following options: ", bulkCmdConfig);
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
          __logError(__moduleName, "Error Accessing database config", databaseConfig, err, msg, node);
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
            if (displayResults !== 'All') {
              //
              //  We are doing a 'Default' (where we do not specify start and count) or 
              //  we are doing 'byPage' (and in this case we previously added start and count to the 
              //  buldCmdConfig object)
              //  So the call we just did is enough for bringing all the results
              //
            } else {
              //
              //  In this case we will have to iterate over all the results!!
              //  Since we do not know how many results the DQL query will bring back,
              //  we need to perform an initial call to get the information retrieved 
              //  by the query about the total number of documents
              //  These information are contained in 'documentRange' attribute of the 
              //  result from the first call. 
              //  More precisely, 'documentRange' provides information about the 
              //  current 'start' and 'count', but also the 'total' 
              //
              let documentRange = docs.documentRange;
              if (documentRange) {
                if ((documentRange.start + documentRange.count) < documentRange.total) {
                  //
                  //  We need to get more information :-)
                  //
                  let newStart = documentRange.count;
                  while (newStart < documentRange.total) {
                    bulkCmdConfig.start = newStart;
                    node.status({fill: "blue", shape: "dot", text: "Processing from " + newStart});
                    let tmpDocs;
                    if (documentsOrItems === 'documents') {
                      tmpDocs = await  db.bulkDeleteDocuments(bulkCmdConfig);
                    } else {
                      tmpDocs = await  db.bulkDeleteItems(bulkCmdConfig);
                    }
                    docs.documents = docs.documents.concat(tmpDocs.documents);
                    newStart = newStart + tmpDocs.documentRange.count;
                  }
                } else {
                  //
                  //  Nothing to do. We retrieved all the documents with the first query
                  //
                }
              } else {
                //
                //  Houston, we have a problem. 
                //
                __logError(__moduleName, "Error Getting documentRange Information", documentRange, null, msg, node);
                return;
              }
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
          //
          //  Building the results
          //
          msg.DDB_docs = docs.documents;
          msg.DDB_result = docs;
          if ((msg.DDB_result) && (msg.DDB_result.documents)) delete(msg.DDB_result.documents);
          node.status({fill:"green", shape:"dot", text:"OK"});
          node.send(msg);
          __log(__moduleName, __isDebug, "succesfully exiting ");
          //
          //  Reset visual status on success
          //
          setTimeout(() => {node.status({});}, 2000);
        } catch(err) {
          __logError(__moduleName, "Error Getting Results", null, err, msg, node);
          return;
        }
      })
      .catch(err => {
        __logError(__moduleName, "Error accessing Server with the following configuration", serverConfig, err, msg, node);
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
};
