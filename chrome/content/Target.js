/**
 * Defines a capture target for screengrab.
 */
screengrab.Target = function() {
	this.contentBrowser = null;
	this.dimensions = null;
}
screengrab.Target.prototype = {
	getBrowser : function() {
		return this.contentBrowser;
	},
	getDimensions : function() {
		return this.dimensions;
	},
	obtainDimensions : function(onObtained) {
		if (onObtained) {
			try {
				onObtained(this.contentBrowser, this.dimensions);
			} catch (error) {
//				dump(error);
			}
		}
	}
}

/**
 * Target to capture the entire contents of a frame
 */
screengrab.FrameTarget = function() {}
screengrab.FrameTarget.superclass = screengrab.Target.prototype;
screengrab.FrameTarget.prototype = {
	obtainDimensions : function(onObtained) {
		var autoScrollToTop = screengrab.prefs.getBool('autoScrollToTop');
		var scrollTop = 0;
		var scrollLeft = 0;
		//-------------------------------------------------------------------------------------
		if (autoScrollToTop) {
			try {
				var doc = gBrowser.contentDocument;
				scrollTop = (doc.documentElement && doc.documentElement.scrollTop) || (doc.body && doc.body.scrollTop);
				scrollLeft = (doc.documentElement && doc.documentElement.scrollLeft) || (doc.body && doc.body.scrollLeft);
			} catch (e) {
			}
			gBrowser.contentWindow.scrollTo(0, 0);
		}
		//-------------------------------------------------------------------------------------
		this.contentBrowser = new screengrab.Browser(screengrab.Browser.contentFrame());
		this.dimensions = this.contentBrowser.getCompletePageRegion();
		screengrab.Target.prototype.obtainDimensions.call(this, onObtained);
		//-------------------------------------------------------------------------------------
		if (autoScrollToTop) {
			gBrowser.contentWindow.scrollTo(scrollLeft, scrollTop);
		}
	}
}
/**
 * Target to capture the visible contents of a window
 */
screengrab.VisibleTarget = function() {}
screengrab.VisibleTarget.superclass = screengrab.Target.prototype;
screengrab.VisibleTarget.prototype = {
    obtainDimensions : function(onObtained) {
        this.contentBrowser = new screengrab.Browser(screengrab.Browser.contentWindow());
        this.dimensions = this.contentBrowser.getVisibleDocumentRegion();
        screengrab.Target.prototype.obtainDimensions.call(this, onObtained);
    }
}
/**
 * Target to capture the entire screen
 */
screengrab.ScreenTarget = function() {}
screengrab.ScreenTarget.superclass = screengrab.Target.prototype;
screengrab.ScreenTarget.prototype = {
    obtainDimensions : function(onObtained) {
        this.contentBrowser = new screengrab.Browser(screengrab.Browser.contentWindow());
        this.dimensions = new screengrab.Box(0, 0, screen.width, screen.height);
        screengrab.Target.prototype.obtainDimensions.call(this, onObtained);
    }
}

/**
 * Target to capture a user specified selection of a window
 */
screengrab.SelectionTarget = function() {
	this.contentBrowser = new screengrab.Browser(screengrab.Browser.contentWindow());
}
screengrab.SelectionTarget.superclass = screengrab.Target.prototype;
screengrab.SelectionTarget.prototype = {
	obtainDimensions : function(onObtained) {
		var me = this;
//		var viewport = screengrab.Browser.contentWindow();
		screengrab.selection.disableDraw();
		window.content.screengrab_callback = function(dimensions) {
			//-------------------------------------------------------------------------------------
			var autoScrollToTop = screengrab.prefs.getBool('autoScrollToTop');
			var scrollTop = 0;
			var scrollLeft = 0;
			//-------------------------------------------------------------------------------------
			if (autoScrollToTop) {
				try {
					var doc = gBrowser.contentDocument;
					scrollTop = (doc.documentElement && doc.documentElement.scrollTop) || (doc.body && doc.body.scrollTop);
					scrollLeft = (doc.documentElement && doc.documentElement.scrollLeft) || (doc.body && doc.body.scrollLeft);
				} catch (e) {
				}
				gBrowser.contentWindow.scrollTo(0, 0);
			}
			//-------------------------------------------------------------------------------------
//			me.dimensions = dimensions.offsetCopy(viewport.scrollX, viewport.scrollY);
			me.dimensions = dimensions.offsetCopy(0, 0);
			me.contentBrowser = new screengrab.Browser(screengrab.Browser.contentWindow());
			screengrab.Target.prototype.obtainDimensions.call(me, onObtained);
			//-------------------------------------------------------------------------------------
			if (autoScrollToTop) {
				gBrowser.contentWindow.scrollTo(scrollLeft, scrollTop);
			}
		}
		screengrab.selection.toggleDraw();
	}
}

/**
 * Target to capture a specific DOM element in the browser
 */
screengrab.ElementTarget = function() {
	this.contentBrowser = new screengrab.Browser(screengrab.Browser.contentWindow());
}
screengrab.ElementTarget.superclass = screengrab.Target.prototype;
screengrab.ElementTarget.prototype = {
	obtainDimensions : function(onObtained) {
		var me = this;
		new screengrab.Highlighter(
			screengrab.Browser.contentWindow(), // the current tab window
			function(event) {
				me.contentBrowser = new screengrab.Browser(screengrab.Browser.frameFor(event.target));
				me.dimensions = me.contentBrowser.getDocument().getDimensionsOf(event.target);
                screengrab.Target.prototype.obtainDimensions.call(me, onObtained);
			});
	}
}
