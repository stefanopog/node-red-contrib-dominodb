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
        this.D10_isSecure = config.D10_isSecure;
        this.D10_rootCert = config.D10_rootCert;
        this.D10_clientCert = config.D10_clientCert;
        this.D10_clientKey = config.D10_clientKey;
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

        this.getServerConfig = () => {
            var tmpCred = RED.nodes.getCredentials(this.id);
            /*
            const fs = require('fs');
            const path = require('path');
            const readFile = fileName => {
              try {
                return fs.readFileSync(path.resolve(fileName));
              } catch (error) {
                return undefined;
              }
            };
            const rootCertificate = readFile('/Users/stefano/certificates/ca.crt');
            const clientCertificate = readFile('/Users/stefano/certificates/pquotes.crt');
            const clientKey = readFile('/Users/stefano/certificates/pquotes.key');
            */
            if (tmpCred.D10_isSecure) {
                const rootCertificate = Buffer.from(tmpCred.D10_rootCert);
                const clientCertificate = Buffer.from(tmpCred.D10_clientCert);
                const clientKey = Buffer.from(tmpCred.D10_clientKey);
                return {
                    hostName: tmpCred.D10_server, 
                    connection: {
                        port: tmpCred.D10_port, 
                        secure: true
                    },
                    credentials: {
                        rootCertificate,
                        clientCertificate,
                        clientKey
                    }        
                }
            } else {
                return {
                    hostName: tmpCred.D10_server, 
                    connection: {
                        port: tmpCred.D10_port
                    }
                }
            }
        };

        this.getDatabaseConfig = () => {
            var tmpCred = RED.nodes.getCredentials(this.id);
            return {
                filePath: tmpCred.D10_db
            };
        }
    };
    
    //
    //  This serves the LineReader.js script to the HTML interface
    //  See https://groups.google.com/forum/#!topic/node-red/MFQKemDe-l4
    //
	RED.httpAdmin.get('/dominodb/LineReader.js', function(req, res){
        var path = require('path');
        var filename = path.join(__dirname , 'static', 'LineReader.js');
		res.sendFile(filename);
	});

    RED.nodes.registerType(
        "dominodb",
        D10_dominoDB, 
        {
            credentials: {
                D10_server: {type: "text"},
                D10_db: {type: "text"},
                D10_port: {type: "text"},
                D10_isSecure: {type: "boolean"},
                D10_rootCert: {type: "text"},
                D10_clientCert: {type: "text"},
                D10_clientKey: {type: "text"},
                displayName: {type: "text"}
            }
        }
    ); 
}