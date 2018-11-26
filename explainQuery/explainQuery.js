/*
Copyright IBM All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

module.exports = function(RED) {
  var __isDebug = process.env.d10Debug || false;
  var __moduleName = 'D10_explainQuery';


  console.log("*****************************************");
  console.log("* Debug mode is " + (__isDebug ? "enabled" : "disabled") + ' for module ' + __moduleName);
  console.log("*****************************************");

  function D10_explainQuery(config) {
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
      let query = '';
      let explainConfig = {};
      //
      //  Check for token on start up
      //
      if (!node.application) {
        __logError(__moduleName, "Please configure your Domino DB first!", null, null, msg, node);
        return;
      }
      let creds = node.application.getCredentials();
      //
      //  DQL Query String
      //
      query = __getMandatoryInputString(__moduleName, config.query, msg.DDB_query, 'DQL query', msg, node);
      if (!query) return;
      //
      //  Prepare the Configuration to be executed
      //
      explainConfig.query = `${query}`;
      //
      //  Preparing
      //
      _logJson(__moduleName, __isDebug, "executing with the following options: ", explainConfig);
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
        try {
          const explain = await db.explainQuery(explainConfig);
          msg.DDB_queryExplained = explain;
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
  RED.nodes.registerType("D10_explainQuery", D10_explainQuery);
};
