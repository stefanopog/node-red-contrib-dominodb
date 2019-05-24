/*
Copyright IBM All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

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
    const { __log, 
      __logJson, 
      __logError, 
      __logWarning, 
      __getOptionValue, 
      __getMandatoryInputFromSelect, 
      __getMandatoryInputString, 
      __getOptionalInputString, 
      __getNameValueArray,
      __getItemValuesFromMsg } = require('../common/common.js');
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
      let itemValues = null;
      let itemValuesById = null;
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
      //  Process itemValuesById
      //
      if ((documentsOrItems === 'documents') || ((documentsOrItems === 'items') && (queryOrId === 'ids'))) {
        //
        //  For replaceDocuments or replaceItemsByUnid we need to parse itemValuesById
        //
        if (!msg.DDB_itemValuesById || !Array.isArray(msg.DDB_itemValuesById)) {
          __logError(__moduleName, "No Item Values By ID", null, null, msg, node);
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
              __logError(__moduleName, "itemValuesById item " + i + " is missing @unid", itemValuesById[i], null, msg, node);
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
        if ((config.itemValues.trim() === '') && !msg.DDB_itemValues) {
          //
          //  No Items to be modified! 
          //  This would be an INFORMATION if "ids" but an error if "Query"
          //
          if (queryOrId === 'query') {
            __logError(__moduleName, "No Item Values", documentRange, null, msg, node);
            return;
          } else {
            __logWarning(__moduleName, 'No Item Values', node);
            itemValues = null
          }
        } else {
          if (config.itemValues.trim() !== '') {
            //
            //  List of properties is a comma-separated list of  name="value"
            //
            itemValues = __getNameValueArray(config.itemValues);
          } else {
            //
            //  if inpput comes as "msg.DDB_itemValues" we chek if it is already a final object or an array
            //  If it is an array, then it is transformed into object
            //
            itemValues = __getItemValuesFromMsg(msg.DDB_itemValues);
          }
          __logJson(__moduleName, __isDebug, 'Parsed itemValues', itemValues);
        }
      }
      //
      //  Input validation 
      //
      if (queryOrId === "query") {
        //
        //  DQL Query String
        //
        query = __getMandatoryInputString(__moduleName, config.query, msg.DDB_query, config.queryOrId, 'DQL query', msg, node);
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
        bulkCmdConfig.replaceItems = itemValues;
      } else {
        //
        //  Prepare the Configuration to be executed
        //
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
      //  Deal with "computeWithForm"
      //
      if (config.computeWithForm) {
        bulkCmdConfig.computeOptions = {};
        bulkCmdConfig.computeOptions.computeWithForm = true;
        if (config.ignoreComputeErrors) {
          bulkCmdConfig.computeOptions.ignoreComputeErrors = true;
        }
      }
      //
      //  Preparing
      //
      const serverConfig = node.application.getServerConfig();
      const databaseConfig = node.application.getDatabaseConfig();
      __logJson(__moduleName, __isDebug, "executing with the following serverConfig: ", serverConfig, true);
      __logJson(__moduleName, __isDebug, "executing with the following ddbConfig: ", databaseConfig);
      __logJson(__moduleName, __isDebug, "executing with the following options: ", bulkCmdConfig);
      //
      //  Executing
      //
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
            //  Can ONLY be bulkReplaceItems
            //
            docs = await  db.bulkReplaceItems(bulkCmdConfig);
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
                    let tmpDocs = await  db.bulkReplaceItems(bulkCmdConfig);
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
  RED.nodes.registerType("D10_replaceDocuments", D10_replaceDocuments);
};
