## heatNode - web activity tracking/heat mapping

heatNode is a node.js (http://nodejs.org/) based web activity tracker and heatmapper.  It takes in
click activity (currently, really just onMouseDown events) and logs them, and provides an interface
to generate a png overlay over the page showing how "hot" regions of the page are for clicks
(mouseDown events).

This is built as connect/express middleware.  To use it, just add it like any other middleware.

Code is released under a MIT license, except portions copyright and released under a Creative
Commons Attribution 3.0 license.

Inspiration and the graphics files used to generate the heatmaps are from ("The definitive heatmap"):http://blog.corunet.com/the-definitive-heatmap/
