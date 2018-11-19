/*
Copyright IBM All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/
module.exports = function(RED) {
    "use strict";
    /*
    const OAuth2 = require('simple-oauth2');
    const urllib = require("url");
    const http = require("follow-redirects").http;
    const https = require("follow-redirects").https;
    const getRawBody = require('raw-body');
    const crypto = require('crypto');
    const rp = require("request-promise-native");
    */
    var __isDebug = process.env.d10Debug || false;
    var __moduleName = 'D10_dominoDB';


    console.log("*****************************************");
    console.log("* Debug mode is " + (__isDebug ? "enabled" : "disabled") + ' for module ' + __moduleName);
    console.log("*****************************************");


    function D10_dominoDB(config) {
        RED.nodes.createNode(this, config);

        this.name = config.displayName;
        this.displayName = config.displayName;
        this.D10_server = config.D10_server;
        this.D10_db = config.D10_db;
        this.D10_port = config.D10_port;
        _log("###############################################");
        _log("Credentials for [" + this.id + "] " + (this.name ? this.name : ""));
        _logJson("", this.credentials);
        _log("###############################################");
        
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
            console.log(__moduleName + " => " + (logMsg ? logMsg : "") + JSON.stringify(jsonObj, " ", 2));
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
        _logJson("*** NEW CREDENTIALS ****", credentials);
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