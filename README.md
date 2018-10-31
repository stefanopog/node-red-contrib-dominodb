node-red-contrib-dominodb
=========================

A set of node-red nodes to interact with the new [Domino V10+ NodeJS component](https://www.ibm.com/blogs/collaboration-solutions/2018/10/08/everything-need-know-domino-v10-node-js/).
Meet us at [DestinationDomino](ibm.com/destinationdomino) and follow us at [#DominoForever](https://twitter.com/hashtag/dominoforever)

![Domino10](help/dominoV10-big.jpg)

# **Purpose**
This set of nodes is intended to be provide a simple-to-use NodeRED interface to the the **dominodb nodeJS package**.
As such, it assumes that the  **dominodb nodeJS package** is already installed [see the Installation section](#Installation) on your NodeRED instance. 

Full documentation, including sample NodeRed flows using these nodes, is available in the Documentation Directory of the [corresponding Github repository](https://github.com/stefanopog/node-red-contrib-dominodb/tree/master/docs)

# **Changes**
## V 0.1.0
* Introducing the **Document Mgr** node to support operations on a single **Domino document**
  
## V 0.0.1 First version
* Introducing the **Get Documents** node and the **Database** node

# **Package Details**
## Database node
  * creates a configuration node for a dedicated Domino Application, 
  * It holds the Server, Port and Database information
  * No security implemented at the moment
  * Note : **this node is used by all the other nodes**

## GetDocuments node
  * Provides support for the `bulkReadDocuments` (to get a list of documents using **DQL**) and the `bulkReadDocumentsByUnid` (to get a list of documents by their **unids**) APIs 


## DocumentMgr node
  * Provides support for the the following operations on a single **Domino Document** 
    * `createDocument`to create a new Domino Document
    * `read` to get the details of an existing Domino Document
    * `delete` to delete an existing Domino Document
    * `deleteItems` to remove one or more items from an existing Domino Document
    * `replace` to completely replace an existing Domino Document with a new one
    * `replaceItems` to modify an existing Domino Document by specifying new values for existing items or new items to be added


   
# **Known Issues**
* None at the moment but we are sure you will help us finding them :-) 
  
# **Installation**

## Automatic Installation
This packages installs using the standard **Manage Palette** feature in the NodeRed interface.

## Prerequisites
This package depends on the **dominodb AppDev pack** distributed by **HCL**. You need to install that package **separately**.
In order to pproperly function, the  **dominodb AppDev pack** needs to be **manually installed** 
* either in the `node_modules` directory of your **NodeRED** installation
* or, globally, in the `node_modules` global directory of your server.

It is **IMPORTANT** that the **dominodb AppDev pack** would be available as `@domino/domino-db` for the **require** statement used by this NodeRed package !




