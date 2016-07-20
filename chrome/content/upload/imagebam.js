screengrab.Upload_Imagebam = {};
//------------------------------------------------------------------------------
screengrab.Upload_Imagebam.doUpload = function(uploadAction, binaryInputStream, binaryInputStream_length) {
	var req = new XMLHttpRequest();
	//------------------------------------------------------------------
	var boundStr = '---------------------------' + new Date().getTime();
	var boundary = '--' + boundStr;

	var bodyStart = screengrab.setUploadBody(boundary, [
		{ 'param': 'content_type', 'value': '0' },
		{ 'param': 'thumb_size', 'value': '350' },
		{ 'param': 'thumb_aspect_ratio', 'value': 'resize' },
		{ 'param': 'thumb_file_type', 'value': 'jpg' },
	]);

	bodyStart += 'Content-Disposition: form-data; name="file[]"; filename="' + screengrab.prefs.defaultFileName() + "." + uploadAction.formatImageExt + '"' + "\r\n";
	bodyStart += 'Content-Type: ' + uploadAction.formatMimeType + "\r\n" + "\r\n";

	var bodyStartStream = new sg.File.StringInputStream(bodyStart, bodyStart.length);
	var bodyEnd = "\r\n" + boundary + "--\r\n";
	var bodyEndStream = new sg.File.StringInputStream(bodyEnd, bodyEnd.length);

	var multiplexed = new sg.File.MultiplexInputStream();
	multiplexed.appendStream(bodyStartStream);
	multiplexed.appendStream(binaryInputStream);
	multiplexed.appendStream(bodyEndStream);

	var postData = Components.classes["@mozilla.org/network/mime-input-stream;1"].createInstance(Components.interfaces.nsIMIMEInputStream);
        postData.addHeader('Content-Type', "multipart/form-data; boundary=" + boundStr);
	postData.addContentLength = true;
	postData.setData(multiplexed);

	gBrowser.selectedTab = gBrowser.addTab('http://www.imagebam.com/sys/upload/save', { 'postData': postData });
/*
	gBrowser.selectedTab = gBrowser.addTab(null);

	var nsIWebNavigation = Components.interfaces.nsIWebNavigation;
	var flags = nsIWebNavigation.LOAD_FLAGS_NONE;
	nsIWebNavigation.loadURI('http://www.imagebam.com/sys/upload/save', flags, 'http://www.imagebam.com/', postData);
//	gBrowser.loadURI('http://www.imagebam.com/sys/upload/save', flags, 'http://www.imagebam.com/', null, postData);
//	loadURI('http://www.imagebam.com/sys/upload/save', 'http://www.imagebam.com/', postData, true);
*/
	return true;
}
//------------------------------------------------------------------------------
