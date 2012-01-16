/*
Copyright (c) 2011 Jonathan M. Altman

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

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
var util = require('util');
var url = require('url');
var HeatEvent = require('./lib/models/heatEvent');
var HeatmapGenerator = require('./lib/imageGen/generateimages');

/*
 * Module exports
 */
module.exports = function heatNode(installPath, options){
  var options = options || {noHitImageUrl:'/img/noHits.png', failImageUrl:'/img/renderFail.png'}
    , mapPath = installPath || '/heatNode'
    , logEventPrefix = mapPath + '/logEvent?'
    , heatmapPrefix = mapPath + '/heatmap/'


  return function heatNode(req, res, next){
  	if (req.url.slice(0, logEventPrefix.length) == logEventPrefix) {
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
      var h = new HeatEvent;
      h.type = 'click';
      h.payload.pageUrl = pagePath;
      h.payload.clickTarget = req.query.clickTarget;
      h.payload.clickPoint.X = Number(req.query.x) || -1;
      h.payload.clickPoint.Y = Number(req.query.y) || -1;
      h.save();
    }
  	else if (req.url.slice(0, heatmapPrefix.length) == heatmapPrefix) {
		var filenameExt = '.png';
		var xWidth = parseInt(req.query.wx);
		var yWidth = parseInt(req.query.wy);
		var httpVer = req.httpVersion;
		var reqUrl = req.url.slice(heatmapPrefix.length, req.url.length);

		var queryStringSepPos = reqUrl.indexOf('?');
		if (queryStringSepPos != -1) {
			reqUrl = reqUrl.slice(0, queryStringSepPos);
		}
	
		if (reqUrl.lastIndexOf(filenameExt) === reqUrl.length - filenameExt.length) {
			reqUrl = reqUrl.slice(0, -1 * filenameExt.length);
		}
	
		HeatEvent.find({'type': 'click', 'payload.pageUrl' : reqUrl}, function(err, docs) {
			if (err) {
				res.redirect(options.failImageUrl);
			}
			else
			{
				if (docs.length == 0){
					res.redirect(options.noHitImageUrl);
				}
				else
				{
					var heatmapper = new HeatmapGenerator();
					heatmapper.GenerateImage(docs, xWidth, yWidth, function(err, imageBuf) {
						if (err) { res.redirect(options.failImageUrl); }
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
    }
  };
};
