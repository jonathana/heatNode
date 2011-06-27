/*
Copyright (c) 2011 Jonathan M. Altman

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"),to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom theSoftware is furnished to do so, subject to
the following conditions:

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


/**
 * Module dependencies.
 */

var sys = require('sys');
var express = require('express');
var HeatmapProvider = require('./lib/heatmapProvider/heatmapProvider');
var HeatmapGenerator = require('./lib/imageGen/generateimages');
var url = require('url');
var config = require('./config');

var app = module.exports = express.createServer();
var heatmapProvider = new HeatmapProvider('localhost', 27017);

prodModeVar = process.env.name;
listenPort = 3000
var noHitImagePage = '/img/noHits.png';
var failImagePage = '/img/renderFail.png';

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

app.get('/favicon.ico', function(req, res){
	res.send(404);
});

app.post('/logEvent', function(req, res){
	res.send(204);
	var pagePath = '';
	if ( req.headers.referer != '') {
		// @TODO double-check that url.parse does decodeURI
		var urlObj = url.parse(req.headers.referer);
		if (!(urlObj === null || urlObj === undefined)) {
			// remove leading slash
			pagePath = urlObj.pathname.substring(1);
		}
	}
	var h = {
		type: 'click',
		payload: {
			pageUrl: pagePath,
			clickTarget: req.query.clickTarget,
			eventStamp: new Date(),
			clickPoint: {
				X: Number(req.query.x) || -1,
				Y: Number(req.query.y) || -1
			}
		}
	};
	heatmapProvider.save(h, function(error, docs) {
	});
});

app.get('/heatmap/:url', function(req, res){
	var filenameExt = '.png';
	var xWidth = parseInt(req.query.wx);
	var yWidth = parseInt(req.query.wy);
        var httpVer = req.httpVersion;
        var reqUrl = req.params.url;

        if (reqUrl.lastIndexOf(filenameExt) === reqUrl.length - filenameExt.length) {
                reqUrl = reqUrl.slice(0, -1 * filenameExt.length);
        }

	heatmapProvider.findEventsForUrlStraight ('click', reqUrl, function(err, docs){
		if (err) {
			res.redirect(failImagePage);
		}
		else
		{
			if (docs.length == 0){
				res.redirect(noHitImagePage);
			}
			else
			{
				var heatmapper = new HeatmapGenerator();
				heatmapper.GenerateImage(docs, xWidth, yWidth, function(err, imageBuf) {
					if (err) { res.redirect(failImagePage); }
					else {
						var now = new Date();
						res.setHeader('Content-Length', imageBuf.length);
						res.setHeader('Content-Type', 'image/png');
						// Better hope no pre-1.0 or 1.0.x/pre1.1 servers are floating around
						if ( httpVer != '1.0') {
							res.setHeader('Cache-Control', 'max-age=30, s-maxage=30, no-cache, must-revalidate, proxy-revalidate');
						}
						res.setHeader('Expires', now.toUTCString());
						res.end(imageBuf);
					}
				});
			}
		}
	});
});

// Only listen on $ node app.js because spark2 does it for us

if (!module.parent) {
  app.listen(listenPort);
  console.log("Express server listening on port %d in %s mode", app.address().port, prodModeVar)
}
