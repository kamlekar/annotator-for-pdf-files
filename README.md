#annotator for pdf files using pdf.js

- I added pdf.js just for view purpose of pdf files.
- To test your pdf file, change the file name "compressed.tracemonkey-pldi-09.pdf" to "`<your file url>`" in main.js file (_Should be on same domain_).

Please download to test. (_Run on a webserver_)

###How to annotate?
- Click on the shapes available on the top-center of the document. (_currently rectangle and sphere shapes are available_)

###Known major issues:

- The annotating shape is moving when resizing or clicking on it.
- When clicked on the annotating shape, the comment section related to it is not hiding.

###Current status:

- I am trying to have pdf rendered using viewer layer of pdfjs as shown in this [example](http://mozilla.github.io/pdf.js/web/viewer.html). (_currently it is being rendered on a canvas_)
