## heatNode - web activity tracking/heat mapping

heatNode is a node.js (http://nodejs.org/) based web activity tracker and heatmapper.  It takes in
click activity (currently, really just onMouseDown events) and logs them, and provides an interface
to generate a png overlay over the page showing how "hot" regions of the page are for clicks
(mouseDown events).

There are 2 versions of the typical app.js file.  app.js is built using the Mongoose object<->
document mapper.  app_no_mongoose.js uses the "native" node mongodb driver.

Code is released under a MIT license, except portions copyright and released under a Creative
Commons Attribution 3.0 license.

Inspiration and the graphics files used to generate the heatmaps are from ("The definitive heatmap"):http://blog.corunet.com/the-definitive-heatmap/
