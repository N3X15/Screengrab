
screengrab.CaptureViewPort = function(browser, dimensions, onCaptured) {
	var htmlDoc = browser.getDocument();
	htmlDoc.setAllFlashOpaque();
	var canvas = browser.getFilledCanvas(dimensions);
	htmlDoc.undo();
	onCaptured(canvas);
	htmlDoc.clear();
}
