/*
	Portions of this code copyright and/or adapted from Lytebox (http://www.dolem.com/lytebox) 
	under Creative Commons Attribution 3.0 license (http://creativecommons.org/licenses/by/3.0/)

Remainder is :

Copyright (c) 2011 Jonathan M. Altman

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the"Software"),to deal in the Software without restriction, including without
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

function NODEHeatmap() {
	this.divName = 'htNodeHOverlay';
	this.imgId = 'htNodeHImg';
	this.ie = false;
	this.ie7 = (this.ie && window.XMLHttpRequest);
	this.checkFrame();
	var objBody = this.doc.getElementsByTagName("body").item(0);
	
	if (this.doc.getElementById(this.divName)) {
		objBody.removeChild(this.doc.getElementById(this.divName));
	}

	var objOverlay = this.doc.createElement("div");
	objOverlay.setAttribute('id',this.divName);
	// Change overlay position to absolute for IE6 and below, and IE7 with no DOCTYPE, since a fixed position screws everything up for these.
	if ((this.ie && !this.ie7) || (this.ie7 && this.doc.compatMode == 'BackCompat')) {
		objOverlay.style.position = 'absolute';
	}
	objOverlay.style.display = 'none';
	objBody.appendChild(objOverlay);
	this.ActivateLinks();
	
}

NODEHeatmap.prototype.ActivateLinks = function() {
	// populate array of anchors from the appropriate window (could be the parent or iframe document)
	var anchors = (this.isFrame) ? window.parent.frames[window.name].document.getElementsByTagName('a') : document.getElementsByTagName('a');

	// loop through all anchor tags
	for (var i = 0; i < anchors.length; i++) {
		var anchor = anchors[i];
		var relAttribute = String(anchor.getAttribute('rel'));
		if (anchor.getAttribute('href')) {
			if (relAttribute.toLowerCase() == 'htnodeheatmap') {
				anchor.onclick = function () { myNODEHeatmap.start(this); return false; }
			}
		}
	}
};

NODEHeatmap.prototype.generateWindowSizeQueryString = function() {
	return "?wx=" + $(window).width() + "&wy=" + $(window).height()
			+ '&force=' + encodeURIComponent((new Date()).getTime());
};

NODEHeatmap.prototype.start = function(imageLink) {
	if (imageLink.getAttribute('rel').toLowerCase() == 'htnodeheatmap') { 
		var imageInfo = {
			'href': '/heatNode/heatmap' + this.calculateUriPath() + this.generateWindowSizeQueryString(),
			'title': imageLink.getAttribute('title')
		};

		if (imageInfo['href'] != '') {

			// stretch overlay to fill page and fade in
			var pageSize	= this.getPageSize();
			var objOverlay	= this.doc.getElementById('htNodeHOverlay');
			var objBody		= this.doc.getElementsByTagName("body").item(0);

			objOverlay.style.top = "0px";
			objOverlay.style.left = "0px";
			objOverlay.style.height = pageSize[1] + "px";
			objOverlay.style.display = '';

			var imgObj = this.doc.getElementById(this.imgId);
			if (imgObj) {
				objOverlay.removeChild(imgObj);
			}
			imgObj = this.doc.createElement("img");
			imgObj.setAttribute('id', this.imgId);
			imgObj.setAttribute('src', imageInfo['href']);
			imgObj.setAttribute('alt', imageInfo['title']);
			objOverlay.appendChild(imgObj);
			
			if (this.ie && !this.ie7) {	this.toggleSelects('hide');	}
			
			// Hide flash objects (should add a boolean to disable this)
			if (this.hideFlash) { this.toggleFlash('hide'); }
			
			objOverlay.display = '';
			objOverlay.onclick = function() { this.style.display = 'none'; return false; }
		}
	}
};
NODEHeatmap.prototype.calculateUriPath = function() {
	var path = '';
	var uri = this.doc.URL;
	var domain = this.doc.domain;
	var hostMatch = uri.match('\/\/([^:\/]+:)?' + domain + '(:[0-9]+)?\/([^?#]+)');
	if (hostMatch) {
		path = '/' + hostMatch[3] + '.png';
	}
	return path;
}

//***********************************************************************************/
// checkFrame() - Determines if we are in an iFrame or not so we can display properly
//***********************************************************************************/
NODEHeatmap.prototype.checkFrame = function() {
	// If we are an iFrame ONLY (framesets are excluded because we can't overlay a frameset). Note that there are situations
	// where "this" will not refer to LyteBox, such as when buttons are clicked, therefor we have to set this.lytebox appropriately.
	if (window.parent.frames[window.name] && (parent.document.getElementsByTagName('frameset').length <= 0)) {
		this.isFrame = true;
		this.htNodeHeatmap = "window.parent." + window.name + ".myNODEHeatmap";
		this.doc = parent.document;
	} else {
		this.isFrame = false;
		this.htNodeHeatmap = "myNODEHeatmap";
		this.doc = document;
	}
};

//*******************************************************************************/
// getPageSize() - Returns array with page width, height and window width, height
// Core code from - quirksmode.org, Edit for Firefox by pHaez
//*******************************************************************************/
NODEHeatmap.prototype.getPageSize = function() {	
	var xScroll, yScroll, windowWidth, windowHeight;
	
	if (window.innerHeight && window.scrollMaxY) {
		xScroll = this.doc.scrollWidth;
		yScroll = (this.isFrame ? parent.innerHeight : self.innerHeight) + (this.isFrame ? parent.scrollMaxY : self.scrollMaxY);
	} else if (this.doc.body.scrollHeight > this.doc.body.offsetHeight){ // all but Explorer Mac
		xScroll = this.doc.body.scrollWidth;
		yScroll = this.doc.body.scrollHeight;
	} else { // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
		xScroll = this.doc.getElementsByTagName("html").item(0).offsetWidth;
		yScroll = this.doc.getElementsByTagName("html").item(0).offsetHeight;
		
		// Strict mode fixes
		xScroll = (xScroll < this.doc.body.offsetWidth) ? this.doc.body.offsetWidth : xScroll;
		yScroll = (yScroll < this.doc.body.offsetHeight) ? this.doc.body.offsetHeight : yScroll;
	}
	
	if (self.innerHeight) {	// all except Explorer
		windowWidth = (this.isFrame) ? parent.innerWidth : self.innerWidth;
		windowHeight = (this.isFrame) ? parent.innerHeight : self.innerHeight;
	} else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
		windowWidth = this.doc.documentElement.clientWidth;
		windowHeight = this.doc.documentElement.clientHeight;
	} else if (document.body) { // other Explorers
		windowWidth = this.doc.getElementsByTagName("html").item(0).clientWidth;
		windowHeight = this.doc.getElementsByTagName("html").item(0).clientHeight;
		
		// Strict mode fixes...
		windowWidth = (windowWidth == 0) ? this.doc.body.clientWidth : windowWidth;
		windowHeight = (windowHeight == 0) ? this.doc.body.clientHeight : windowHeight;
	}
	
	// for small pages with total height/width less then height/width of the viewport
	var pageHeight = (yScroll < windowHeight) ? windowHeight : yScroll;
	var pageWidth = (xScroll < windowWidth) ? windowWidth : xScroll;
	
	return new Array(pageWidth, pageHeight, windowWidth, windowHeight);
};

//**********************************************************************************************************/
// toggleFlash(state) - Toggles embedded Flash objects so they don't appear above the overlay/lytebox.
//**********************************************************************************************************/
NODEHeatmap.prototype.toggleFlash = function(state) {
	var objects = this.doc.getElementsByTagName("object");
	for (var i = 0; i < objects.length; i++) {
		objects[i].style.visibility = (state == "hide") ? 'hidden' : 'visible';
	}

	var embeds = this.doc.getElementsByTagName("embed");
	for (var i = 0; i < embeds.length; i++) {
		embeds[i].style.visibility = (state == "hide") ? 'hidden' : 'visible';
	}
	
	if (this.isFrame) {
		for (var i = 0; i < parent.frames.length; i++) {
			try {
				objects = parent.frames[i].window.document.getElementsByTagName("object");
				for (var j = 0; j < objects.length; j++) {
					objects[j].style.visibility = (state == "hide") ? 'hidden' : 'visible';
				}
			} catch(e) { /* ignore */ }
			
			try {
				embeds = parent.frames[i].window.document.getElementsByTagName("embed");
				for (var j = 0; j < embeds.length; j++) {
					embeds[j].style.visibility = (state == "hide") ? 'hidden' : 'visible';
				}
			} catch(e) { /* ignore */ }
		}
	}
};

//**********************************************************************************************************/
// toggleSelects(state) - Toggles select boxes between hidden and visible states, including those in iFrames
//**********************************************************************************************************/
NODEHeatmap.prototype.toggleSelects = function(state) {
	// hide in the parent frame, then in child frames
	var selects = this.doc.getElementsByTagName("select");
	for (var i = 0; i < selects.length; i++ ) {
		selects[i].style.visibility = (state == "hide") ? 'hidden' : 'visible';
	}

	if (this.isFrame) {
		for (var i = 0; i < parent.frames.length; i++) {
			try {
				selects = parent.frames[i].window.document.getElementsByTagName("select");
				for (var j = 0; j < selects.length; j++) {
					selects[j].style.visibility = (state == "hide") ? 'hidden' : 'visible';
				}
			} catch(e) { /* ignore */ }
		}
	}
};

	
/* START IT UP! */
function initNODEHeatmap() { myNODEHeatmap = new NODEHeatmap(); }

//***************/
// add listeners
//***************/
$(document).ready(function() {
	initNODEHeatmap();
});
