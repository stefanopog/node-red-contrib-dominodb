/*
Copyright IBM All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

module.exports = function(RED) {
    "use strict";
    var __isDebug = process.env.d10Debug || false;
    var __moduleName = 'D10_dominoDB';


    console.log("*****************************************");
    console.log("* Debug mode is " + (__isDebug ? "enabled" : "disabled") + ' for module ' + __moduleName);
    console.log("*****************************************");


    function D10_dominoDB(config) {
        RED.nodes.createNode(this, config);
        const { __log, __logJson, __logError, __logWarning, __getOptionValue, __getMandatoryInputFromSelect, __getMandatoryInputString, __getOptionalInputString } = require('../common/common.js');

        this.name = config.displayName;
        this.displayName = config.displayName;
        this.D10_server = config.D10_server;
        this.D10_db = config.D10_db;
        this.D10_port = config.D10_port;
        __log(__moduleName, true, "###############################################");
        __logJson(__moduleName, true, "Credentials for [" + this.id + "] " + (this.name ? this.name : ""), this.credentials);
        __log(__moduleName, true, "###############################################");
        
        this.on('close', function(removed, done) {
            if (removed) {
                //
                // This node has been deleted
                //
                RED.log.info("Deleting node " + this.name + "[" + this.id + "] from persistent cache....");
            } else {
                //
                // This node is being restarted
                //
            }
            done();
        });

        this.getCredentials = () => {
            return RED.nodes.getCredentials(this.id);
        };
    };
    
    //
    //  Implementing Basic Authentication
    //
    RED.httpAdmin.get('/credentials', function(req, res) {
        if (!req.query.D10_server || !req.query.D10_db || !req.query.D10_port || !req.query.displayName) {
            res.send(400);
            return;
        }
        var node_id = req.query.id;
        var credentials = {
            D10_server: req.query.D10_server,
            D10_db: req.query.D10_db,
            D10_port: req.query.D10_port,
            displayName: req.query.displayName
        };
        __logJson(__moduleName, true, "*** NEW CREDENTIALS ****", credentials);
        RED.nodes.addCredentials(node_id, credentials);
        res.send(200);
    });

    RED.nodes.registerType(
        "dominodb",
        D10_dominoDB, 
        {
            credentials: {
                D10_server: {type:"text"},
                D10_db: {type:"text"},
                D10_port: {type:"text"},
                displayName: {type: "text"}
            }
        }
    ); 
}