node-red-contrib-dominodb
=========================


[![](https://img.shields.io/npm/dt/node-red-contrib-dominodb.svg?style=flat-square)](https://www.npmjs.com/package/node-red-contrib-dominodb)
[![](https://img.shields.io/npm/dw/node-red-contrib-dominodb.svg?style=flat-square)](https://www.npmjs.com/package/node-red-contrib-dominodb)
[![Domino10](https://img.shields.io/badge/Platform-Domino-%23FEC70B.svg)](http://ibm.com/destinationdomino)
[![](https://img.shields.io/npm/v/node-red-contrib-dominodb.svg?style=plastic)](https://stefanopog.github.io/node-red-contrib-dominodb-docs/)

A set of node-red nodes to interact with the new [Domino V10+ NodeJS component](https://www.ibm.com/blogs/collaboration-solutions/2018/10/08/everything-need-know-domino-v10-node-js/).
Meet us at [DestinationDomino](https://ibm.com/destinationdomino) and follow us at [#DominoForever](https://twitter.com/hashtag/dominoforever)

![Domino10](help/dominoV10-big.jpg)

# **Purpose**
This set of nodes is intended to be provide a simple-to-use NodeRED interface to the the **dominodb nodeJS package**.
As such, it assumes that the  **dominodb nodeJS package** is already installed [see the Installation section](#Installation) on your NodeRED instance. 

Full documentation, including sample NodeRed flows using these nodes, is available [here](https://stefanopog.github.io/node-red-contrib-dominodb-docs/).

# **Changes**
### V 1.2.0 Compute Options
* This version introduces support for the **Compute Options** options when appropriate. You can use this new feature <strong style="color:red">ONLY with V1.0.1 of the AppDev pack, both on the client and on the server</strong>.  
The option is **only available** via the nodes Configuration panels (no support in the incoming <code>msg. ...</code> attributes).
* Few cosmetic enhancements and documentation fixes

### V 1.0.1 Bug Fixing
Fixing a bug that prevented the Configuration Node to work with UNsecure Domino Servers.

### V 1.0.0 Secure Connection and enhancements
* Now the **dominodb Configuration node** supports <strong style="color:red">secure connections to the Proton server</strong>. You can import, via the Configuration Node, the *certificates* from the **Proton component** 
* Addressing the [issue reported here](https://github.com/stefanopog/node-red-contrib-dominodb/issues/2)
* For the **DocumentMgr and ReplaceDocuments/Items nodes** it is now possible to pass the `msg.DDB_itemValues` input parameter as an object. Each property of the object reflects the Domino itemName you need to modify; the value of the property is the new value to be entered
  * The new supported format looks like the following:
<pre>
msg.DDB_itemValues = {};
msg.DDB_itemValues.ActionDate = {type : 'datetime', data : X.toISOString().substring(0,19)+'Z'};
msg.DDB_itemValues.alfa = 'tata';
msg.DDB_itemValues.theNumber = 123.45;
</pre>
  * the old style, where `msg.DDB_itemValues` was an array of objects, where each object had a `name` and a `value` attribute is still supported for backward compatibility. It looks like this and it is much more verbose then the new style:
<pre>
msg.DDB_itemValues = [];
msg.DDB_itemValues[0] = {};
msg.DDB_itemValues[0].name = 'ActionDate';
msg.DDB_itemValues[0].value = {type : 'datetime', data : X.toISOString().substring(0,19)+'Z'};
msg.DDB_itemValues[1] = {};
msg.DDB_itemValues[1].name = 'alfa';
msg.DDB_itemValues[1].value = 'this is the value';
msg.DDB_itemValues[2] = {};
msg.DDB_itemValues[2].name = 'theNumber';
msg.DDB_itemValues[2].value = 123.45;
</pre>
* When the `ìtemValues` input is entered via the **Configuration Panel**, it is now possible to enter **dates and numbers**using the following format: `alfa = 1234.34, beta = "the string",  delta = @dt('2018-08-01T11:18:00Z')`
  * Dates need to be prefixed with the `@dt('` prefix and ended with `')`
  * Numbers are not quoted
  

### V 0.9.8 Bug Fixing and Documentation
* Fixing a bug in processing `name = "value"` pairs in **documentMgr** and **replaceDcouments** modules
  * Now, you can use the `value` field enclosed in single or double quotes
  * commas within the `value` string do not break the processing
* Fixing a Documentation issue in the **replaceDocuments** online help
* Adding *badges* and *Counters* to the `README` file


### V 0.9.6 Introducing *count* and *start*
* The **GetDocuments**, **Replace Documents/items** and **Delete Documents/Items** node now support the `start`and `count` configuration options. 
  * These options **only apply** to operations that are based on **DQL Queries**.
  * Whenever a **DQL Query** is involved, the user can select which results the node should return:
    * `Default` : the query will be executed without any *start* and *count* information (default to 100 items being read, replaced or deleted)
    * `All` : the query will return all results. In this case the **Get Documents** node will retrun all the results, the **Replace Documents/items** node will update all the documents matching the query and the **Delete Documents/Items** node will delete all the documents matching the query or the items for all the documents matching the query. 
    * `byPage` : the query will return `count`results starting at index `start`
* At the same time, some code refactoring has been applied

### V 0.9.4 Fixes
* Fixing problem with **deprecated nodes** : in previous version they were identical to the non-deprecated version. Now restored them to V0.1.0
* Fixing problem with this README file. 
* Introducing the `msg.DDB_result` output attribute for the **Get Documents**, **Create Documents**, **Delete Documents/Items** and **Replace Documents/Items** nodes.
  * All the output attributes from the original API **except `documents`** are, now, grouped under the new `msg.DDB_result` attribute
  * the `msg.DDB_docs` attributes holds the `documents` answser from the API
  * in this way, you may focus on the `msg.DDB_docs` array to immeditaley get the real results and consult the `msg.DDB_result` object only if you need more infos.

### V 0.9.3 Documentation Change
* CHanges to this README file

### V 0.9.0 Major Version
* Introducing the **DocumentMgr**, the **Create Documents**, the **Delete Documents/Items**, the **Replace Documents/Items** and the **Explain** nodes.
  * Virtually all APIs are now supported
* Any fatal error (which comes from processing or from missing input parameters) generate a **NodeRED error**. The generated error is, mainly, the incoming **msg object** with the addtional `msg.DDB_fatal` attribute which explains the error. 
  * You can use a **NodeRED Catch Node** to catch the error that may be generated at runtime.
  * This is particularly useful if yur node belongs to a flow initiatiated by an **HTTP In node** (thanks to [Ulrich Henkel](mailto:ulrich_henkel@de.ibm.com)) for the input.
* The **old version** of the **GetDocuments** and **DocumentMgr** nodes has been <strong style="color:red">DEPRECATED</strong>. 
  * The old version of those two nodes is still available to grant you the possibility to migrate any flow you have already done to the new version of the nodes.
  * The deprecated nodes are grouped under a **Domino10_DEPR** header in the palette
  * You will distinguish the deprecated version because of the *grey background* and the *red cross* over the logo
  * Simply manually copy the configuration of the old, deprecated nodes to the new node to benefit from the newest version
  * The main changes between the old and the new versions are:
    * the new version provides the original **msg object** when a Fatal error is catched by the node
    * When using the **new GetDocuments node**, the output `msg.DDB_docs` is now itself an **array** (instead then an object containing the `documents` array)

### V 0.1.0
* Introducing the **Document Mgr** node to support operations on a single **Domino document**

### V 0.0.1 First version
* Introducing the **Get Documents** node and the **Database** node

 
# **Installation**

### Detailed logging
When setting the <strong style="color:red">d10Debug</strong> environment variable to **true**, a verbose logging is shown in the terminal console.

### Automatic Installation
This packages installs using the standard **Manage Palette** feature in the NodeRed interface.

### Prerequisites
* This package depends on the **AppDev package** distributed by **HCL**. You need to install that package **separately**.
* It is **IMPORTANT** that the **dominodb AppDev pack** would be available as `@domino/domino-db` for the **require** statement used by this NodeRed package !
* A very raw guide to install the **AppDev package** on your local machine or on an **IBM Cloud NodeRed Starter kit** is available [here](https://stefanopog.github.io/node-red-contrib-dominodb-docs/docs/images/envSetup/envSetup.pdf) as **Using the new Domino V10 NodeRED nodes 2.pdf**


# **Package Details**
* The inline help for each node provides a detailed explanation of the behavior of each node, including the **input** and **output** parameters.
* Any fatal error (which comes from processing or from missing input parameters) generate a **NodeRED error**. This error is, mainly, the incoming **msg object** with the addtional `msg.DDB_fatal` attribute which explains the error. 
  * This is particularly useful if yur node belongs to a flow initiatiated by an **HTTP In node** (thanks to [Ulrich Henkel](mailto:ulrich_henkel@de.ibm.com)) for the input.

### Database node
  * creates a configuration node for a dedicated Domino Application, 
  * It holds the Server, Port and Database information
  * No security implemented at the moment
  * Note : **this node is used by all the other nodes**

### Explain node
  * Provides support for the `explainQuery`  API 

### GetDocuments node
  * Provides support for the `bulkReadDocuments` (to get a list of documents using **DQL**) and the `bulkReadDocumentsByUnid` (to get a list of documents by their **unids**) APIs 

### Create Documents node
  * Provides support for the `bulkCreateDocuments` API 

### Replace Documents/Items node
  * Provides support for the `bulkReplaceDocumentsByUnids`,  `bulkReplaceItemsByUnids` and  `bulkReplaceItemss` APIs 

### Delete Documents/Items node
  * Provides support for the `bulkDeleteDocuments`, `bulkDeleteDocumentsByUnids`,  `bulkDeleteItemsByUnids` and  `bulkDeleteItemss` APIs 

### DocumentMgr node
  * Provides support for the the following operations on a single **Domino Document** 
    * `createDocument` to create a new Domino Document
    * `read` to get the details of an existing Domino Document
    * `delete` to delete an existing Domino Document
    * `deleteItems` to remove one or more items from an existing Domino Document
    * `replace` to completely replace an existing Domino Document with a new one
    * `replaceItems` to modify an existing Domino Document by specifying new values for existing items or new items to be added

# Recognition
The `LineReader` package from **Matthew Meyers** ([see here](https://github.com/mgmeyers/LineReader)) has been used.
Thank you Matthew for allowing me to use it

# **Limitations**
* No known limitations
   
# **Known Issues**
* None at the moment but we are sure you will help us finding them :-) 
