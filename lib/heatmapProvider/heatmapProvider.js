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

HeatmapProvider.prototype.save = function(articles, callback) {
	this.getCollection(function(error, heatevents_collection) {
		if( error ) callback(error)
		else {
		if( typeof(articles.length)=="undefined")
			articles = [articles];

		for( var i =0;i< articles.length;i++ ) {
			article = articles[i];
			article.created_at = new Date();
			if( article.comments === undefined ) article.comments = [];
			for(var j =0;j< article.comments.length; j++) {
			article.comments[j].created_at = new Date();
			}
		}

		heatevents_collection.insert(articles, function() {
			callback(null, articles);
		});
		}
	});
};

module.exports = HeatmapProvider;

