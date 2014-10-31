$(function () {
    var g = {
        unit: "px",
        mousedown: false
    };
    // pdf file downloaded from: https://github.com/mozilla/pdf.js/blob/master/web/compressed.tracemonkey-pldi-09.pdf
    PDFJS.getDocument('compressed.tracemonkey-pldi-09.pdf').then(function(pdf) {

        function renderPage(page) {
            // For clarity, increase scale value
            var scale = 2.5;
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
            // Using promise to fetch the page
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
        var unit = g.unit;
        var commentSection = $('.comment-section-hide');
        var div = document.createElement('div');
        div.className = "create";

        $(div).css({
            'left': left + unit,
            'top': top + unit
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
        g.mousedown = true;
        g.firstX = e.pageX;
        g.firstY = e.pageY;
        g.div = document.createElement('div');
        drawElement(e);
    }

    function startDrag(e) {
        if (!$(e.target).is('#pdf-container, .page')) {
            return;
        }
        if (g.mousedown) {
            drawElement(e);
        }
    }

    function endDrag(e) {
        // if (!$(e.target).is('#pdf-container, .page')) {
        //     return;
        // }
        var body = $('#pdf-container');
        var width = body.width();
        var height = body.height();

        var left = g.firstX - - Math.abs(g.width);//e.pageX;
        var top = g.firstY - - Math.abs(g.height);//e.pageY;
        setElement(left, top);

        g.mousedown = false;
    }

    function drawElement(e) {
        var unit = g.unit;
        if(e.pageX){
            var x = e.pageX;
            var y = e.pageY;
            var left = g.firstX;
            var top = g.firstY;
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


        g.width = left - x;
        g.height = top - y;
        var div = g.div || document.createElement('div');
        div.className = "shape " + $('.toolbar > .select').data('value');
        console.log(div.className);
        
        $(div)
            .css({
                'left': left + unit,
                'top': top + unit,
                'width': Math.abs(g.width) + unit,
                'height': Math.abs(g.height) + unit
            })
            .appendTo($('#pdf-container'));

    }
    $('.severity-item').click(function () {
        $(this).parent().children().removeClass('tick');
        $(this).addClass('tick');
    });

    $('.toolbar div').click(function(){
        $(this).parent().children().removeClass('select');
        $(this).addClass('select');
    });
    $(window).resize(function(){
        console.log("resize");
    });
});
