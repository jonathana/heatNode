var path = require('path');
var fs = require('fs');
var temp = require('temp');
var im = require('imagemagick');
var jq = require('jquery');
var async = require('async');

im.convert.path = '/usr/bin/convert';

function HeatmapGenerator() {
	this.opacity = 0.50;
	this.dotWidth = 64;
};

HeatmapGenerator.dotImage = __dirname + '/bolilla.png';
HeatmapGenerator.colorImage = __dirname + '/colors.png';
HeatmapGenerator.opacity = 0.50;
HeatmapGenerator.dotWidth = 64;

HeatmapGenerator.prototype.GenerateImage = function(heatmapClicks, callback) {
	var tmpNamePrefix = temp.path();
	var intensity_file = tmpNamePrefix + ".bol.png";
	var empty_file = tmpNamePrefix + ".empty.png";
	var full_file = tmpNamePrefix + ".full.png";
	var colorized_file = tmpNamePrefix + ".color.png";
	var watermark_file = tmpNamePrefix + ".text.png";
	var final_file = tmpNamePrefix + ".final.png";
	var maxX, maxY;
	var halfWidth = HeatmapGenerator.dotWidth/2;

	var maxes = this.CalculateMaxDimensions(heatmapClicks);
	maxX = maxes[0];
	maxY = maxes[1];

	var intensity =  (100-Math.ceil(100/heatmapClicks.length)).toString();

	async.series({
		normalize: function(callback){
			im.convert([ HeatmapGenerator.dotImage, '-fill', 'white', '-colorize', intensity + "%", intensity_file], 
				function(err, metadata){
					callback(err, intensity_file);
				});
		}
		, compose: function(callback){
			// set up and call Imagemagick to compose the hot spots

			// boilerplate header
			var compose = ['-page'
				, (maxX + halfWidth).toString() + "x" + (maxY + halfWidth).toString()
				, 'pattern:gray100'
			];

			// each click point
			jq.each(heatmapClicks, function (i, curClick) {
				var hmClick = curClick.doc || curClick;
				var adjustment = '+' + (hmClick.payload.clickPoint.X-halfWidth).toString() +
					'+' + (hmClick.payload.clickPoint.Y-halfWidth).toString()
				compose.push('-page', adjustment, intensity_file);
			});

			// boilerplate footer
			compose.push('-background', 'white', '-compose', 'multiply', '-flatten', empty_file);

			// Run!
			im.convert(compose, function(err, metadata){
				callback(err, empty_file);
			});

		}
		, invert: function(callback){
			invert = [empty_file, '-negate', full_file];
			im.convert(invert, function(err, metadata) {
				callback(err, full_file);
			});
		}
		, colorize: function(callback){
			colorize = [full_file, '-type', 'TruecolorMatte'
				, HeatmapGenerator.colorImage, '-fx', 'v.p{0,u*v.h}', colorized_file
			];
			im.convert(colorize, function(err, metadata) {
				callback(err, colorized_file);
			});

		}
		, watermark: function(callback){
			annotation = "clicks=" + heatmapClicks.length;
			watermark = [colorized_file, '-fill', '#0008', '-draw', 'rectangle 1000,5,1114,22',
				'-fill', 'white', '-annotate', '+1005+18', annotation, watermark_file
			]; 
			im.convert(watermark, function(err, metadata) {
				callback(err, watermark_file);
			});
		}
		, transparency: function(callback){
			transparency = [watermark_file, '-channel', 'A'
				, '-fx', 'A*' + HeatmapGenerator.opacity,  final_file];
			im.convert(transparency, function(err, metadata) {
				callback(err, final_file);
			});

		}
		, imageBuffer: function(callback){
			path.exists(final_file, function(exists) {
				var err = null;
				var returnBuf;
				if (exists) {
					returnBuf = fs.readFileSync(final_file);
				}
				else {
					err = new Error("File " + final_file + " not found");
				}
				callback(err, returnBuf);
			});
		}
	}
	, function (err, results)
	{
		if (err || !Buffer.isBuffer(results.imageBuffer) )
		{
			HeatmapGenerator.CleanupTmpFiles([intensity_file, empty_file, full_file, colorized_file, watermark_file, final_file]);
			throw err;
		}

		HeatmapGenerator.CleanupTmpFiles([intensity_file, empty_file, full_file, colorized_file, watermark_file, final_file]);
		callback(err, results.imageBuffer);
	});
};

HeatmapGenerator.prototype.CalculateMaxDimensions = function(heatmapClicks) {
	var maxX = 0
		, maxY = 0;
	jq.each(heatmapClicks, function (i, curClick) {
		var hmClick = curClick.doc || curClick;
		if (hmClick.payload.clickPoint.X > maxX) { maxX = hmClick.payload.clickPoint.X; }
		if (hmClick.payload.clickPoint.Y > maxY) { maxY = hmClick.payload.clickPoint.Y; }
	});
	return [maxX, maxY];
};

HeatmapGenerator.CleanupTmpFiles = function(fileList) {
	jq.each(fileList, function(i, fileName) {
		if (path.existsSync(fileName)) {
			fs.unlink(fileName);
		}
	});
}

module.exports = HeatmapGenerator;
