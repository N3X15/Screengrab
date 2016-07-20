screengrab.Upload_Lutim = {};
//------------------------------------------------------------------------------
screengrab.Upload_Lutim.doUpload = function(uploadAction, binaryInputStream, binaryInputStream_length) {
	var boundStr = '---------------------------' + new Date().getTime();
	var boundary = '--' + boundStr;

	var bodyStart = screengrab.setUploadBody(boundary, [
//		{ 'param': 'format', 'value': 'json' },
		{ 'param': 'first-view', 'value': '0' },
		{ 'param': 'delete-day', 'value': '0' },
		{ 'param': 'crypt', 'value': '0' },
		{ 'param': 'keep-exif', 'value': '0' }
	]);

	bodyStart += 'Content-Disposition: form-data; name="file"; filename="' + screengrab.prefs.defaultFileName() + "." + uploadAction.formatImageExt + '"' + "\r\n";
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

	gBrowser.selectedTab = gBrowser.addTab('https://lut.im/', { 'postData': postData });

	return true;
}
//------------------------------------------------------------------------------
