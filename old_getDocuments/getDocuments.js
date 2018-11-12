module.exports = function(RED) {
  var __isDebug = process.env.d10Debug || false;


  console.log("*****************************************");
  console.log("* Debug mode is " + (__isDebug ? "enabled" : "disabled") + ' for module getDocuments');
  console.log("*****************************************");

function D10_getDocuments(config) {
    RED.nodes.createNode(this, config);
    this.application = RED.nodes.getNode(config.application);
    var node = this;

    //
    //  Check for token on start up
    //
    if (!node.application) {
      node.status({fill: "red", shape: "dot", text: "Database Not Available"});
      node.error("D10_readDocument: Please configure your Domino DB first!");
      return;
    }
    //
    //  Get the dominoDB runtime
    //
    const { useServer } = require('@domino/domino-db');

    //
    //  ON Handler
    //
    this.on("input", function(msg) {
      let creds = node.application.getCredentials();
      let queryOrId = '';
      let query = '';
      let maxViewEntries = 0;
      let maxDocuments = 0;
      let maxMillisecs = 0;
      let unids = null;
      let itemNames = null;
      let queryLimits = null;
      let bulkCmdConfig = {};
      //
      //  Query or Docunids ?
      //
      if ((config.queryOrId.trim() === '') && 
          (msg.DDB_queryOrId || (msg.DDB_queryOrId.trim() === ''))) {
            console.log("D10_readDocument: Missing QueryOrID string");
            node.status({fill: "red", shape: "dot", text: "Missing QueryOrID string"});
            node.error("D10_readDocument: Missing QueryOrID string");
            return;
      }
      if (config.queryOrId.trim() !== '') {
        if (config.queryOrId === 'fromMsg') {
          if (!msg.DDB_queryOrId || (msg.DDB_queryOrId.trim() === '')) {
            console.log("D10_readDocument: Missing QueryOrID string");
            node.status({fill: "red", shape: "dot", text: "Missing QueryOrID string"});
            node.error("D10_readDocument: Missing QueryOrID string");
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
      //
      //  Comma-separated list of itemNames
      //
      if ((config.itemNames.trim() === '') && 
          (!msg.DDB_itemNames || ((typeof msg.DDB_itemNames) !== 'string') || (msg.DDB_itemNames.trim() === ''))) {
            console.log("D10_readDocument: No Item Names");
            itemNames = [];
            node.status({fill: "yellow", shape: "dot", text: "No Item Names"});
            node.warn("D10_readDocument: No Item Names");
      } else {
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
      //
      //  Input validation 
      //
      if (queryOrId === "query") {
        //
        //  DQL Query String
        //
        if ((config.query.trim() === '') && 
           ((msg.DDB_query === undefined) || (msg.DDB_query.trim() === ''))) {
            console.log("D10_readDocument: Missing DQL query string");
            node.status({fill: "red", shape: "dot", text: "Missing DQL query string"});
            node.error("D10_readDocument: Missing DQL query string");
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
              console.log("D10_readDocument: maxViewEntries set to default");
              node.status({fill: "yellow", shape: "dot", text: "maxViewEntries set to default"});
              node.warn("D10_readDocument: maxViewEntries set to default");
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
              console.log("D10_readDocument: maxViewEntries set to default");
              node.status({fill: "yellow", shape: "dot", text: "maxViewEntries set to default"});
              node.warn("D10_readDocument: maxViewEntries set to default");
            }
          }
          //
          //  Max Documents
          //
          if ((config.maxDocuments.trim() === '') && 
            ((msg.DDB_maxDocuments === undefined) || (msg.DDB_maxDocuments.trim() === ''))) {
              console.log("D10_readDocument: maxDocuments set to default");
              node.status({fill: "yellow", shape: "dot", text: "maxDocuments set to default"});
              node.warn("D10_readDocument: maxDocuments set to default");
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
              console.log("D10_readDocument: maxDocuments set to default");
              node.status({fill: "yellow", shape: "dot", text: "maxDocuments set to default"});
              node.warn("D10_readDocument: maxDocuments set to default");
            }
          }
          //
          //  Max Milliseconds
          //
          if ((config.maxMillisecs.trim() === '') && 
            ((msg.DDB_maxMillisecs === undefined) || (msg.DDB_maxMillisecs.trim() === ''))) {
              console.log("D10_readDocument: maxMillisecs set to default");
              node.status({fill: "yellow", shape: "dot", text: "maxMillisecs set to default"});
              node.warn("D10_readDocument: maxMillisecs set to default");
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
              console.log("D10_readDocument: maxMillisecs set to default");
              node.status({fill: "yellow", shape: "dot", text: "maxMillisecs set to default"});
              node.warn("D10_readDocument: maxMillisecs set to default");
            }
          }
        } else {
          console.log("D10_readDocument: Using Default Options");
        }
        //
        //  Prepare the Configuration to be executed
        //
        bulkCmdConfig.query = `${query}`;
        if (queryLimits) bulkCmdConfig.queryLimits = queryLimits;
        if (itemNames && Array.isArray(itemNames) && (itemNames.length > 0)) bulkCmdConfig.itemNames = itemNames;
        bulkCmdConfig.onErrorOptions = config.onError;
      } else {
        //
        //  Comma-separated list of docunids
        //
        if ((config.unids.trim() === '') && 
           ((msg.DDB_unids === undefined) || ((typeof msg.DDB_unids) !== 'string') || (msg.DDB_unids.trim() === ''))) {
            console.log("D10_readDocument: Missing Docunids");
            node.status({fill: "red", shape: "dot", text: "Missing Docunids"});
            node.error("D10_readDocument: Missing Docunids");
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
        if (itemNames && Array.isArray(itemNames) && (itemNames.length > 0)) bulkCmdConfig.itemNames = itemNames;
        bulkCmdConfig.onErrorOptions = config.onError;
      }
      //
      //  Preparing
      //
      _logJson("D10_readDocument: executing with the following options: ", bulkCmdConfig);
      const serverConfig = {
        hostName: creds.D10_server, 
        connection: {
          port: creds.D10_port, //17847,
        },
      };
      const databaseConfig = {
        filePath: creds.D10_db
      };
      
      useServer(serverConfig).then(async server => {
        const db = await server.useDatabase(databaseConfig);
        let docs = null;
        if (queryOrId === "query") {
          //
          //  DQL Query
          //
          docs = await  db.bulkReadDocuments(bulkCmdConfig);
        } else {
          //
          //  Bulk by IDs
          //
          docs = await  db.bulkReadDocumentsByUnid(bulkCmdConfig);
        }
        msg.DDB_docs = docs;
        node.status({fill:"green", shape:"dot", text:"OK"});
        node.send(msg);
        _logJson("D10_readDocument: succesfully exiting with the following results : ", docs),
        //
        //  Reset visual status on success
        //
        setTimeout(() => {node.status({});}, 2000);
      })
      .catch(err => {
        console.log('D10_readDocument: Error Getting Results');
        console.log(JSON.stringify(err, ' ', 2));
        node.status({fill:"red", shape:"dot", text:"Error Getting Results"});
        node.error('D10_readDocument: Error Getting Results', err);
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
  RED.nodes.registerType("getDocuments", D10_getDocuments);
  
  //
  //  Internal Helper Functions
  //
  //  Common logging function with JSON Objects
  //
  function _logJson(logMsg, jsonObject) {
    if (__isDebug) {
        console.log("D10_getDocuments => " + (logMsg ? logMsg : "") + JSON.stringify(jsonObject, " ", 2));
    };
  }
  //
  //  Common logging function
  //
  function _log(logMsg) {
      if (__isDebug) {
          console.log("D10_getDocuments " + logMsg);
      };
  }
};