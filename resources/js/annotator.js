var annotation = (function () {
    var g = {
            fileName : 'compressed.tracemonkey-pldi-09.pdf',
            fixed: 30,
            scrollTop : 0
        },
        paintPdf = function(data) {
            function loadPDFJS(pid, pageUrl) {
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
            $('.page').on('mousedown', beginDrag);
            $('.toolbar div').on('click', function(){
                $(this).parent().children().removeClass('select');
                $(this).addClass('select');
            });
            $(document).on('click', '.shape', bringCommentSectionFront);
            $(document).on('click', '.severity-item', function () {
                $(this).parent().children().removeClass('tick');
                $(this).addClass('tick');
            });
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
        unsetElement = function(){
            $(g.$selectedArea).remove();
        },
        getOffsetLeft = function(e){
            // return e.offsetX==undefined?e.originalEvent.layerX:e.offsetX;
            return e.clientX;
        },
        getOffsetTop = function(e){
            return e.clientY;
            // return e.offsetY==undefined?e.originalEvent.layerY:e.offsetY;// + $('.document-viewer')[0].scrollTop;
        },
        beginDrag = function (e) {
            if(e.which === 1){
                var shape = $('.toolbar > .select').data('value');
                // Check whether the shape is other than cursor
                // So that the annotation can happen
                if(shape !== "cursor"){
                    g.firstX = e.clientX; //getOffsetLeft(e);
                    g.firstY = e.clientY + g.scrollTop;//getOffsetTop(e) + e.currentTarget.offsetTop;
                    g.$selectedArea = $(document.createElement('div'));
                    g.$selectedArea[0].className = "shape rectangle";
                    beginDrag.offset = {
                        'left': g.firstX,
                        'top': g.firstY
                    };
                    $(g.$selectedArea).css(beginDrag.offset);
                    $(g.$selectedArea).appendTo(g.$container);
                    $('.page').on('mousemove', moveDrag);
                    $(window).on('mouseup', endDrag);
                    buildElement({
                        "left": g.firstX,
                        "top": g.firstY,
                        "shape": shape
                    });
                }
            }
        },
        moveDrag = function(e){
            // var $self = beginDrag.div;
            drawElement({
                'width': getOffsetLeft(e) - beginDrag.offset.left,
                // 'height': getOffsetTop(e) + e.currentTarget.offsetTop - beginDrag.offset.top
                'height': getOffsetTop(e) + g.scrollTop - beginDrag.offset.top
            });
        },

        endDrag = function (e) {
            setElement();
            // Making the selectedArea variable null to be ready for next iteration.
            g.$selectedArea = null;
            $('.page').off('mousemove');
            $(window).off('mouseup', endDrag);
        },
        buildElement = function(p){
            g.$selectedArea = g.$selectedArea || $(document.createElement('div'));

            $resizerClone = $('.resizer-section > div').clone(false, false);
            $(g.$selectedArea).append($resizerClone);

            g.$selectedArea[0].className = "shape " + p.shape;
            $(g.$selectedArea).css({
                'left': getPercentageValue(p.left, g.$container.width()),
                'top': getPercentageValue(p.top, g.$container.height())
            })
            // .addClass(p.shape)
            // .append($resizerClone)
            .appendTo(g.$container);
            $resizerClone.on('mousedown', repositionStart);
            $resizerClone.find('[data-resize]').on('mousedown', resizeStart);
        },
        drawElement = function (p) {
            // console.log(p.width, p.height);
            $(g.$selectedArea)
                .css({
                    'width': getPercentageValue(p.width, g.$container.width()),
                    'height': getPercentageValue(p.height, g.$container.height())
                });
        },

        getPercentageValue = function (value, total){
            // return Math.abs((value/total) * 100) + "%";
            return Math.abs(value);
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
            $self = $(this).parent();
            $(window).on('mousemove', repositionShape);
            $(window).on('mouseup', repositionEnd);
            repositionStart.commentSection = $self.find('.comment-section');
            repositionStart.blnShow = repositionStart.commentSection.is(':visible');
            repositionStart.self = $self;
            repositionStart.offset = {
                left: e.clientX - $self.position().left,
                top: e.clientY - $self.position().top
            };
        },
        repositionShape = function(e){
            $self = repositionStart.self;
            $commentSection = repositionStart.commentSection;
            var dy = g.scrollTop;
            $self.css({
                'left': e.clientX - repositionStart.offset.left,
                'top': e.clientY + dy - repositionStart.offset.top //+ $('.document-viewer')[0].scrollTop
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
            var $shape = $resizer.parents('.shape');
            var op = $resizer.data('resize');

            var offset = $shape.offset();
            var position = $shape.position();
            var pOffset = g.$container.offset();

            var shape = {
                width: $shape.width(),
                height: $shape.height(),
                oTop: offset.top,
                oLeft: offset.left,
                pTop: position.top,
                pLeft: position.left
            }

            var scrollTop = g.scrollTop;

            var offsetLeft = e.clientX; //getOffsetLeft(e);
            var offsetTop = e.clientY; //getOffsetTop(e);


            if (op === "br") {
                $shape.css({
                    'width': offsetLeft - offset.left,
                    'height': offsetTop - offset.top
                });
            } else if (op === "tr") {
                var xHeight = shape.height + (shape.oTop - e.pageY);
                var xTop = shape.height === g.fixed
                            ? scrollTop + Math.abs(shape.pTop) 
                            :e.pageY - pOffset.top + scrollTop - 1;
                var xWidth = e.pageX - $shape.offset().left;

                $shape.css({
                    'height': xHeight,
                    'top': xTop,
                    'width': xWidth
                });
            } else if (op === "tl") {
                var xHeight = shape.height + (shape.oTop - e.pageY);
                var xTop = shape.height === g.fixed 
                            ? scrollTop + Math.abs(shape.pTop) 
                            : e.pageY - pOffset.top + scrollTop - 1;
                var xWidth = shape.width + (shape.oLeft - e.pageX);
                var xLeft = shape.width === g.fixed 
                            ? shape.pLeft 
                            :e.pageX - pOffset.left - 1;


                $shape.css({
                    'height': xHeight,
                    'top': xTop,
                    'width': xWidth,
                    'left': xLeft,
                });
            } else if (op === "bl") {
                var xLeft = shape.width === g.fixed 
                            ? shape.pLeft
                            :e.pageX - pOffset.left - 1;

                var xWidth = shape.width + (shape.oLeft - e.pageX);
                var xHeight = offsetTop - offset.top;
                $shape.css({
                    'width': xWidth,
                    'left': xLeft,
                    'height': xHeight
                });
            }
            setLayout($shape.find('.comment-section'));
        },

        resizeEnd = function(e) {
            $(window).off('mousemove');
            $(window).off('mouseup');
            resizeStart.self = null;
        },
        //End of resizing functions

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
