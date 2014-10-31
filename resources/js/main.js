$(function () {
    // pdf file downloaded from: https://github.com/mozilla/pdf.js/blob/master/web/compressed.tracemonkey-pldi-09.pdf
    PDFJS.getDocument('compressed.tracemonkey-pldi-09.pdf').then(function(pdf) {
        // Using promise to fetch the page

        function renderPage(page) {
            var scale = 1;
            var viewport = page.getViewport(scale);
            //
            // Prepare canvas using PDF page dimensions
            //
            // var canvas = document.getElementById('main');
            var canvas = document.createElement('canvas');
            canvas.className = "page " + page.pageIndex;
            // append the created canvas to the container
            var body = document.getElementById('pdf-container');
            body.appendChild(canvas);
            // Get context of the canvas
            var context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            //
            // Render PDF page into canvas context
            //
            var renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            page.render(renderContext);
        }

        var pages = pdf.pdfInfo.numPages;
        for(var i = 1; i <= pages; i++){
            pdf.getPage(i).then(renderPage);
        }
    });

    function setAnnotation(payload){
        var left = payload.x;
        var top = payload.y;
        var width = payload.width;
        var height = payload.height;
        var shape = payload.shape;
        drawElement(payload);
        setElement(left - - width, top - - height);
    }

    function setElement(left, top) {
        setElement.unit = "px";
        var commentSection = $('.comment-section-hide');
        var div = document.createElement('div');
        div.className = "create";

        $(div).css({
            'left': left + setElement.unit,
            'top': top + setElement.unit
        }).append(commentSection.children()
            .clone(true, true))
            .appendTo($('#pdf-container'));
    }
    $(document).on('mouseup', '#pdf-container', endDrag);
    $(document).on('mousedown', '#pdf-container', beginDrag);
    $(document).on('mousemove', '#pdf-container', startDrag);

    function beginDrag(e) {
        if (!$(e.target).is('#pdf-container, .page')) {
            return;
        }
        beginDrag.mousedown = true;
        beginDrag.firstX = e.pageX;
        beginDrag.firstY = e.pageY;
        beginDrag.div = document.createElement('div');
        drawElement(e);
    }

    function startDrag(e) {
        if (!$(e.target).is('#pdf-container, .page')) {
            return;
        }
        if (beginDrag.mousedown) {
            drawElement(e);
        }
    }

    function endDrag(e) {
        if (!$(e.target).is('#pdf-container, .page')) {
            return;
        }
        var body = $('#pdf-container');
        var width = body.width();
        var height = body.height();

        var left = beginDrag.firstX - - Math.abs(drawElement.width);//e.pageX;
        var top = beginDrag.firstY - - Math.abs(drawElement.height);//e.pageY;
        setElement(left, top);

        beginDrag.mousedown = false;
    }

    function drawElement(e) {
        if(e.pageX){
            var x = e.pageX;
            var y = e.pageY;
            var left = beginDrag.firstX;
            var top = beginDrag.firstY;
        }
        else{
            var x = e.x - - e.width;
            var y = e.y - - e.height;
            var left = e.x;
            var top = e.y;
        }
        var body = $('#pdf-container');
        var swidth = body.width();
        var sheight = body.height();


        drawElement.width = left - x;
        drawElement.height = top - y;
        var div = beginDrag.div || document.createElement('div');
        div.className = "shape round";
        
        $(div)
            .css({
                'left': left + "px",
                'top': top + "px",
                'width': Math.abs(drawElement.width) + "px",
                'height': Math.abs(drawElement.height) + "px"
            })
            .appendTo($('#pdf-container'));

    }
    $('.severity-item').click(function () {
        $(this).parent().children().removeClass('tick');
        $(this).addClass('tick');
    });
});
