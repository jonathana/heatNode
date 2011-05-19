
/**
 * Module dependencies.
 */

var sys = require('sys');
var express = require('express');
var HeatEvent = require('./models/heatEvent');
var HeatmapGenerator = require('./lib/imageGen/generateimages');
var url = require('url');
var config = require('./config');

var app = module.exports = express.createServer();

prodModeVar = process.env.name;
listenPort = 4000 //process.sparkEnv.port;

app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
app.use(express.bodyParser());
app.use(express.static(__dirname + '/public'));
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(app.router);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.post('/logEvent', function(req, res){
	res.send(204);
	var h = new HeatEvent;
	h.type = 'click';
	var pagePath = '';
	if ( req.headers.referer != '') {
		// @TODO double-check that url.parse does decodeURI
		var urlObj = url.parse(req.headers.referer);
		if (!(urlObj === null || urlObj === undefined)) {
			// remove leading slash
			pagePath = urlObj.pathname.substring(1);
		}
	}
	h.payload.pageUrl = pagePath;
	h.payload.clickTarget = req.query.clickTarget;
	h.payload.clickPoint.X = Number(req.query.x) || -1;
	h.payload.clickPoint.Y = Number(req.query.y) || -1;
	h.save();
});

app.get('/heatmap/:url', function(req, res){
	HeatEvent.find({ 'payload.pageUrl' : req.params.url}, function(err, docs) {
		var heatMapper = new HeatmapGenerator()
		heatMapper.GenerateImage(docs, function(err, imageBuf) {
			if (err) { res.send(404); }
			else {
				res.setHeader('Content-Length', imageBuf.length);
				res.setHeader('Content-Type', 'image/x-png');
				res.end(imageBuf);
			}
		});
	});
});

// Only listen on $ node app.js because spark2 does it for us

if (!module.parent) {
  app.listen(listenPort);
  console.log("Express server listening on port %d in %s mode", app.address().port, prodModeVar)
}
