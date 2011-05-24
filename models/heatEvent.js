var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

// not sure what a good naming convention for schema vars is so for now we'll CamelCase

var HeatEvent = new Schema({
	type		: { type: String, enum: ['click']}
	, eventStamp	: { type: Date,	default: Date.now } 
	, payload	: {
		clickTarget	: String
		, pageUrl	: { type: String, index: true }
		, clickPoint	: {
			X	: Number
			, Y	: Number
		}
	}
});
HeatEvent.index({ 'type': 1, 'payload.pageUrl': 1});

var db = mongoose.connect('mongodb://localhost/heatNode');
module.exports = db.model('heatEvent', HeatEvent);
