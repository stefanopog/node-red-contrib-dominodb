module.exports = function(RED) {
    "use strict";
    const OAuth2 = require('simple-oauth2');
    const urllib = require("url");
    const http = require("follow-redirects").http;
    const https = require("follow-redirects").https;
    const getRawBody = require('raw-body');
    const crypto = require('crypto');
    const rp = require("request-promise-native");
    var __isDebug = process.env.d10Debug || false;


    console.log("*****************************************");
    console.log("* Debug mode is " + (__isDebug ? "enabled" : "disabled") + ' for module DominoDB');
    console.log("*****************************************");


    function dominoDB(config) {
        RED.nodes.createNode(this, config);

        this.name = config.displayName;
        this.displayName = config.displayName;
        this.D10_server = config.D10_server;
        this.D10_db = config.D10_db;
        this.D10_port = config.D10_port;
        _log("###############################################");
        _log("Credentials for [" + this.id + "] " + (this.name ? this.name : ""));
        _logJson("=>", this.credentials);
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
            return {
                D10_server: this.D10_server,
                D10_db: this.D10_db,
                D10_port: this.D10_port,
                displayName: this.name
            };
        };
    };
    
    RED.nodes.registerType(
        "dominodb",
        dominoDB, 
        {
            credentials: {
                D10_server: {type:"text"},
                D10_db: {type:"text"},
                D10_port: {type:"text"},
                displayName: {type: "text"}
            }
        }
    );
   
    //
    //  Internal Helper Functions
    //
    //  Common logging function with JSON Objects
    //
    function _logJson(logMsg, jsonObject) {
        if (__isDebug) {
            console.log("wws-credentials => " + (logMsg ? logMsg : "") + JSON.stringify(jsonObject, " ", 2));
        };
    }
    //
    //  Common logging function
    //
    function _log(logMsg) {
        if (__isDebug) {
            console.log("wws-credentials => " + logMsg);
        };
    }
}