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

  console.log("*****************************************");
  console.log("* Debug mode is " + (__isDebug ? "enabled" : "disabled") + ' for module documentMgr');
  console.log("*****************************************");

  function D10_documentMgr(config) {
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

      const betweenQuotes = /"([^"\\]*(\\.[^"\\]*)*)"/;
      const parExp = /(\S+)\s*=\s*([^\s"]+|"[^"]*")/;

      let documentOp = '';
      let unid  = null;
      let itemNames = [];
      let itemValues = [];
      let options = {};
      let options2 = {};
      const serverConfig = {
        hostName: creds.D10_server, 
        connection: {
          port: creds.D10_port, //17847,
        },
      };
      const databaseConfig = {
        filePath: creds.D10_db
      };
      //
      //  Which Operation ?
      //
      if ((config.documentOp.trim() === '') && 
          (!msg.DDB_documentOp || (msg.DDB_documentOp.trim() === ''))) {
            console.log("D10_readDocument: Missing DocumentOp string");
            node.status({fill: "red", shape: "dot", text: "Missing DocumentOp string"});
            node.error("D10_readDocument: Missing DocumentOp string");
            return;
      }
      if (config.documentOp.trim() !== '') {
        if (config.documentOp === 'fromMsg') {
          if (!msg.DDB_documentOp || (msg.DDB_documentOp.trim() === '')) {
            console.log("D10_readDocument: Missing DocumentOp string");
            node.status({fill: "red", shape: "dot", text: "Missing DocumentOp string"});
            node.error("D10_readDocument: Missing DocumentOp string");
            return;
          } else {
            documentOp = msg.DDB_documentOp.trim().toLowerCase();
            const operations = ['read', 'create', 'replace', 'delete', 'replaceItems', 'deleteItems'];
            if (operations.indexOf(documentOp) < 0) {
              console.log("D10_readDocument: Invalid DocumentOp string : " + documentOp);
              node.status({fill: "red", shape: "dot", text: "Invalid DocumentOp string : " + documentOp});
              node.error("D10_readDocument: Invalid DocumentOp string : " + documentOp);
              return;
            }
          }
        } else {
          documentOp = config.documentOp.trim();
        }
      } else {
        documentOp = msg.DDB_documentOp.trim();
      }
      //
      //  Document Id
      //
      if (documentOp !== 'create') {
        if ((config.unid.trim() === '') && 
            (!msg.DDB_unid || ((typeof msg.DDB_unid) !== 'string') || (msg.DDB_unid.trim() === ''))) {
              console.log("D10_readDocument: No Document Id");
              node.status({fill: "red", shape: "dot", text: "No Document Id"});
              node.error("D10_readDocument: No Document Id");
              return;
        } else {
          if (config.unid.trim() !== '') {
            unid = config.unid.trim();
          } else {
            unid = msg.DDB_unid.trim();
          }
        }
      } else {
        unid = '';
      }
      //
      //  Comma-separated list of itemNames
      //
      switch (documentOp) {
        case 'read':
        case 'deleteItems':
          if ((config.itemNames.trim() === '') && 
              (!msg.DDB_itemNames || ((typeof msg.DDB_itemNames) !== 'string') || (msg.DDB_itemNames.trim() === ''))) {
                console.log("D10_readDocument: No Item Names");
                node.status({fill: "red", shape: "dot", text: "No Item Names"});
                node.error("D10_readDocument: No Item Names");
                return;
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
          break;
      }
      //
      //  Get the Item Values
      //
      switch (documentOp) {
        case 'create':
        case 'replace':
        case 'replaceItems':
        let _itemValues = [];
          if ((config.itemValues.trim() === '') && 
              (!msg.DDB_itemValues || !Array.isArray(msg.DDB_itemValues))) {
            //
            //  No Items to be modified! 
            //
            console.log("D10_readDocument: No Item Values");
            node.status({fill: "red", shape: "dot", text: "No Item Values"});
            node.error("D10_readDocument: No Item Values");
            return;
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
              //  Now we shoudl have processed all the pairs in the config input
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
          const arrayToObject = (array, keyField) =>
              array.reduce((obj, item) => {
                obj[item[keyField]] = item.value;
                return obj;
              }, {});
          itemValues = arrayToObject(_itemValues, "name");
          //
          //  And calculate the itemNames into its array
          //
          for (let i=0; i < _itemValues.length; i++){
            itemNames.push(_itemValues[i].name);
          }
          break;
      }
      //
      //  Preparing
      //
      switch (documentOp) {
        case 'read':
          options = {itemNames : itemNames};
          break;
        case 'create':
        case 'replace':
          options = {document : itemValues};
          options2 = {itemNames : itemNames};
          break;
        case 'delete':
          options = {};
          break;
        case 'replaceItems':
          options = {replaceItems : itemValues};
          options2 = {itemNames : itemNames};
          break;
        case 'deleteItems':
          options = {itemNames : itemNames};
          break;
      }
      _logJson("D10_documentMgr: executing operation " + documentOp + " with the following options: ", options);
      
      useServer(serverConfig).then(async server => {
        //
        //  Get the Domino Database
        //
        let db;
        try {
          db = await server.useDatabase(databaseConfig);
        } catch (err) {
          console.log('D10_readDocument: Error Accessing database config');
          console.log(JSON.stringify(databaseConfig, ' ', 2));
          console.log('D10_readDocument: Error follows : ');
          console.log(JSON.stringify(err, ' ', 2));
          node.status({fill:"red", shape:"dot", text:"Error Accessing database config"});
          node.error('D10_readDocument: Error Accessing database config', err);
          return;
        }
        //
        //  Get One document using useDocument
        //
        let useDocument;
        if (documentOp != 'create') {
          try {
            useDocument = await db.useDocument({unid: unid});
          } catch (err) {
            console.log('D10_readDocument: Error using document with unique id ' + unid);
            console.log(JSON.stringify(err, ' ', 2));
            node.status({fill:"red", shape:"dot", text:"Error using document with unique id " + unid});
            node.error('D10_readDocument: Error using document with unique id ' + unid, err);
            return;
          }
        }
        //
        //  Define the output document
        //
        let myDocument;
        let isStrangeError = false;
        try {
          switch (documentOp) {
            case 'read':
              //
              //  Read a Document from useDocument
              //
              myDocument = await useDocument.read(options);
              _logJson('D10_documentMgr: read document:', myDocument);
              break;
            case 'create':
              //
              //  Create a Document and return It
              //
              unid = await db.createDocument(options);
              console.log('D10_documentMgr: document with uniqueId ' + unid + ' has been succesfully created');
              useDocument = await db.useDocument({unid: unid});
              myDocument = await useDocument.read(options2);
              _logJson('D10_documentMgr: created document:', myDocument);
            case 'replace':
              //
              //  Replace a Document and return It
              //
              await useDocument.replace(options);
              myDocument = await useDocument.read(options2);
              _logJson('D10_documentMgr: replaced document:', myDocument);
              break;
            case 'delete':
              await useDocument.delete();
              try {
                myDocument = await useDocument.read({});
                isStrangeError = true;
                _log('D10_documentMgr: ***ERROR** delete document with uniqueId ' + unid + ' FAILED !');
              } catch (e) {
                _log('D10_documentMgr: delete document with uniqueId ' + unid + ' has been deleted !');
                myDocument = {};
              }
              break;
            case 'replaceItems':
              await useDocument.replaceItems(options);
              myDocument = await useDocument.read(options2);
              _logJson('D10_documentMgr: replaced document:', myDocument);
              break;
            case 'deleteItems':
              await useDocument.deleteItems(options);
              myDocument = await useDocument.read(options2);
              _logJson('D10_documentMgr: replaced document:', myDocument);
              break;
          }
        } catch (err) {
          console.log('D10_readDocument: Error performing ' + documentOp +  ' on document qualified by the unique Id : ' + unid);
          console.log(JSON.stringify(err, ' ', 2));
          node.status({fill:"red", shape:"dot", text:'Error performing ' + documentOp +  ' on document qualified by the unique Id : ' + unid});
          node.error('D10_readDocument: Error performing ' + documentOp +  ' on document qualified by the unique Id : ' + unid, err);
          return;
        }
        //
        //  Prepare output
        //
        msg.DDB_doc = myDocument;
        msg.DDB_unid = unid;
        if (isStrangeError) {
          console.log('D10_readDocument: Error Deleting document with uniqueId = ' + unid);
          node.status({fill:"red", shape:"dot", text:"Error deleting document"});
          node.error('D10_readDocument: Error deleting document', {unid : unid});
          return;
        } else {
          node.status({fill:"green", shape:"dot", text:"OK"});
          node.send(msg);
          //
          //  Reset visual status on success
          //
          setTimeout(() => {node.status({});}, 2000);
        }
      })
      .catch(err => {
        console.log('D10_readDocument: Error accessing Server with the following configuration');
        console.log(JSON.stringify(serverConfig, ' ', 2));
        console.log('D10_readDocument: Error follows : ');
        console.log(JSON.stringify(err, ' ', 2));
        node.status({fill:"red", shape:"dot", text:"Error accessing Server"});
        node.error('D10_readDocument: Error accessing Server', err);
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
  RED.nodes.registerType("documentMgr", D10_documentMgr);
  
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