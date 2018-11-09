node-red-contrib-dominodb
=========================

A set of node-red nodes to interact with the new [Domino V10+ NodeJS component](https://www.ibm.com/blogs/collaboration-solutions/2018/10/08/everything-need-know-domino-v10-node-js/).
Meet us at [DestinationDomino](ibm.com/destinationdomino) and follow us at [#DominoForever](https://twitter.com/hashtag/dominoforever)

![Domino10](help/dominoV10-big.jpg)

# *Purpose*
This set of nodes is intended to be provide a simple-to-use NodeRED interface to the the **dominodb nodeJS package**.
As such, it assumes that the  **dominodb nodeJS package** is already installed [see the Installation section](#Installation) on your NodeRED instance. 

Full documentation, including sample NodeRed flows using these nodes, is available in the Documentation Directory of the [corresponding Github repository](https://github.com/stefanopog/node-red-contrib-dominodb/tree/master/docs)

# *Changes*
### V 0.9.2 Documentation Change
* CHanges to this README file

### V 0.9.0 Major Version
* Introducing the **DocumentMgr**, the **Create Documents**, the **Delete Documents/Items**, the **Replace Documents/Items** and the **Explain** nodes.
  * Virtually all APIs are now supported
* Any fatal error (which comes from processing or from missing input parameters) generate a **NodeRED error**. The generated error is, mainly, the incoming **msg object** with the addtional `msg.DDB_fatalError` attribute which explains the error. 
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

 
# *Installation*

### Detailed logging
When setting the <strong style="color:red">d10Debug</strong> environment variable to **true**, a verbose logging is shown in the terminal console.

### Automatic Installation
This packages installs using the standard **Manage Palette** feature in the NodeRed interface.

### Prerequisites
* This package depends on the **AppDev package** distributed by **HCL**. You need to install that package **separately**.
* It is **IMPORTANT** that the **dominodb AppDev pack** would be available as `@domino/domino-db` for the **require** statement used by this NodeRed package !
* A very raw guide to install the **AppDev package** on your local machine or on an **IBM Cloud NodeRed Starter kit** is available in the [docs Github repository](https://github.com/stefanopog/node-red-contrib-dominodb/blob/master/docs/Using%20the%20new%20Domino%20V10%20NodeRED%20nodes%202.pdf) as **Using the new Domino V10 NodeRED nodes 2.pdf**


# *Package Details*
* The inline help for each node provides a detailed explanation of the behavior of each node, including the **input** and **output** parameters.
* Any fatal error (which comes from processing or from missing input parameters) generate a **NodeRED error**. This error is, mainly, the incoming **msg object** with the addtional `msg.DDB_fatalError` attribute which explains the error. 
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

# *Limitations*
* The **Database node** only supports <strong style="color:red">NOT AUTHETICATED</strong> connections
* There is **no support yet** for the <strong style="color:red">start and count</strong> options when using **DQL**
   
# *Known Issues*
* None at the moment but we are sure you will help us finding them :-) 
