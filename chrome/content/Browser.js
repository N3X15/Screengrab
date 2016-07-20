
screengrab.Browser = function(win) {
	this.win = win;
	this.doc = new screengrab.Document(win.document);
	this.htmlDoc = win.document;
	this.htmlWin = win.content.window;
}
screengrab.Browser.physicalDimensions = function() {
	return new screengrab.Box(
		window.screenX,
	        window.screenY,
		window.outerWidth,
		window.outerHeight
	);
}
screengrab.Browser.viewportAbsoluteDimensions = function() {
	var win = window.top.getBrowser().selectedBrowser;
	var browser = new screengrab.Browser(win.contentWindow);
	return new screengrab.Box(win.boxObject.screenX, win.boxObject.screenY, browser.getViewportWidth(), browser.getViewportHeight());
}
screengrab.Browser.contentFrame = function() {
	var content = document.commandDispatcher.focusedWindow;
	var location = content.location || '';
	location += '';
	if (! location || (location.indexOf('chrome:') == 0)) {
		content = window.content;
	}
	return content;
}
screengrab.Browser.contentFrameDocument = function() {
	return screengrab.Browser.contentFrame().document;
}
screengrab.Browser.contentWindow = function() {
	return window.top.getBrowser().selectedBrowser.contentWindow;
}
screengrab.Browser.contentDocument = function() {
	return screengrab.Browser.contentWindow().document;
}
screengrab.Browser.frameDocumentFor = function(element) {
	return element.ownerDocument;
}
screengrab.Browser.frameFor = function(element) {
    return screengrab.Browser.frameDocumentFor(element).defaultView;
}
screengrab.Browser.prototype = {
    BGCOLOR : "#ffffff",
	
	getContentWindow : function() {
		return this.win;
	},
	
	getDocument : function() {
        return this.doc;
    },
    
	getCompletePageRegion : function() {
		var width = this.getDocumentWidth();
		var height = this.getDocumentHeight();
		if (this.getViewportWidth() > width) width = this.getViewportWidth();
		if (this.getViewportHeight() > height) height = this.getViewportHeight();
        
		return new screengrab.Box(0, 0, width, height);
	},
	
	getVisibleDocumentRegion : function() {
		return new screengrab.Box(this.htmlWin.scrollX, this.htmlWin.scrollY, this.getViewportWidth(), this.getViewportHeight());
	},

    getViewportRegion : function() {
        return new screengrab.Box(0, 0, this.getViewportWidth(), this.getViewportHeight());
    },
	
    getViewportHeight : function() {
        if (this.htmlDoc.compatMode == "CSS1Compat") {
            // standards mode
            return this.htmlDoc.documentElement.clientHeight;
        }
		// compatMode == "BackCompat") - quirks mode
        return this.htmlDoc.body.clientHeight;
    },
    
    getViewportWidth : function() {
        if (this.htmlDoc.compatMode == "CSS1Compat") {
            // standards mode
            return this.htmlDoc.documentElement.clientWidth;
        }
        // compatMode == "BackCompat") - quirks mode 
        return this.htmlDoc.body.clientWidth;
    },
	
	getDocumentHeight : function() {
        if (this.htmlDoc.compatMode == "CSS1Compat") {
            // standards mode
	        return this.htmlDoc.documentElement.scrollHeight;
        }
        return this.htmlDoc.body.scrollHeight;
    },
    
    getDocumentWidth : function() {
        if (this.htmlDoc.compatMode == "CSS1Compat") {
            // standards mode
            return this.htmlDoc.documentElement.scrollWidth;
        }
        return this.htmlDoc.body.scrollWidth;
    },
	
	getCanvas: function() {
		return this.htmlDoc.createElement('canvas');
//		return document.createElementNS("http://www.w3.org/1999/xhtml", "html:canvas");
	},
	
	getFilledCanvas: function(region) {
		region.zoom = screengrab.Util.check_zoom();
		region.width = region.width * region.zoom;
		region.height = region.height * region.zoom;

		var max_value = (screengrab.prefs.getInsertTextImage()) ? 32740 : 32760;

		if (region.width > max_value) {region.width=max_value;}
		if (region.height > max_value) {region.height=max_value;}


		var canvas = this.getCanvas();
		this.copyRegionToCanvas(region, canvas);
		return canvas;
	},
	
	getAsDataUrl : function(region, format, params) {
		var canvas = this.getFilledCanvas();
		return canvas.toDataURL(format, params);
	},
	
	copyRegionToCanvas : function(region, canvas) {
		var insertText = screengrab.prefs.getInsertTextImage();
		var custom_text_height = (insertText) ? 20 : 0;

		region.height = region.height + custom_text_height;
		var context = this.prepareCanvas(canvas, region);
		region.width_draw = (region.zoom && (region.zoom != 0)) ? region.width / region.zoom : region.width;
		region.height_draw = (region.zoom && (region.zoom != 0)) ? region.height / region.zoom : region.height;
		context.drawWindow(this.win, region.x, region.y-custom_text_height, region.width_draw, region.height_draw, this.BGCOLOR);
		context.restore();

		if (insertText) {
			context.fillStyle = "#E7FADE";
			context.clearRect(0, 0, region.width, 19);
			context.fillRect(0, 0, region.width, 19);
			context.fillStyle = "#CC0000";
			context.fillRect(0, 19, region.width, 1);
			context.fillStyle = "black";
			context.mozTextStyle = "12pt bold sans serif";
			context.fillText(screengrab.prefs.createTemplateName('templateImageName'), 3, 15);
		}
		return context;
	},
	
	prepareCanvas : function(canvas, region) {
		canvas.width = region.width;
		canvas.height = region.height;
		canvas.style.width = canvas.style.maxwidth = region.width + "px";
		canvas.style.height = canvas.style.maxheight = region.height + "px";
        
		var context = canvas.getContext("2d");
		context.clearRect(region.x, region.y, region.width, region.height);
                context.scale(region.zoom, region.zoom);
		context.save();
		return context;
	}
}