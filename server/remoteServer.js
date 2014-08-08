var http = require("http"),
	url = require("url"),
	path = require("path"),
	fs = require("fs"),
	srv, wsSrv;
	port = process.argv[2] || 3006;

var WebSocketServer = require("websocket").server;

var wwwPath = "../www/",
	connectionsList = [];

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

wsSrv = new WebSocketServer({
    httpServer: srv,
    autoAcceptConnections: false
});
wsSrv.on("request", function(req){
	var connection = req.accept('echo-protocol', req.origin);

    console.log((new Date()) + ' Connection accepted.');

    connection.on('message', function(message) {
        console.log('Received Message: ' + message.utf8Data);
        connectionsList.forEach(function(connection){
        	connection.sendUTF(message.utf8Data);
        });
    });

    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });

    connectionsList.push(connection);
});