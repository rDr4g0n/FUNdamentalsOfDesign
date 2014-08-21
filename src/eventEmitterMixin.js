(function(){
	"use strict";

	/**
	 * mixin that adds on, off and emit event emitter functions
	 * to an object. usage:
	 * eventEmitter.call(myObj);
	 */	
	function eventEmitter(){

		var events = {};

		// add listener for `event` that executes `callback`
		var on = function(event, callback, context){
			if(!(event in events)) events[event] = [];
			events[event].push([callback, context]);
		};

		// remove specific callback for event, or remove
		// all callbacks if `callback` is falsy
		var off = function(event, callback){
			if(!callback){
				events[event] = [];
			} else {
				for(var i in events[event]){
					if(events[event][i][0] === callback){
						events[event].splice(i, 1);
						return;
					}
				}
			}
		};

		// trigger all callbacks for `event`, and pass any supplied args in
		var emit = function(event){
			var args = Array.prototype.slice.call(arguments, 1),
				callbackList = events[event] || [];

			// call each callback with the passed in args
			callbackList.forEach(function(callback){
				callback[0].apply(callback[1], args);
			}.bind(this));
		};
		
		var EventEmitter = function(){
			this.on = on;
			this.off = off;
			this.emit = emit;
		};

		EventEmitter.call(this);

		return this;
	};

	window.eventEmitter = eventEmitter;
})();