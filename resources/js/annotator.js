var annotation = (function () {
    var g = {
            fixed: 30,
        },
        paintPdf = function(data) {
            function loadPDFJS() {
                PDFJS.workerSrc = 'resources/js/pdfjs/pdf.worker.js';
                var currentPage = 1;
                var pages = [];
                var globalPdf = null;
                var container = g.$container.children('.document-viewer')[0];
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
                    
                    container.appendChild(canvas);
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
                            resetValues();
                            loadAnnotations(data);
                            systemCallBacks();
                            g.afterLoadCallBack();
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
        systemCallBacks = function(){
            g.$container.scroll(function(){
                g.scrollTop = $(this).scrollTop();
            });
            $('.page').on('mousedown', beginDraw);
            $('.toolbar div').on('click', function(){
                $(this).parent().children().removeClass('select');
                $(this).addClass('select');
            });
            $(document).on('click', '.shape', bringCommentSectionFront);
            $(document).on('click', '.severity-item', function () {
                $(this).parent().children().removeClass('tick');
                $(this).addClass('tick');
            });
            $(window).resize(resetValues);
            g.scrollTop = g.$container.scrollTop();
        },
        setElement = function (dimensions) {
            var $clone = $('.comment-section-hide > .comment-section').clone(false, false);
            $clone.appendTo(g.$selectedArea);
            g.$selectedArea.addClass('shape-min');
            setLayout($clone);
        },
        setLayout = function($commentSection){
            // reset all classes
            $commentSection.removeClass('comment-section-left')
                .removeClass('comment-section-right')
                .removeClass('stick-to-top')
                .removeClass('stick-to-bottom');

            // Don't change the below repeating code in to reusable variables.
            // Reason: The css classes which are being added are changing the properties.
            // Horizontal alignment
            if($commentSection.offset().left + $commentSection.width() + $commentSection.parent().width() + 45 > $('.document-viewer').width()){
                $commentSection.addClass('comment-section-left');
            }
            else{
                $commentSection.addClass('comment-section-right');
            }
            // Vertical alignment
            if($commentSection.parents('.shape').position().top + g.scrollTop < 50){
                $commentSection.addClass('stick-to-top');
            }
            //  Math.abs($commentSection.position().top)
            else if($commentSection.offset().top + g.scrollTop + $commentSection.height() + 20 > $('.document-viewer').height()){
                $commentSection.addClass('stick-to-bottom');   
            }
        },
        getOffsetLeft = function(e){
            // return e.offsetX==undefined?e.originalEvent.layerX:e.offsetX;
            return e.clientX;
        },
        getOffsetTop = function(e){
            return e.clientY;
            // return e.offsetY==undefined?e.originalEvent.layerY:e.offsetY;// + $('.document-viewer')[0].scrollTop;
        },
        beginDraw = function (e) {
            if(e.which === 1){
                var shape = $('.toolbar > .select').data('value');
                // Check whether the shape is other than cursor
                // So that the annotation can happen
                if(shape !== "cursor"){
                    g.firstX = e.clientX - g.contentOffset.left; //getOffsetLeft(e);
                    g.firstY = e.clientY + g.scrollTop - g.contentOffset.top;//getOffsetTop(e) + e.currentTarget.offsetTop;
                    g.$selectedArea = $(document.createElement('div'));
                    g.$selectedArea[0].className = "shape rectangle";
                    beginDraw.offset = {
                        'left': g.firstX,
                        'top': g.firstY
                    };
                    $(g.$selectedArea).css(beginDraw.offset);
                    $(g.$selectedArea).appendTo(g.$container);
                    $('.page').on('mousemove', moveDraw);
                    $(window).on('mouseup', endDraw);
                    buildElement({
                        "left": g.firstX,
                        "top": g.firstY,
                        "shape": shape
                    });
                }
            }
        },
        moveDraw = function(e){
            // var $self = beginDraw.div;
            drawElement({
                'width': e.clientX - g.contentOffset.left - beginDraw.offset.left,
                // 'height': getOffsetTop(e) + e.currentTarget.offsetTop - beginDraw.offset.top
                'height': e.clientY + g.scrollTop - beginDraw.offset.top - g.contentOffset.top
            });
        },

        endDraw = function (e) {
            setElement();
            // Making the selectedArea variable null to be ready for next iteration.
            g.$selectedArea = null;
            $('.page').off('mousemove');
            $(window).off('mouseup', endDraw);
        },
        buildElement = function(p){
            g.$selectedArea = g.$selectedArea || $(document.createElement('div'));

            $resizerClone = $('.resizer-section > div').clone(false, false);
            $(g.$selectedArea).append($resizerClone);

            g.$selectedArea[0].className = "shape " + p.shape;
            $(g.$selectedArea).css({
                'left': getPercentageValue(p.left, true),
                'top': getPercentageValue(p.top, false)
            })
            // .addClass(p.shape)
            // .append($resizerClone)
            .appendTo(g.$container.children('.document-viewer'));
            $resizerClone.on('mousedown', repositionStart);
            $resizerClone.find('[data-resize]').on('mousedown', resizeStart);
        },
        drawElement = function (p) {
            $(g.$selectedArea)
                .css({
                    'width': getPercentageValue(p.width, true),
                    'height': getPercentageValue(p.height, false)
                });
        },

        getPercentageValue = function (value, isWidth){
            var total = isWidth? g.containerWidth: g.wrapperHeight;
            return Math.abs((value/total) * 100) + "%";
            // return value;
            // return Math.abs(value);
        },
        bringCommentSectionFront = function (e){
            var self = $(this);
            if(bringCommentSectionFront.prev){
                bringCommentSectionFront.prev.css({'zIndex': ''});     
            }
            self.css({'zIndex': '4'});
            bringCommentSectionFront.prev = self;
        },
        // Start of reposition functions
        repositionStart = function(e){
            if(e.target.getAttribute('data-resize')){
                // e.stopPropagation();
                return false;
            }
            $self = $(this).parent();
            $(window).on('mousemove', repositionShape);
            $(window).on('mouseup', repositionEnd);
            repositionStart.commentSection = $self.find('.comment-section');
            repositionStart.blnShow = repositionStart.commentSection.is(':visible');
            repositionStart.self = $self;
            // repositionStart.offset = {
            //     left: e.clientX - $self.position().left,
            //     top : e.clientY - $self.position().top
            // };
            repositionStart.offset = {
                left: e.clientX - $self.position().left,
                top: e.clientY + g.scrollTop - $self.position().top //- g.contentOffset.top
            }
        },
        repositionShape = function(e){
            $self = repositionStart.self;
            $commentSection = repositionStart.commentSection;
            $self.css({
                'left': getPercentageValue(e.clientX - repositionStart.offset.left, true),
                'top' : getPercentageValue(e.clientY + g.scrollTop - repositionStart.offset.top, false)
            });
            setLayout($commentSection);
            //
            if(typeof repositionStart.mouseMoved === "undefined"){
                repositionStart.mouseMoved = true;
                $commentSection.hide();
            }
        },
        repositionEnd = function(e){
            $(window).off('mousemove');
            $(window).off('mouseup');
            var $commentSection = repositionStart.commentSection;
            if(repositionStart.mouseMoved){
                if(repositionStart.blnShow){
                    $commentSection.show();
                }
                else{
                    $commentSection.hide();
                }
            }
            else{
                $commentSection.toggle();
            }
            setLayout($commentSection);
            repositionStart.self = null;
            repositionStart.mouseMoved = undefined;
        },
        // End of reposition functions

        // Start of resizing functions
        resizeStart = function(e) {
            resizeStart.self = $(this);
            $(window).on('mousemove', resizeShape);
            $(window).on('mouseup', resizeEnd);
        },
        resizeShape = function(e) {
            var $resizer = resizeStart.self;
            var $shape   = $resizer.parents('.shape');
            var op       = $resizer.data('resize');

            var offset   = $shape.offset();
            var position = $shape.position();
            var pOffset  = g.$container.offset();

            var shape = {
                width: $shape.width(),
                height: $shape.height(),
                oTop: offset.top,
                oLeft: offset.left,
                pTop: position.top,
                pLeft: position.left
            }

            var offsetLeft = e.pageX;
            var offsetTop  = e.pageY;

            var xUp        = (g.scrollTop + offsetTop - pOffset.top) - shape.pTop;
            // var xDown      = (offsetLeft - pOffset.left) - shape.pLeft;
            var xDown      = offsetLeft - pOffset.left - shape.pLeft;

            var width      = offsetLeft - shape.oLeft;
            var height     = offsetTop  - offset.top;

            var xHeight    = shape.height - xUp;
            var xWidth     = shape.width  - xDown;

            var xTop       = shape.height === g.fixed ? shape.pTop : (g.scrollTop + offsetTop - pOffset.top);
            var xLeft      = shape.width  === g.fixed ? shape.pLeft: shape.pLeft + xDown;

            if (op === "br") {
                $shape.css({
                    'width' : width  ,
                    'height': height 
                });
            } else if (op === "tr") {
                $shape.css({
                    'height': xHeight,
                    'top'   : xTop   ,
                    'width' : width  
                });
            } else if (op === "tl") {
                $shape.css({
                    'height': xHeight,
                    'top'   : xTop   ,
                    'width' : xWidth ,
                    'left'  : xLeft  
                });
            } else if (op === "bl") {
                $shape.css({
                    'width' : xWidth ,
                    'left'  : xLeft  ,
                    'height': height 
                });
            }
            setLayout($shape.find('.comment-section'));
        },

        resizeEnd = function(e) {
            $(window).off('mousemove');
            $(window).off('mouseup');
            //make values in to percentage
            var $shape = resizeStart.self.parents('.shape');
            $shape.css({
                'left': getPercentageValue($shape.position().left, true),
                'top': getPercentageValue($shape.position().top, false),
                'width': getPercentageValue($shape.width(), true),
                'height': getPercentageValue($shape.height(), false)
            })
            resizeStart.self = null;
        },
        //End of resizing functions
        resetValues = function(){
            g.contentOffset = g.$container.offset();
            g.containerWidth = g.$container.width();
            g.containerHeight = g.$container.height();
            g.wrapperHeight = g.$container[0].scrollHeight;
        },
        init = function(payload){
            if(payload && typeof payload === "object"){
                for(p in payload){
                    g[p] = payload[p];
                }
            }
            g.$container = $('#pdf-container');//document.getElementById('pdf-container');
            paintPdf(g.data);
        };
    return {
        init: init
    }
})();
