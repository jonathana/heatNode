/*
Copyright (c) 2011 Jonathan M. Altman

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"),to deal in the Software without restriction, including without
limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons
to whom the Software is furnished to do so, subject tothe following
conditions:

The above copyright notice and this permission notice shall be included 
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.  

*/

// Code adapted from the articleprovider-mongodb.js example
// posted at http://howtonode.org/express-mongodb
var mongo = require('mongodb');
var async = require('async');
var Db= mongo.Db,
	ObjectID= mongo.BSONPure.BSON.ObjectID,
	Server= mongo.Server;

HeatmapProvider = function(host, port) {
	this.db= new Db('heatNode', new Server(host, port, {auto_reconnect: true}, {}));
	this.db.open(function(){});
};

HeatmapProvider.prototype.getCollection= function(callback) {
	this.db.collection('heatevents', function(error, heatevents_collection) {
		if( error ) callback(error);
		else callback(null, heatevents_collection);
	});
};

HeatmapProvider.prototype.findAll = function(callback) {
	this.getCollection(function(error, heatevents_collection) {
		if( error ) callback(error)
		else {
			heatevents_collection.find(function(error, cursor) {
				if( error ) callback(error)
				else {
					cursor.toArray(function(error, results) {
						if( error ) callback(error)
						else callback(null, results)
					});
				}
			});
		}
	});
};

HeatmapProvider.prototype.findEventsForUrl = function(eventType, pageUrl, callback) {
	this.getCollection(function(error, heatevents_collection) {
		if (error) callback(error);
		else {
			heatevents_collection.find(
					{'type': eventType, 'payload.pageUrl': pageUrl},
					function(error, cursor) {
				if( error ) callback(error)
				else {
					cursor.toArray(function(error, results) {
						if( error ) callback(error)
						else callback(null, results)
					});
				}
			});
		}
	});
};

HeatmapProvider.prototype.findEventsForUrlStraight = function(eventType, pageUrl, callback) {
	var self = this;
	var return_callback = callback;
	async.waterfall([
		function(callback){
			self.getCollection(function(error, return_heatevents_collection){
				callback(error, return_heatevents_collection);
			});
		},
		function(heatevents_collection, callback){
			heatevents_collection.find(
					{'type': eventType, 'payload.pageUrl': pageUrl},
					function(error, return_cursor) {
				callback(error, return_cursor);
			});
		},
		function(cursor, callback){
			cursor.toArray(function(error, return_results) {
				callback(error, return_results);
			});
		},
		function(results, callback){
			// process the results
			return_callback(null, results);
		}]
	);
};

HeatmapProvider.prototype.findById = function(id, callback) {
	this.getCollection(function(error, heatevents_collection) {
		if( error ) callback(error)
		else {
		heatevents_collection.findOne({_id: ObjectID.createFromHexString(id)}, function(error, result) {
			if( error ) callback(error)
			else callback(null, result)
		});
		}
	});
};

HeatmapProvider.prototype.save = function(heatmaps, callback) {
	this.getCollection(function(error, heatevents_collection) {
		if( error ) callback(error)
		else {
		if( typeof(heatmaps.length)=="undefined")
			heatmaps = [heatmaps];

		for( var i =0;i< heatmaps.length;i++ ) {
			heatmap = heatmaps[i];
		}

		heatevents_collection.insert(heatmaps, function() {
			callback(null, heatmaps);
		});
		}
	});
};

module.exports = HeatmapProvider;

