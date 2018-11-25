/*
Copyright IBM All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

module.exports = function(RED) {
  var __isDebug = process.env.d10Debug || false;
  var __moduleName = 'D10_createDocuments';


  console.log("*****************************************");
  console.log("* Debug mode is " + (__isDebug ? "enabled" : "disabled") + ' for module ' + __moduleName);
  console.log("*****************************************");

  function D10_createDocuments(config) {
    RED.nodes.createNode(this, config);
    this.application = RED.nodes.getNode(config.application);
    var node = this;
    const { __log, __logJson, __logError, __logWarning, __getOptionValue, __getMandatorInputFromSelect, __getOptionalInputString } = require('../common/common.js');
    //
    //  Get the dominoDB runtime
    //
    const { useServer } = require('@domino/domino-db');

    //
    //  ON Handler
    //
    this.on("input", function(msg) {
      let itemValuesById = null;
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
      //  Process itemValuesById
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
      }
      bulkCmdConfig.documents = itemValuesById;
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
          docs = await  db.bulkCreateDocuments(bulkCmdConfig);
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
  RED.nodes.registerType("D10_createDocuments", D10_createDocuments);
};
