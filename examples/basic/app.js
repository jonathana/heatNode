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
var express = require('express');
var heatNode = require('heatNode');

var app = module.exports = express.createServer();

var noHitImagePage = '/img/noHits.png';
var failImagePage = '/img/renderFail.png';

app.use(express.favicon());
app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
app.use(express.bodyParser());
app.use(express.static(__dirname + '/public'));
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(heatNode('/heatNode', {noHitImageUrl:'/img/noHits.png', failImageUrl:'/img/renderFail.png'}));
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

app.get('/', function(req, res){
  res.send('Hello World');
});

// Only listen on $ node app.js because spark2 does it for us

if (!module.parent) {
  app.listen();
}
