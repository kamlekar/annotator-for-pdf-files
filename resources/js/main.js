$(function () {
    // pdf file downloaded from: http://stlab.adobe.com/wiki/images/d/d3/Test.pdf
    PDFJS.getDocument('test.pdf').then(function(pdf) {
        // Using promise to fetch the page
        pdf.getPage(1).then(function(page) {
            var scale = 1;
            var viewport = page.getViewport(scale);

            //
            // Prepare canvas using PDF page dimensions
            //
            var canvas = document.getElementById('main');
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
        });
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
            .appendTo($('.body'));
    }
    $(document).on('mouseup', '.body', endDrag);
    $(document).on('mousedown', '.body', beginDrag);
    $(document).on('mousemove', '.body', startDrag);

    function beginDrag(e) {
        if (!$(e.target).is('.body, .pdfcontent')) {
            return;
        }
        beginDrag.mousedown = true;
        beginDrag.firstX = e.pageX;
        beginDrag.firstY = e.pageY;
        beginDrag.div = document.createElement('div');
        drawElement(e);
    }

    function startDrag(e) {
        if (!$(e.target).is('.body, .pdfcontent')) {
            return;
        }
        if (beginDrag.mousedown) {
            drawElement(e);
        }
    }

    function endDrag(e) {
        if (!$(e.target).is('.body, .pdfcontent')) {
            return;
        }
        var body = $('.body');
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
        var body = $('.body');
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
            .appendTo($('.body'));

    }
    $('.severity-item').click(function () {
        $(this).parent().children().removeClass('tick');
        $(this).addClass('tick');
    });
});
