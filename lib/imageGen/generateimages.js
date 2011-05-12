var path = require('path');
var fs = require('fs');
var temp = require('temp');
var im = require('imagemagick');
var jq = require('jquery');

im.convert.path = '/usr/bin/convert';

function HeatmapGenerator() {
	this.format = 'png';
	this.opacity = 0.50;
	this.dotWidth = 64;
};

HeatmapGenerator.dotImage = __dirname + '/bolilla.png';
HeatmapGenerator.colorImage = __dirname + '/colors.png';
HeatmapGenerator.prototype.format = 'png';
HeatmapGenerator.opacity = 0.50;
HeatmapGenerator.dotWidth = 64;

HeatmapGenerator.prototype.GenerateImage = function(heatmapClicks, callback) {
	var tmpNamePrefix = temp.path();
	var intensity_file = tmpNamePrefix + ".bol.png";
	var empty_file = tmpNamePrefix + ".empty.png";
	var full_file = tmpNamePrefix + ".full.png";
	var colorized_file = tmpNamePrefix + ".color.png";
	var final_file = tmpNamePrefix + ".final.png";
	var maxX, maxY;
	var halfWidth = HeatmapGenerator.dotWidth/2;

	var maxes = this.CalculateMaxDimensions(heatmapClicks);
	maxX = maxes[0];
	maxY = maxes[1];

	var intensity =  (100-Math.ceil(100/heatmapClicks.length)).toString();

	try {

	// Imagemagick call to create a normalized background
	im.convert([ HeatmapGenerator.dotImage, '-fill', 'white', '-colorize', intensity + "%", intensity_file], 
		function(err, metadata){
			if (err) {
				throw err;
			}

			// set up and call Imagemagick to compose the hot spots
			var compose = ['-page'
				, (maxX + halfWidth).toString() + "x" + (maxY + halfWidth).toString()
				, 'pattern:gray100'
			];
			jq.each(heatmapClicks, function (i, curClick) {
				var hmClick = curClick.doc;
				var adjustment = '+' + (hmClick.payload.clickPoint.X-halfWidth).toString() +
					'+' + (hmClick.payload.clickPoint.Y-halfWidth).toString()
console.log(adjustment);
				compose.push('-page', adjustment, intensity_file);
			});

			compose.push('-background', 'white', '-compose', 'multiply', '-flatten', empty_file);
			im.convert(compose, function(err, metadata){
				if (err) {
					throw err;
				}

				// now invert
				invert = [empty_file, '-negate', full_file];
				im.convert(invert, function(err, metadata) {
					if (err) {
						throw err;
					}

					// ...colorize
					colorize = [full_file, '-type', 'TruecolorMatte'
						, HeatmapGenerator.colorImage, '-fx', 'v.p{0,u*v.h}', colorized_file
					];
					im.convert(colorize, function(err, metadata) {
						if (err) {
							throw err;
						}

						// ...and finally add transparency
						transparency = [colorized_file, '-channel', 'A'
							, '-fx', 'A*' + HeatmapGenerator.opacity,  final_file];
						im.convert(transparency, function(err, metadata) {
							if (err) {
								throw err;
							}

							path.exists(final_file, function(exists) {
								var errDoc = true;
								var returnBuf;
								if (exists) {
									wasErr = false;
									returnBuf = fs.readFileSync(final_file);
								}
								//HeatmapGenerator.CleanupTmpFiles([intensity_file, empty_file, full_file, colorized_file, final_file]);
								callback(err, returnBuf);
							});
						});
					});

				});

			});

	});


	}
	catch (err)
	{
		HeatmapGenerator.CleanupTmpFiles([intensity_file, empty_file, full_file, colorized_file, final_file]);
		throw err;
	}
};

HeatmapGenerator.prototype.CalculateMaxDimensions = function(heatmapClicks) {
	var maxX = 0
		, maxY = 0;
	jq.each(heatmapClicks, function (i, curClick) {
		var hmClick = curClick.doc;
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
