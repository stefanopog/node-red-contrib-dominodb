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
## V 0.0.1 First version
* Introducing the **Get Documents** node and the **Database** node

# *Package Details*
## Database node
  * creates a configuration node for a dedicated Domino Application, 
  * It holds the Server, Port and Database information
  * No security implemented at the moment
  * Note : **this node is used by all the other nodes**

## GetDocuments node
  * Provides support for the `bulkReadDocuments` (to get a list of documents using **DQL**) and the `bulkReadDocumentsByUnid` (to get a list of documents by their **unids**) APIs 
 

   
# Known Issues
* None at the moment but we are sure you will help us finding them :-) 
  
# *Installation*

## Automatic Installation
This packages installs using the standard **Manage Palette** feature in the NodeRed interface.

## Prerequisites
This package depends on the **dominodb nodeJS package** distributed by HCL. You need to install that package **separately**.
In order to pproperly function, the  **dominodb nodeJS package** needs to be installed in the `node_modules`directory of your **NodeRED** installation

