screengrab.selection = {
	BACKGROUND_DIV : "screengrabBackgroundDiv",
	DRAW_DIV : "screengrabDrawDiv",
	BOX_DIV : "screengrabBoxDiv",
	IDLE_IMAGE : "url('chrome://screengrab/skin/idle.png') 0 no-repeat",
	SNAP_IMAGE : "url('chrome://screengrab/skin/snap.png') 0 no-repeat",
	TOOL_TEXT : "Grab/Cancel",
	oldText : null,
	fast_selection : false,

	draw_type : '',
	originX : null,
	originY : null,
	mouseX : null,
	mouseY : null,
	offsetX : null,
	offsetY : null
};
//------------------------------------------------------------------------------
screengrab.selection.toggleDraw = function() {
	if (window.content.drawing) {
		screengrab.selection.disableDrawAndGrabIfRequired();
	} else {
		screengrab.selection.enableDraw();
	}
}
//------------------------------------------------------------------------------
screengrab.selection.insertHeaderElements = function() {
	var x = window.content;
	var pageHead = x.document.getElementsByTagName("head")[0];
    
	if (pageHead == null) { // if page head doesn't exist, create one
		var pageBody = x.document.getElementsByTagName("html")[0];
		pageHead = x.document.createElement("head");
		pageBody.appendChild(pageHead);
		pageHead = x.document.getElementsByTagName("head")[0];
	}
    
	var cssCheck = x.document.getElementById("screengrab_css");
    
	if (cssCheck == null) { // insert stylesheet reference
		var css = x.document.createElement("link");
		css.setAttribute("id", "screengrab_css");
		css.setAttribute("rel", "stylesheet");
		css.setAttribute("type", "text/css");
		css.setAttribute("href", "chrome://screengrab/skin/selection.css");
    
		pageHead.appendChild(css);
	}
}
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
screengrab.selection.beginBoxDraw = function(event) {
	screengrab.selection.fast_selection = screengrab.selection.fast_selection || event.shiftKey || event.ctrlKey;
	screengrab.selection.screengrab_bar_fx_hide();
	screengrab.selection.fastModeTextHide();

	var winCon = window.content;
	var boxDiv = winCon.document.getElementById(screengrab.selection.BOX_DIV);
	if (boxDiv == null) {
		boxDiv = screengrab.selection.createBoxDraw();
	}

	boxDiv.style.display = "none";
	boxDiv.style.left = event.pageX + "px";
	boxDiv.style.top = event.pageY + "px";

	screengrab.selection.originX = event.pageX;
	screengrab.selection.originY = event.pageY;

	screengrab.selection.mouseX = event.pageX;
	screengrab.selection.mouseY = event.pageY;

	screengrab.selection.draw_type = 'start';
}
//------------------------------------------------------------------------------
screengrab.selection.restoreBoxDraw = function() {
	var winCon = window.content;
	var boxDiv = winCon.document.getElementById(screengrab.selection.BOX_DIV);
	if (boxDiv == null) {
		boxDiv = screengrab.selection.createBoxDraw();
	}

	var startX = screengrab.prefs.getInt('selection.startX');
	var startY = screengrab.prefs.getInt('selection.startY');
	boxDiv.style.left = startX + "px";
	boxDiv.style.top = startY + "px";

	screengrab.selection.originX = startX;
	screengrab.selection.originY = startY;

	screengrab.selection.winDoc.scrollTop = screengrab.prefs.getInt('selection.scrollY');
	screengrab.selection.winDoc.scrollLeft = screengrab.prefs.getInt('selection.scrollX');

	screengrab.selection.boxDrawing_left_right({ 'pageX' : screengrab.prefs.getInt('selection.width') + startX });
	screengrab.selection.boxDrawing_up_down({ 'pageY' : screengrab.prefs.getInt('selection.height') + startY });
	screengrab.selection.screengrab_bar_fx_hide();
	screengrab.selection.boxDrawing_text_size();
}
//------------------------------------------------------------------------------
screengrab.selection.createBoxDraw = function() {
	var winCon = window.content;

	var boxDiv = winCon.document.createElement("div");
	boxDiv.setAttribute("id", screengrab.selection.BOX_DIV);
	boxDiv.setAttribute("class", "boxOverlay");
	boxDiv.addEventListener("mousedown", screengrab.selection.boxDrawing_move, true);
	var body = winCon.document.getElementsByTagName("html")[0];
	body.appendChild(boxDiv);

	//-----------------------------------------------------------------------
	var bar_line = winCon.document.createElement("div");
	bar_line.id = 'screengrabBoxDiv_bar_line';
	boxDiv.appendChild(bar_line);

	if (! screengrab.selection.fast_selection) {
		var bar_line_savePosition = winCon.document.createElement("input");
		bar_line_savePosition.id = 'screengrabBoxDiv_bar_line_savePosition';
		bar_line_savePosition.setAttribute('type', 'checkbox');
		bar_line_savePosition.addEventListener("click", screengrab.selection.boxDrawing_savePosition, true);
		bar_line.appendChild(bar_line_savePosition);
		bar_line_savePosition.checked = screengrab.prefs.getBool('selection.savePosition');
		bar_line_savePosition.setAttribute('title', screengrab.Util.get_string('selection.savePosition'));
	}

	var bar_line_text_size = winCon.document.createElement("span");
	bar_line_text_size.id = 'screengrabBoxDiv_bar_line_text_size';
	bar_line.appendChild(bar_line_text_size);

	if (! screengrab.selection.fast_selection) {
		var bar_line_ok = winCon.document.createElement("div");
		bar_line_ok.id = 'screengrabBoxDiv_bar_line_ok';
		bar_line_ok.addEventListener("click", screengrab.selection.OnMouseUpHandlerThatHasToExistForSomeReason, true);
		bar_line.appendChild(bar_line_ok);
	
		var bar_line_cancel = winCon.document.createElement("div");
		bar_line_cancel.id = 'screengrabBoxDiv_bar_line_cancel';
		bar_line_cancel.addEventListener("click", screengrab.selection.disableDraw, true);
		bar_line.appendChild(bar_line_cancel);
	}

	//-----------------------------------------------------------------------
	var resize_up_line = winCon.document.createElement("div");
	resize_up_line.id = 'screengrabBoxDiv_up_line';
	resize_up_line.addEventListener("mousedown", screengrab.selection.boxDrawing_custom, true);
	boxDiv.appendChild(resize_up_line);
	
	var resize_down_line = winCon.document.createElement("div");
	resize_down_line.id = 'screengrabBoxDiv_down_line';
	resize_down_line.addEventListener("mousedown", screengrab.selection.boxDrawing_custom, true);
	boxDiv.appendChild(resize_down_line);
	
	var resize_left_line = winCon.document.createElement("div");
	resize_left_line.id = 'screengrabBoxDiv_left_line';
	resize_left_line.addEventListener("mousedown", screengrab.selection.boxDrawing_custom, true);
	boxDiv.appendChild(resize_left_line);
	
	var resize_right_line = winCon.document.createElement("div");
	resize_right_line.id = 'screengrabBoxDiv_right_line';
	resize_right_line.addEventListener("mousedown", screengrab.selection.boxDrawing_custom, true);
	boxDiv.appendChild(resize_right_line);
	
	var resize_up = winCon.document.createElement("div");
	resize_up.id = 'screengrabBoxDiv_up';
	resize_up.addEventListener("mousedown", screengrab.selection.boxDrawing_custom, true);
	boxDiv.appendChild(resize_up);
	
	var resize_up_left = winCon.document.createElement("div");
	resize_up_left.id = 'screengrabBoxDiv_up_left';
	resize_up_left.addEventListener("mousedown", screengrab.selection.boxDrawing_custom, true);
	boxDiv.appendChild(resize_up_left);
	
	var resize_up_right = winCon.document.createElement("div");
	resize_up_right.id = 'screengrabBoxDiv_up_right';
	resize_up_right.addEventListener("mousedown", screengrab.selection.boxDrawing_custom, true);
	boxDiv.appendChild(resize_up_right);
	
	var resize_left = winCon.document.createElement("div");
	resize_left.id = 'screengrabBoxDiv_left';
	resize_left.addEventListener("mousedown", screengrab.selection.boxDrawing_custom, true);
	boxDiv.appendChild(resize_left);
	
	var resize_right = winCon.document.createElement("div");
	resize_right.id = 'screengrabBoxDiv_right';
	resize_right.addEventListener("mousedown", screengrab.selection.boxDrawing_custom, true);
	boxDiv.appendChild(resize_right);
	
	var resize_down = winCon.document.createElement("div");
	resize_down.id = 'screengrabBoxDiv_down';
	resize_down.addEventListener("mousedown", screengrab.selection.boxDrawing_custom, true);
	boxDiv.appendChild(resize_down);
	
	var resize_down_left = winCon.document.createElement("div");
	resize_down_left.id = 'screengrabBoxDiv_down_left';
	resize_down_left.addEventListener("mousedown", screengrab.selection.boxDrawing_custom, true);
	boxDiv.appendChild(resize_down_left);
	
	var resize_down_right = winCon.document.createElement("div");
	resize_down_right.id = 'screengrabBoxDiv_down_right';
	resize_down_right.addEventListener("mousedown", screengrab.selection.boxDrawing_custom, true);
	boxDiv.appendChild(resize_down_right);

	return boxDiv;
}
//------------------------------------------------------------------------------
screengrab.selection.boxDrawing_move = function(event) {
	screengrab.selection.draw_type = 'move';
	screengrab.selection.originX = event.pageX;
	screengrab.selection.originY = event.pageY;
}
//------------------------------------------------------------------------------
screengrab.selection.boxDrawing_custom = function(event) {
	var resize_div = event.target;
	var winCon = window.content;
	var boxDiv = winCon.document.getElementById(screengrab.selection.BOX_DIV);

	if (resize_div.id == 'screengrabBoxDiv_up_line') {
		screengrab.selection.draw_type = 'up_down';
		screengrab.selection.originY = boxDiv.top_box + boxDiv.height_box;
	}
	else if (resize_div.id == 'screengrabBoxDiv_down_line') {
		screengrab.selection.draw_type = 'up_down';
		screengrab.selection.originY = boxDiv.top_box;
	}
	else if (resize_div.id == 'screengrabBoxDiv_left_line') {
		screengrab.selection.draw_type = 'left_right';
		screengrab.selection.originX = boxDiv.left_box + boxDiv.width_box;
	}
	else if (resize_div.id == 'screengrabBoxDiv_right_line') {
		screengrab.selection.draw_type = 'left_right';
		screengrab.selection.originX = boxDiv.left_box;
	}
	else if (resize_div.id == 'screengrabBoxDiv_up') {
		screengrab.selection.draw_type = 'up_down';
		screengrab.selection.originY = boxDiv.top_box + boxDiv.height_box;
	}
	else if (resize_div.id == 'screengrabBoxDiv_up_left') {
		screengrab.selection.draw_type = 'both';
		screengrab.selection.originX = boxDiv.left_box + boxDiv.width_box;
		screengrab.selection.originY = boxDiv.top_box + boxDiv.height_box;
	}
	else if (resize_div.id == 'screengrabBoxDiv_up_right') {
		screengrab.selection.draw_type = 'both';
		screengrab.selection.originX = boxDiv.left_box;
		screengrab.selection.originY = boxDiv.top_box + boxDiv.height_box;
	}
	else if (resize_div.id == 'screengrabBoxDiv_left') {
		screengrab.selection.draw_type = 'left_right';
		screengrab.selection.originX = boxDiv.left_box + boxDiv.width_box;
	}
	else if (resize_div.id == 'screengrabBoxDiv_right') {
		screengrab.selection.draw_type = 'left_right';
		screengrab.selection.originX = boxDiv.left_box;
	}
	else if (resize_div.id == 'screengrabBoxDiv_down') {
		screengrab.selection.draw_type = 'up_down';
		screengrab.selection.originY = boxDiv.top_box;
	}
	else if (resize_div.id == 'screengrabBoxDiv_down_left') {
		screengrab.selection.draw_type = 'both';
		screengrab.selection.originX = boxDiv.left_box + boxDiv.width_box;
		screengrab.selection.originY = boxDiv.top_box;
	}
	else if (resize_div.id == 'screengrabBoxDiv_down_right') {
		screengrab.selection.draw_type = 'both';
		screengrab.selection.originX = boxDiv.left_box;
		screengrab.selection.originY = boxDiv.top_box;
	}
}
//------------------------------------------------------------------------------
screengrab.selection.boxDrawing = function(event) {
	if ((screengrab.selection.draw_type == 'both') || (screengrab.selection.draw_type == 'start')) {
		screengrab.selection.boxDrawing_up_down(event);
		screengrab.selection.boxDrawing_left_right(event);
	}
	else if (screengrab.selection.draw_type == 'up_down') {
		screengrab.selection.boxDrawing_up_down(event);
	}
	else if (screengrab.selection.draw_type == 'left_right') {
		screengrab.selection.boxDrawing_left_right(event);
	}
	else if (screengrab.selection.draw_type == 'move') {
		screengrab.selection.boxDrawing_move_start(event);
	}
	screengrab.selection.boxDrawing_text_size();
}
//------------------------------------------------------------------------------
screengrab.selection.boxDrawing_left_right = function(event) {
	var winCon = window.content;
	var boxDiv = winCon.document.getElementById(screengrab.selection.BOX_DIV);

	screengrab.selection.mouseX = event.pageX;
	var left_tmp = screengrab.selection.mouseX < screengrab.selection.originX ? screengrab.selection.mouseX : screengrab.selection.originX;
	var left = (left_tmp < 0) ? 0 : left_tmp;
	var width = (left_tmp < 0) ? screengrab.selection.originX : Math.abs(screengrab.selection.mouseX - screengrab.selection.originX);

	//------------------------------------------------------------------------------------
	var doc_width = screengrab.selection.getDocumentWidth();
	if ((left +  width + 5) >= doc_width) {
		boxDiv.setAttribute('is_hide_right_border', true); 
	} else {
		boxDiv.removeAttribute('is_hide_right_border');
	}
	if ((left +  width + 2) >= doc_width) {
		width = doc_width - left - 2;
	}

	//------------------------------------------------------------------------------------
	boxDiv.style.display = "none";
	boxDiv.style.left = left + "px";
	boxDiv.left_box = left;
	screengrab.prefs.setInt('selection.startX', left);

	if (width >= 0) {
		boxDiv.style.width = width + "px";
		boxDiv.width_box = width;
		screengrab.prefs.setInt('selection.width', width);
	}
	boxDiv.style.display = "inline";

	//------------------------------------------------------------------------------------
	try {
		var scrollX = (screengrab.selection.clientWidth + screengrab.selection.winDoc.scrollLeft);
		screengrab.prefs.setInt('selection.scrollX', screengrab.selection.winDoc.scrollLeft);
		if ((screengrab.selection.scrollWidth > screengrab.selection.mouseX) && (screengrab.selection.mouseX > (scrollX - 50))) {
			winCon.scrollBy(1, 0);
		} else if ((screengrab.selection.winDoc.scrollLeft > 0) && (screengrab.selection.mouseX < (screengrab.selection.winDoc.scrollLeft + 50))) {
			winCon.scrollBy(-1, 0);
		}
	} catch(e) {
	}
}
//------------------------------------------------------------------------------
screengrab.selection.boxDrawing_up_down = function(event) {
	var winCon = window.content;
	var boxDiv = winCon.document.getElementById(screengrab.selection.BOX_DIV);

	screengrab.selection.mouseY = event.pageY;
	var top_tmp = screengrab.selection.mouseY < screengrab.selection.originY ? screengrab.selection.mouseY : screengrab.selection.originY;
	var top = (top_tmp < 0) ? 0 : top_tmp;
	var height = (top_tmp < 0) ? screengrab.selection.originY : Math.abs(screengrab.selection.mouseY - screengrab.selection.originY);

	//------------------------------------------------------------------------------------
	var doc_height = screengrab.selection.getDocumentHeight();
	if ((top +  height + 5) >= doc_height) {
		boxDiv.setAttribute('is_hide_bottom_border', true); 
	} else {
		boxDiv.removeAttribute('is_hide_bottom_border');
	}
	if ((top +  height + 2) >= doc_height) {
		height = doc_height - top - 2;
	}

	//------------------------------------------------------------------------------------
	boxDiv.style.display = "none";
	boxDiv.style.top = top + "px";
	boxDiv.top_box = top;
	screengrab.prefs.setInt('selection.startY', top);

	if (height >= 0) {
		boxDiv.style.height = height + "px";
		boxDiv.height_box = height;
		screengrab.prefs.setInt('selection.height', height);
	}
	boxDiv.style.display = "inline";
	//------------------------------------------------------------------------------------
	try {
		screengrab.selection.getClientSize();
		var scrollY = (screengrab.selection.clientHeight + screengrab.selection.winDoc.scrollTop);
		screengrab.prefs.setInt('selection.scrollY', screengrab.selection.winDoc.scrollTop);
		if ((screengrab.selection.scrollHeight > screengrab.selection.mouseY) && (screengrab.selection.mouseY > (scrollY - 50))) {
			winCon.scrollBy(0, 1);
		} else if ((screengrab.selection.winDoc.scrollTop > 0) && (screengrab.selection.mouseY < (screengrab.selection.winDoc.scrollTop + 50))) {
			winCon.scrollBy(0, -1);
		}
	} catch(e) {
	}
}
//------------------------------------------------------------------------------
screengrab.selection.boxDrawing_move_start = function(event) {
	var winCon = window.content;
	var boxDiv = winCon.document.getElementById(screengrab.selection.BOX_DIV);

	screengrab.selection.mouseX = event.pageX;
	screengrab.selection.mouseY = event.pageY;

	boxDiv.left_box += screengrab.selection.mouseX - screengrab.selection.originX;
	boxDiv.top_box += screengrab.selection.mouseY - screengrab.selection.originY;

	//------------------------------------------------------------------------------------
	var doc_width = screengrab.selection.getDocumentWidth();
	if ((boxDiv.left_box +  boxDiv.clientWidth + 5) >= doc_width) {
		boxDiv.setAttribute('is_hide_right_border', true); 
	} else {
		boxDiv.removeAttribute('is_hide_right_border');
	}
	if ((boxDiv.left_box +  boxDiv.clientWidth + 2) >= doc_width) { boxDiv.left_box = doc_width - boxDiv.clientWidth - 2; }
	if (boxDiv.left_box < 0) { boxDiv.left_box = 0; }

	//------------------------------------------------------------------------------------
	var doc_height = screengrab.selection.getDocumentHeight();
	if ((boxDiv.top_box +  boxDiv.clientHeight + 5) >= doc_height) {
		boxDiv.setAttribute('is_hide_bottom_border', true); 
	} else {
		boxDiv.removeAttribute('is_hide_bottom_border');
	}
	if ((boxDiv.top_box +  boxDiv.clientHeight + 2) >= doc_height) { boxDiv.top_box = doc_height - boxDiv.clientHeight - 2; }
	if (boxDiv.top_box < 0) { boxDiv.top_box = 0; }

	//------------------------------------------------------------------------------------
	screengrab.prefs.setInt('selection.startX', boxDiv.left_box);
	screengrab.prefs.setInt('selection.startY', boxDiv.top_box);

	boxDiv.style.display = "none";
	boxDiv.style.left = boxDiv.left_box + "px";
	boxDiv.style.top = boxDiv.top_box + "px";
	boxDiv.style.display = "inline";

	screengrab.selection.originX = event.pageX;
	screengrab.selection.originY = event.pageY;

	//------------------------------------------------------------------------------------
	try {
		screengrab.selection.getClientSize();
		var scrollX = (screengrab.selection.clientWidth + screengrab.selection.winDoc.scrollLeft);
		screengrab.prefs.setInt('selection.scrollX', screengrab.selection.winDoc.scrollLeft);
		if ((screengrab.selection.scrollWidth > screengrab.selection.mouseX) && (screengrab.selection.mouseX > (scrollX - 50))) {
			winCon.scrollBy(1, 0);
		} else if ((screengrab.selection.winDoc.scrollLeft > 0) && (screengrab.selection.mouseX < (screengrab.selection.winDoc.scrollLeft + 50))) {
			winCon.scrollBy(-1, 0);
		}

		var scrollY = (screengrab.selection.clientHeight + screengrab.selection.winDoc.scrollTop);
		screengrab.prefs.setInt('selection.scrollY', screengrab.selection.winDoc.scrollTop);
		if ((screengrab.selection.scrollHeight > screengrab.selection.mouseY) && (screengrab.selection.mouseY > (scrollY - 50))) {
			winCon.scrollBy(0, 1);
		} else if ((screengrab.selection.winDoc.scrollTop > 0) && (screengrab.selection.mouseY < (screengrab.selection.winDoc.scrollTop + 50))) {
			winCon.scrollBy(0, -1);
		}
	} catch(e) {
	}
}
//------------------------------------------------------------------------------
screengrab.selection.boxDrawing_text_size = function() {
	var winCon = window.content;
	var boxDiv = winCon.document.getElementById(screengrab.selection.BOX_DIV);
	if (! boxDiv) { return; }

	var bar_line = winCon.document.getElementById('screengrabBoxDiv_bar_line');
	var bar_line_text_size = winCon.document.getElementById('screengrabBoxDiv_bar_line_text_size');
	var bar_line_ok = winCon.document.getElementById('screengrabBoxDiv_bar_line_ok');
	var bar_line_cancel = winCon.document.getElementById('screengrabBoxDiv_bar_line_cancel');
	screengrab.selection.getClientSize();

	//------------------------------------------------------------------------
	var useZoom = screengrab.prefs.getBool('useZoom');
	var zoom_font = screengrab.Util.check_zoom();
	var zoom = (useZoom) ? zoom_font : 1;

	var doc_width = screengrab.selection.getDocumentWidth();

	bar_line_text_size.textContent = Math.round(boxDiv.width_box*zoom) + ' x ' + Math.round(boxDiv.height_box*zoom);
	bar_line_text_size.style.fontSize = Math.round(14 / zoom_font) + 'px';
	if (bar_line_ok) {
		bar_line_ok.style.width = bar_line_ok.style.height = Math.round(14 / zoom_font) + 'px';
	}
	if (bar_line_cancel) {
		bar_line_cancel.style.width = bar_line_cancel.style.height = Math.round(14 / zoom_font) + 'px';
	}

	//------------------------------------------------------------------------
	//------------------------------------------------------------------------
	var pos_top = boxDiv.top_box - screengrab.selection.winDoc.scrollTop - bar_line.clientHeight - 5;
	if (pos_top > screengrab.selection.clientHeight - bar_line.clientHeight) {
		pos_top = screengrab.selection.clientHeight - bar_line.clientHeight;
	}
	if (pos_top < 5) {
		pos_top = 5;
	}
	bar_line.style.top = pos_top + 'px';

	//------------------------------------------------------------------------
	var box_left = boxDiv.left_box + 3;
	if (boxDiv.width_box > bar_line.clientWidth+5) {
		box_left = boxDiv.left_box + boxDiv.width_box - bar_line.clientWidth - 3;
	}
	var pos_left = box_left - screengrab.selection.winDoc.scrollLeft;
	if (pos_left > screengrab.selection.clientWidth - bar_line.clientWidth) {
		pos_left = screengrab.selection.clientWidth - bar_line.clientWidth;
	}
	if (pos_left < 3) {
		pos_left = 3;
	}
	bar_line.style.left = pos_left + 'px';
}
//------------------------------------------------------------------------------
screengrab.selection.getClientSize = function() {
	var winDoc = null;
	var winCon = window.content;
	try {
		winDoc = (winCon.document.documentElement) ? winCon.document.documentElement : winCon.document.body;
		screengrab.selection.winDoc = winDoc;
	} catch(e) {
	}

	if (winDoc) {
		screengrab.selection.clientWidth = winDoc.clientWidth - 2;
		screengrab.selection.clientHeight = winDoc.clientHeight - 2;
		screengrab.selection.scrollWidth = (winDoc.scrollWidth > winDoc.offsetWidth) ? winDoc.scrollWidth : winDoc.offsetWidth;
		screengrab.selection.scrollHeight = (winDoc.scrollHeight > winDoc.offsetHeight) ? winDoc.scrollHeight : winDoc.offsetHeight;
	}
}
//------------------------------------------------------------------------------
screengrab.selection.boxDrawing_savePosition = function(event) {
	screengrab.prefs.setBool('selection.savePosition', event.target.checked);
}
//------------------------------------------------------------------------------
screengrab.selection.scrollBoxDraw = function(event) {
	var winCon = window.content;
	var boxDiv = winCon.document.getElementById(screengrab.selection.BOX_DIV);

	if (boxDiv) {
		var scrollX = event.pageX;
		var scrollY = event.pageY;
		screengrab.selection.mouseX = screengrab.selection.mouseX + (scrollX - screengrab.selection.offsetX);
		screengrab.selection.mouseY = screengrab.selection.mouseY + (scrollY - screengrab.selection.offsetY);
		screengrab.selection.offsetX = scrollX;
		screengrab.selection.offsetY = scrollY;
		var e = { 'pageX': screengrab.selection.mouseX, 'pageY': screengrab.selection.mouseY };
		screengrab.selection.boxDrawing(e);
	}
}
//------------------------------------------------------------------------------
screengrab.selection.endBoxDraw = function(event) {
	var winCon = window.content;

	if (screengrab.selection.draw_type == 'start') {
		var backgroundDiv = winCon.document.getElementById(screengrab.selection.BACKGROUND_DIV);
		backgroundDiv.removeEventListener("mousedown", screengrab.selection.beginBoxDraw);
		backgroundDiv.removeAttribute('is_start');
		if (screengrab.selection.fast_selection) {
			screengrab.selection.OnMouseUpHandlerThatHasToExistForSomeReason(event);
		}
	}
	screengrab.selection.draw_type = '';
}
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
screengrab.selection.enableDraw = function() {
	screengrab.selection.fast_selection = screengrab.prefs.getBool('selection.fastMode');

	var screengrabBar = window.document.getElementById("screengrab_bar");
	if (screengrabBar != null) {
		screengrabBar.style.background = screengrab.selection.SNAP_IMAGE;
		screengrab.selection.oldText = screengrabBar.tooltiptext;
		screengrabBar.tooltiptext = screengrab.selection.TOOL_TEXT;
    	}
    
	var winCon = window.content;
	screengrab.selection.insertHeaderElements();
    
	var body = winCon.document.getElementsByTagName("html")[0];
        
	var drawDiv = winCon.document.createElement("div");
	drawDiv.setAttribute("id", screengrab.selection.DRAW_DIV);
        
	var backgroundDiv = winCon.document.createElement("div");
	backgroundDiv.setAttribute("id",  screengrab.selection.BACKGROUND_DIV);
	backgroundDiv.setAttribute("class", "backgroundOverlay");
	drawDiv.appendChild(backgroundDiv);
	body.appendChild(drawDiv);

	//------------------------------------------------------------------------
	var hide_hint_text = screengrab.prefs.getBool('selection.hide_hint_text');
	var screengrab_bar_fx = winCon.document.createElement("span");
	screengrab_bar_fx.id = 'screengrab_bar_fx';
	backgroundDiv.appendChild(screengrab_bar_fx);
	//------------------------------------------------------------------------
	if (! hide_hint_text) {
		var screengrab_bar_fx_esc = winCon.document.createElement("div");
		screengrab_bar_fx_esc.className = 'screengrab_text';
		screengrab_bar_fx_esc.textContent = screengrab.Util.get_string('selection.esc.exit');
		screengrab_bar_fx.appendChild(screengrab_bar_fx_esc);

		if (! screengrab.selection.fast_selection) {
			var screengrab_bar_fx_fast_mode = winCon.document.createElement("div");
			screengrab_bar_fx_fast_mode.id = 'screengrab_bar_fx_fast_mode_descr';
			backgroundDiv.appendChild(screengrab_bar_fx_fast_mode);
	
			var fast_mode_descr = winCon.document.createElement("div");
			fast_mode_descr.className = 'screengrab_text screengrab_fast_mode_text';
			screengrab_bar_fx_fast_mode.appendChild(fast_mode_descr);
	
			fast_mode_descr.appendChild(winCon.document.createTextNode(screengrab.Util.get_string('selection.fast_mode')));
			fast_mode_descr.appendChild(winCon.document.createElement("br"));
			fast_mode_descr.appendChild(winCon.document.createTextNode(screengrab.Util.get_string('selection.fast_mode.temp')));
			fast_mode_descr.appendChild(winCon.document.createElement("br"));
			fast_mode_descr.appendChild(winCon.document.createTextNode(screengrab.Util.get_string('selection.fast_mode.always')));
		}
	}
	//------------------------------------------------------------------------
        
	winCon.document.addEventListener("mousemove", screengrab.selection.boxDrawing, true);
	winCon.document.addEventListener("mouseup", screengrab.selection.endBoxDraw, true);
	winCon.document.addEventListener("scroll", screengrab.selection.scrollBoxDraw, true);
	winCon.document.addEventListener("keydown", screengrab.selection.OnKeyDownHandler, true);

	screengrab.selection.offsetX = winCon.pageXOffset || winCon.document.documentElement.scrollLeft;
	screengrab.selection.offsetY = winCon.pageYOffset || winCon.document.documentElement.scrollTop;

	//------------------------------------------------------------------------
	screengrab.selection.getClientSize();
	winCon.drawing = true;

	//------------------------------------------------------------------------
	var savePosition = screengrab.prefs.getBool('selection.savePosition');
	if (savePosition && (! screengrab.selection.fast_selection)) {
		screengrab.selection.fastModeTextHide();
		screengrab.selection.restoreBoxDraw();
	} else {
		backgroundDiv.setAttribute('is_start', true);
		backgroundDiv.addEventListener("mousedown", screengrab.selection.beginBoxDraw);
	}
}
//------------------------------------------------------------------------------
screengrab.selection.disableDrawAndGrabIfRequired = function(event) {
	var result = screengrab.selection.disableDraw(event);
	try {
		if (result.box != null && event != null) {
//			screengrab.selection.callback(result.dimBox);
			window.content.screengrab_callback(result.dimBox);
		}
	} catch (error) {
//		screengrab.error(error);
	}
}
//------------------------------------------------------------------------------
screengrab.selection.OnMouseUpHandlerThatHasToExistForSomeReason = function(event) {
	if (event.target.id == 'screengrab_bar_fx') {
		screengrab.selection.disableDraw(event);
	} else {
		screengrab.selection.disableDrawAndGrabIfRequired(event);
	}
}
//------------------------------------------------------------------------------
screengrab.selection.OnKeyDownHandler = function(event) {
	if (event.keyCode === 27 ) {
		screengrab.selection.disableDraw(event);
	}
}
//------------------------------------------------------------------------------
screengrab.selection.disableDraw = function(event) {
	var winCon = window.content;
	try {
		winCon.document.removeEventListener("mousemove", screengrab.selection.boxDrawing, true);
		winCon.document.removeEventListener("mouseup", screengrab.selection.endBoxDraw, true);
		winCon.document.removeEventListener("scroll", screengrab.selection.scrollBoxDraw, true);
		winCon.document.removeEventListener("keydown", screengrab.selection.OnKeyDownHandler, true);
	} catch (error) {
	}
	var box = null;
	var dimBox = null;
	try {
		var body = winCon.document.getElementsByTagName("html")[0];

		// create a box to hold the dimensions of the box
		box = winCon.document.getElementById( screengrab.selection.BOX_DIV);
		if (box && (box != null)) {
			dimBox = new screengrab.Box(box.offsetLeft, box.offsetTop, box.clientWidth, box.clientHeight)
			// remove the box div
			body.removeChild(box);
		}
		var newDiv = winCon.document.getElementById(screengrab.selection.DRAW_DIV);
		if (newDiv) {
			body.removeChild(newDiv);
		}
	    	
		// restore the styling to the screengrab bar
		var screengrabBar = window.document.getElementById("screengrab_bar");
		if (screengrabBar != null) {
			screengrabBar.style.background = screengrab.selection.IDLE_IMAGE;
			screengrabBar.tooltiptext = screengrab.selection.oldText;
		}

		window.content.drawing = false;
	    } catch (error) {
		screengrab.error(error);
	}
	return { 'box' : box, 'dimBox' : dimBox};
}
//------------------------------------------------------------------------------
screengrab.selection.screengrab_bar_fx_hide = function() {
	var winCon = window.content;
	var screengrab_bar_fx = winCon.document.getElementById('screengrab_bar_fx');
	if (screengrab_bar_fx) {
		screengrab_bar_fx.parentNode.removeChild(screengrab_bar_fx);
	}
}
//------------------------------------------------------------------------------
screengrab.selection.fastModeTextHide = function() {
	var winCon = window.content;
	var screengrab_bar_fx_fast_mode = winCon.document.getElementById('screengrab_bar_fx_fast_mode_descr');
	if (screengrab_bar_fx_fast_mode) {
		screengrab_bar_fx_fast_mode.parentNode.removeChild(screengrab_bar_fx_fast_mode);
	}
}
//------------------------------------------------------------------------------
screengrab.selection.getDocumentHeight = function() {
	var winCon = window.content;
//	return (winCon.document.body.scrollHeight > winCon.document.body.offsetHeight) ? winCon.document.body.scrollHeight : winCon.document.body.offsetHeight;
	var height = (winCon.document.documentElement.scrollHeight > winCon.document.documentElement.offsetHeight) ? winCon.document.documentElement.scrollHeight : winCon.document.documentElement.offsetHeight;
	if (height <= 0) {
		if (winCon.document && winCon.document.body) {
			height = winCon.document.body.clientHeight;
		}
	}
	return height;
}
//------------------------------------------------------------------------------
screengrab.selection.getDocumentWidth = function() {
	var winCon = window.content;
//	return (winCon.document.body.scrollWidth > winCon.document.body.offsetWidth) ? winCon.document.body.scrollWidth : winCon.document.body.offsetWidth;
	var width = (winCon.document.documentElement.scrollWidth > winCon.document.documentElement.offsetWidth) ? winCon.document.documentElement.scrollWidth : winCon.document.documentElement.offsetWidth;
	if (width <= 0) {
		if (winCon.document && winCon.document.body) {
			width = winCon.document.body.clientWidth;
		}
	}
	return width;
}
