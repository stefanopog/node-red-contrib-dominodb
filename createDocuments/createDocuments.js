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
  var __moduleName = 'D10_createDocuments';


  console.log("*****************************************");
  console.log("* Debug mode is " + (__isDebug ? "enabled" : "disabled") + ' for module ' + __moduleName);
  console.log("*****************************************");

  function D10_createDocuments(config) {
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
      let itemValuesById = null;
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
      //  Process itemValuesById
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
      }
      bulkCmdConfig.documents = itemValuesById;
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
          docs = await  db.bulkCreateDocuments(bulkCmdConfig);
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
  RED.nodes.registerType("D10_createDocuments", D10_createDocuments);
  
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
