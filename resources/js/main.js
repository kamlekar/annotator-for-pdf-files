$(function () {
    var g = {
        mousedown: false,
        fileName : 'compressed.tracemonkey-pldi-09.pdf',
        scale : '2.5'  // for pixelated issues, increase this value
    };
    // pdf file downloaded from: https://github.com/mozilla/pdf.js/blob/master/web/compressed.tracemonkey-pldi-09.pdf
    PDFJS.getDocument(g.fileName).then(function(pdf) {

        function renderPage(page) {
            var viewport = page.getViewport(g.scale);
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
        resizeElement(payload);
        setElement(left - - width, top - - height);
    }

    function setElement(left, top) {
        var commentSection = $('.comment-section-hide');
        var div = document.createElement('div');
        div.className = "create";
        var commentClone = commentSection.children()
            .clone(true, true);


        $(div).append(commentClone)
            .appendTo($(g.div));
    }
    $(document).on('mousedown', '.page', beginDrag);
    
    $(document).on('mouseup', '#pdf-container', endDrag);

    function beginDrag(e) {
        $(document).on('mousemove', '#pdf-container', resizeElement);
        g.mousedown = true;
        g.firstX = e.pageX;
        g.firstY = e.pageY;
        g.div = document.createElement('div');
        resizeElement(e);
    }

    function endDrag(e) {
        if(!$(e.target).hasClass('page') && !$(e.target).hasClass('pdf-container')){
            bringCommentSectionFront(e);
            return false;
        }

        var left = g.firstX - - Math.abs(g.width);//e.pageX;
        var top = g.firstY - - Math.abs(g.height);//e.pageY;
        setElement(left, top);

        g.mousedown = false;
        $(document).off('mousemove', '#pdf-container');
    }

    function resizeElement(e) {
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
        var div = g.div = g.div || document.createElement('div');
        div.className = "shape " + $('.toolbar > .select').data('value');
        
        $(div)
            .css({
                // 'left': left + unit,
                // 'top': top + unit,
                // 'width': Math.abs(g.width) + unit,
                // 'height': Math.abs(g.height) + unit
                'left': getPercentageValue(left, swidth),
                'top': getPercentageValue(top, sheight),
                'width': getPercentageValue(g.width, swidth),
                'height': getPercentageValue(g.height, sheight)
            })
            .appendTo($('#pdf-container'));

    }

    function getPercentageValue(value, total){
        return Math.abs((value/total) * 100) + "%";
    }
    $('.severity-item').click(function () {
        $(this).parent().children().removeClass('tick');
        $(this).addClass('tick');
    });

    $('.toolbar div').click(function(){
        $(this).parent().children().removeClass('select');
        $(this).addClass('select');
    });

    function bringCommentSectionFront(e){
        if(this.prev){
            $(this.prev).parents('.shape').css({
                'zIndex': ''
            });     
        }
        this.prev = $(e.target);
        this.prev.parents('.shape').css({
            'zIndex': '3'
        });
    }
});
