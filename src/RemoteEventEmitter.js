(function(){

	// expose to global
	window.RemoteEventEmitter = RemoteEventEmitter;

	// ws protocol for remote event emitter
	var PROTOCOL = "remote-events";

	function RemoteEventEmitter(cfg){

		// websocket connection object
		this.connection = null;
		this.connected = false;
		this.channels = [];

		// TODO - err if no URL
		this.url = cfg.url;

		// make this dude an event emitter
		eventEmitter.call(this);

		// connect
		this.connect(function(){
			// subscribe to channels
			this.subscribe(cfg.channels);
		}.bind(this));
	}



	RemoteEventEmitter.prototype = {
		constructor: RemoteEventEmitter,

		// creates websocket connection to server
		// TODO - abstract protocol so we can use
		// something besides websockets
		// TODO - break out event handlers
		connect: function(success){
			success = success || function(){};

			var ws = new WebSocket(this.url, PROTOCOL);
			ws.onerror = function(e){
				console.log("ws err", e);
			};
			ws.onclose = function(e){
				console.log("ws close", e);
				// TODO - move to disconnect method
				this.connection = null;
				this.connected = false;
			}.bind(this);
			ws.onopen = function(e){
				console.log("ws open!", e);
				// TODO - move to connect function
				this.connection = ws;
				this.connected = true;
				// run success callback
				success();
			}.bind(this);
			ws.onmessage = function(msg){
				var parsedMessage;

				try {
					parsedMessage = JSON.parse(msg.data);
				} catch(e){
					console.error("Invalid message", msg.data);
					return;
				}

				this.emit(parsedMessage.event, parsedMessage.data);
				console.log("got message", parsedMessage);
			}.bind(this);
		},

		subscribe: function(channels){
			// ensure connected
			if(!this.connected){
				throw new Error("Cannot subscribe to channels when not connected");
			}

			// channels should always be an array
			if(typeof channels === "string"){
				channels = [channels];
			}

			// TODO - ensure channel names are valid
			var message = this._createControlMessage("subscribe", channels);

			// TODO - errors. ugh. errors...
			this.connection.send(JSON.stringify(message));

			// TODO - do this only after success
			// add subscribed channels to local channel list
			this.channels = this.channels.concat(channels);
			console.log("Subscribed to the following channels:", channels);
		},

		send: function(eventName, data){
			var message = this._createEventMessage(eventName, data);
			console.log("sending message", JSON.stringify(message));
			this.connection.send(JSON.stringify(message));
		},

		_createEventMessage: function(eventName, data){
			return {
				event: eventName,
				data: data
			};
		},
		// creates a control message. control messages are for
		// controlling the client agent (server side), and the
		// websocket connection.
		_createControlMessage: function(controlEventName, data){
			return {
				control: controlEventName,
				data: data
			};
		}
	};
	

})();