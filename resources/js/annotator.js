var annotation = (function () {
    var g = {
            fileName : 'compressed.tracemonkey-pldi-09.pdf',
            scale : '2.5'  // for pixelated issues, increase this value,
        },
        // pdf file downloaded from: https://github.com/mozilla/pdf.js/blob/master/web/compressed.tracemonkey-pldi-09.pdf
        renderAllPages = function(pdf) {
            var pages = pdf.pdfInfo.numPages;
            var container = document.getElementById('pdf-container');
            for(var i = 1; i <= pages; i++){
                // Using promise to fetch the page
                pdf.getPage(i).then(renderPage.bind(container));
            }
        },
        renderPage = function (page) {
            var viewport = page.getViewport(g.scale);
            //
            // Prepare canvas using PDF page dimensions
            //
            // var canvas = document.getElementById('main');
            var canvas = document.createElement('canvas');
            canvas.className = "page " + page.pageIndex;
            // append the created canvas to the container
            
            this.appendChild(canvas);
            // Get context of the canvas
            var context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            //
            // Render PDF page into canvas context
            //
            page.render({
                canvasContext: context,
                viewport: viewport
            });
        },
        paintPdf = function() {
            PDFJS.getDocument(g.fileName).then(renderAllPages);
        },

        setAnnotation = function (p){
            resizeElement(p);
            setElement(p.x - - p.width, p.y - - p.height);
        },

        setElement = function (left, top) {
            $('.comment-section-hide > .comment-section').clone(false, false).appendTo($(g.div));
        },

        beginDrag = function (e) {
            g.shape = $('.toolbar > .select').data('value');
            if(g.shape !== "cursor"){
                addEvent('#pdf-container', 'mousemove', resizeElement);
                addEvent('#pdf-container', 'mouseup', endDrag);
            
                g.firstX = e.pageX;
                g.firstY = e.pageY;
                g.div = document.createElement('div');
                resizeElement(e);
            }
        },

        endDrag = function (e) {
            var left = g.firstX - - Math.abs(g.width);
            var top = g.firstY - - Math.abs(g.height);
            setElement(left, top);

            removeEvent('#pdf-container', 'mousemove');
            removeEvent('#pdf-container', 'mouseup');
        },

        resizeElement = function (e) {
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
            var container = $('#pdf-container');
            var swidth = container.width();
            var sheight = container.height();


            g.width = left - x;
            g.height = top - y;
            var div = g.div = g.div || document.createElement('div');
            div.className = "shape " + g.shape;
            
            $(div)
                .css({
                    'left': getPercentageValue(left, swidth),
                    'top': getPercentageValue(top, sheight),
                    'width': getPercentageValue(g.width, swidth),
                    'height': getPercentageValue(g.height, sheight)
                })
                .appendTo(container);
        },

        getPercentageValue = function (value, total){
            return Math.abs((value/total) * 100) + "%";
        },
        bringCommentSectionFront = function (e){
            var self = $(this);
            if(bringCommentSectionFront.prev){
                bringCommentSectionFront.prev.css({'zIndex': ''});     
            }
            self.css({'zIndex': '3'});
            bringCommentSectionFront.prev = self;
        },
        addEvent = function(el, event, func){
            $(document).on(event, el, func);
        },
        removeEvent = function(el, event){
            $(document).off(event, el);
        },
        init = function(payload){
            if(payload && typeof payload === "object"){
                for(p in payload){
                    g[p] = payload[p];
                }
            }
            paintPdf();
            addEvent('.page', 'mousedown', beginDrag);
            
            $(document).on('click', '.severity-item', function () {
                $(this).parent().children().removeClass('tick');
                $(this).addClass('tick');
            });
            $('.toolbar div').click(function(){
                $(this).parent().children().removeClass('select');
                $(this).addClass('select');
            });
            addEvent('.shape', 'click', bringCommentSectionFront);
        };
    return {
        init: init
    }
})();
