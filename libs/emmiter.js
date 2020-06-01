var events = require('events');
var eventEmitter = new events();

eventEmitter.setMaxListeners(0);

module.exports = eventEmitter;