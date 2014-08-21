var http = require("http"),
	url = require("url"),
	path = require("path"),
	fs = require("fs"),
	srv, wsSrv;
	port = process.argv[2] || 3006;

var WebSocketServer = require("websocket").server,
	ConnectionAgent = require("./ConnectionAgent");

var wwwPath = "../www/",
	connectionsList = [],
	channelsMap = {},
	connectionIds = 0;

srv = http.createServer(function(req, res){
	var uri = url.parse(req.url).pathname,
		filename = path.join(process.cwd(), wwwPath, uri);

	path.exists(filename, function(exists){
		if(!exists){
			res.writeHead(404, {"Content-Type": "text/plain"});
			res.write("404 Not Found\n");
			res.end();
			return;
		}

		if(fs.statSync(filename).isDirectory()){
			filename += "index.html";
		}

		fs.readFile(filename, "binary", function(err, file){
			if(err){
				res.writeHead(500, {"Content-Type": "text/plain"});
				res.write(err + "\n");
				res.end();
				return;
			}

			res.setHeader("Content-Type", getContentType(filename));
			res.writeHead(200);
			res.write(file, "binary");
			res.end();
		});
	});
})
srv.listen(parseInt(port, 10));

function getContentType(fileName) {
	var fullPath = path.join(process.cwd(), wwwPath, fileName),
		ext = fullPath.slice(fullPath.lastIndexOf('.')),
		type;

	switch (ext) {
		case ".html":
			type = "text/html";
			break;

		case ".js":
			type = "text/javascript";
			break;

		case ".css":
			type = "text/css";
			break;

		default:
			type = "text/plain";
			break;
	}

	return type;
}

console.log("server running at http://localhost:"+ port);



/** websocket crap **/
// TODO - wrap all this websocket junk into a nice
// little module

wsSrv = new WebSocketServer({
    httpServer: srv,
    autoAcceptConnections: false
});
wsSrv.on("request", function(req){

	var connectionAgent = new ConnectionAgent(req.accept('remote-events', req.origin));

    connectionAgent.on('message', function(message) {
        // rebroadcast this message to everyone except the sender
	    connectionAgent.subscribed.forEach(function(channelName){
	    	console.log("Rebroadcasting message", message, "to channel", channelName);
			broadcastMessage(message, channelsMap[channelName] || [], [connectionAgent.id]);
	    });
    });

    connectionAgent.on("subscribe", function(channels){
    	channels.forEach(function(channelName){
    		if(!channelsMap[channelName]){
    			channelsMap[channelName] = [];
    		}
    		channelsMap[channelName].push(connectionAgent);
    	});
    });

    // TODO - close event
    // TODO - subscribe event

    connectionsList.push(connectionAgent);
});

// broadcasts message `msg` to all connections in
// channel `channel`, whos id is NOT on the blacklist `ignoreList`
function broadcastMessage(msg, channel, ignoreList){
	channel.forEach(function(connection){
		if(!~ignoreList.indexOf(connection.id)){
			connection.send(msg);
		}
	});
}