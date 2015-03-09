var annotation = (function () {
    var g = {
            fileName : 'compressed.tracemonkey-pldi-09.pdf',
        },
        paintPdf = function(data) {
            function loadPDFJS(pid, pageUrl) {
                PDFJS.workerSrc = 'resources/js/pdfjs/pdf.worker.js';
                var currentPage = 1;
                var pages = [];
                var globalPdf = null;
                function renderPage(page) {
                    //
                    // Prepare canvas using PDF page dimensions
                    //
                    // var canvas = document.getElementById('main');
                    var canvas = document.createElement('canvas');
                    // Link: http://stackoverflow.com/a/13039183/1577396
                    // Canvas width should be set to the window's width for appropriate
                    // scaling factor of the document with respect to the canvas width
                    var viewport = page.getViewport(window.screen.width / page.getViewport(1.0).width);
                    canvas.className = "page " + page.pageIndex;
                    // append the created canvas to the container
                    
                    g.container.appendChild(canvas);
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
                    page.render(renderContext).then(function () {
                        if (currentPage < globalPdf.numPages) {
                            pages[currentPage] = canvas;
                            currentPage++;
                            globalPdf.getPage(currentPage).then(renderPage);
                        } else {
                            // other callback functions
                            loadAnnotations(data);
                        }
                    });
                }
                PDFJS.getDocument(g.fileName).then(function (pdf) {
                    if(!globalPdf){
                        globalPdf = pdf;
                    }
                    pdf.getPage(currentPage).then(renderPage);
                });
            }
            loadPDFJS();
        },

        loadAnnotations = function (p){
            var annotations = p.annotations;
            for(var i=0;i<annotations.length;i++){
                var annotate = annotations[i];
                
                buildElement({
                    "left": annotate.left,
                    "top": annotate.top,
                    "shape": annotate.shape
                });
                drawElement({
                    "width": annotate.width,
                    "height": annotate.height
                });
                setElement();
            }
        },
        makeResizable = function(){
            
        },
        setElement = function (dimensions) {
            var $clone = $('.comment-section-hide > .comment-section').clone(false, false);
            $clone.appendTo($(g.selectedArea));
            setLayout($clone);
        },
        setLayout = function($commentSection){
            // reset all classes
            $commentSection.removeClass('comment-section-left')
                .removeClass('comment-section-right')
                .removeClass('stick-to-top')
                .removeClass('stick-to-bottom');
            // Horizontal alignment
            if($commentSection.offset().left + $commentSection.width() + $commentSection.parent().width() + 45 > $('#pdf-container').width()){
                $commentSection.addClass('comment-section-left');
            }
            else{
                $commentSection.addClass('comment-section-right');
            }
            // Vertical alignment
            if($commentSection.offset().top < 0){
                $commentSection.addClass('stick-to-top');
            }
            //  Math.abs($commentSection.position().top)
            else if($commentSection.offset().top + $commentSection.height() + 20 > $('#pdf-container').height()){
                $commentSection.addClass('stick-to-bottom');   
            }
        },
        unsetElement = function(){
            $(g.selectedArea).remove();
        },
        beginDrag = function (e) {
            if(e.which === 1){
                var shape = $('.toolbar > .select').data('value');
                if(shape !== "cursor"){
                    addEvent('#pdf-container', 'mousemove', function(e){
                        drawElement({
                            "width": g.firstX - e.pageX,
                            "height": g.firstY - e.pageY
                        });
                    });
                    // addEvent('#pdf-container', 'mouseup', endDrag);
                    addEvent(window, 'mouseup', endDrag);
                
                    g.firstX = e.pageX;
                    g.firstY = e.pageY;
                    g.selectedArea = document.createElement('div');

                    buildElement({
                        "left": g.firstX,
                        "top": g.firstY,
                        "shape": shape
                    });
                }
            }
        },

        endDrag = function (e) {
            setElement();
            // Making the selectedArea variable null to be ready for next iteration.
            g.selectedArea = null;
            removeEvent('#pdf-container', 'mousemove');
            removeEvent(window, 'mouseup', endDrag);
        },
        buildElement = function(p){
            g.selectedArea = document.createElement('div');

            $resizerClone = $('.resizer-section > div').clone(false, false);
            $(g.selectedArea).append($resizerClone);

            g.selectedArea.className = "shape " + p.shape;
            $(g.selectedArea).css({
                'left': getPercentageValue(p.left, $(g.container).width()),
                'top': getPercentageValue(p.top, $(g.container).height())
            })
            // .addClass(p.shape)
            // .append($resizerClone)
            .appendTo($(g.container));
            $(g.selectedArea).on('mousedown', repositionStart);
            $resizerClone.find('[data-resize]').on('mousedown', resizeStart);
        },
        drawElement = function (p) {
            $(g.selectedArea)
                .css({
                    'width': getPercentageValue(p.width, $(g.container).width()),
                    'height': getPercentageValue(p.height, $(g.container).height())
                });
        },

        getPercentageValue = function (value, total){
            return Math.abs((value/total) * 100) + "%";
        },
        bringCommentSectionFront = function (e){
            var self = $(this);
            if(bringCommentSectionFront.prev){
                bringCommentSectionFront.prev.css({'zIndex': ''});     
            }
            self.css({'zIndex': '4'});
            bringCommentSectionFront.prev = self;
        },
        addEvent = function(el, event, func){
            if(typeof el === "object"){
                $(window).on(event, func);
            }
            else{
                $(document).on(event, el, func);
            }
            // $(el).on(event, func);
        },
        removeEvent = function(el, event, func){
            if(typeof el === "object"){
                if(func){
                    $(window).off(event, func);
                }
                else{
                    $(window).off(event);   
                }
            }
            else{
                if(func){
                    $(document).off(event, el, func);    
                }
                else{
                    $(document).off(event, el);
                }
            }
        },
        // Start of reposition functions
        repositionStart = function(e){
            if(e.target.getAttribute('data-resize')){
                // e.stopPropagation();
                return false;
            }
            $self = $(this);
            $(window).on('mousemove', repositionShape);
            $(window).on('mouseup', repositionEnd);
            repositionStart.self = $self;
            repositionStart.offset = {
                left: e.pageX - $self.offset().left,
                top: e.pageY - $self.offset().top
            };
        },
        repositionShape = function(e){
            $self = repositionStart.self;
            $self.css({
                'left': e.pageX - repositionStart.offset.left,
                'top': e.pageY - repositionStart.offset.top
            });
            setLayout($self.find('.comment-section'));
        },
        repositionEnd = function(e){
            $(window).off('mousemove');
            $(window).off('mouseup');
            repositionStart.self = null;
        },
        // End of reposition functions

        // Start of resizing functions       
        resizeShape = function(e) {
            var $resizer = resizeStart.self;
            var $shape = $resizer.parents('.shape');
            var op = $resizer.data('resize');
            var offset = $shape.offset();
            var width = $shape.width();
            var height = $shape.height();
            if (op === "br") {
                $shape.css({
                    'width': e.pageX - offset.left,
                        'height': e.pageY - offset.top
                });
            } else if (op === "tr") {
                $shape.css({
                    'height': height + (offset.top - e.pageY),
                        'top': e.pageY,
                        'width': e.pageX - offset.left
                });
            } else if (op === "tl") {
                $shape.css({
                    'height': height + (offset.top - e.pageY),
                        'top': e.pageY,
                        'width': width + (offset.left - e.pageX),
                        'left': e.pageX
                });
            } else if (op === "bl") {
                $shape.css({
                    'width': width + (offset.left - e.pageX),
                        'left': e.pageX,
                        'height': e.pageY - offset.top
                });
            }

            setLayout($shape.find('.comment-section'));
        },

        resizeEnd = function(e) {
            $(window).off('mousemove');
            $(window).off('mouseup');
            resizeStart.self = null;
        },

        resizeStart = function(e) {
            resizeStart.self = $(this);
            $(window).on('mousemove', resizeShape);
            $(window).on('mouseup', resizeEnd);
        },

        //End of resizing functions


        init = function(payload){
            if(payload && typeof payload === "object"){
                for(p in payload){
                    g[p] = payload[p];
                }
            }
            g.container = document.getElementById('pdf-container');
            paintPdf(g.data);
            
            addEvent('.page', 'mousedown', beginDrag);
            addEvent('.severity-item', 'click', function () {
                $(this).parent().children().removeClass('tick');
                $(this).addClass('tick');
            });
            addEvent('.toolbar div', 'click', function(){
                $(this).parent().children().removeClass('select');
                $(this).addClass('select');
            });
            addEvent('.shape', 'click', bringCommentSectionFront);
        };
    return {
        init: init
    }
})();
