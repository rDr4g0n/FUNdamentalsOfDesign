var util = require("util"),
	EventEmitter = require("events").EventEmitter,
	ids = 0;

function ConnectionAgent(connection){
	this.connection = connection;
	this.id = ++ids;
	this.subscribed = [];

	EventEmitter.call(this);

	connection.on("message", this._onMessage.bind(this));
	connection.on("close", this._onClose.bind(this));

	console.log("New ConnectionAgent created");
}

util.inherits(ConnectionAgent, EventEmitter);

ConnectionAgent.prototype._onMessage = function(message){
	var parsedMessage;

    try {
   		parsedMessage = JSON.parse(message.utf8Data);
   		console.log("Received message", parsedMessage);
   	} catch(e){
   		// message was not valid json
   		console.log("Received invalid message:", message.utf8Data);
   		return;
   	}

   	// if this is a control message, act on it
   	if(parsedMessage.control){
   		console.log("Received control message", parsedMessage.control);
   		this.handleControlMessage(parsedMessage.control, parsedMessage.data);

   	// else, this is a regular message and should be emitted
   	} else {
        this.emit("message", parsedMessage);
   	}
};	

ConnectionAgent.prototype._onClose = function(message){
	console.log("Connection closed", message);
	this.emit("close");
};

ConnectionAgent.prototype.subscribe = function(channels){
	// TODO - ensure no duplication channels
	if(typeof channels === "string"){
		channels = [channels];
	}

	this.subscribed = this.subscribed.concat(channels);
	return channels;
};

ConnectionAgent.prototype.handleControlMessage = function(control, data){
	switch(control){
		case "subscribe":
			this.emit("subscribe", this.subscribe(data));
			break;

		default:
			break;
	}
};

ConnectionAgent.prototype.send = function(message) {
	// TODO - try/catch json encode
	var jsonMessage = JSON.stringify(message);
	this.connection.sendUTF(jsonMessage);
};

module.exports = ConnectionAgent;