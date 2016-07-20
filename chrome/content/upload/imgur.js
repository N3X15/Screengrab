screengrab.Upload_Imgur = {};
screengrab.Upload_Imgur.sid = null;
//------------------------------------------------------------------------------
screengrab.Upload_Imgur.doUpload = function(uploadAction, binaryInputStream, binaryInputStream_length) {
	if (screengrab.Upload_Imgur.sid != null) {
		screengrab.Upload_Imgur.doUpload_1(uploadAction, binaryInputStream, binaryInputStream_length);
		return;
	}
	var req = new XMLHttpRequest();
	req.open("GET", "https://imgur.com/upload/start_session", true);
	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200) {
				var jrsp = null;
				try {
					jrsp = JSON.parse(req.responseText);
				} catch (e) {
					screengrab.errorUpload(req);
					return;
				};
				screengrab.Upload_Imgur.sid = jrsp.sid;
				screengrab.Upload_Imgur.doUpload_1(uploadAction, binaryInputStream, binaryInputStream_length);
			} else {
				screengrab.errorUpload(req);
			}
		}
	}
	req.send(null);
}
//------------------------------------------------------------------------------
screengrab.Upload_Imgur.doUpload_1 = function(uploadAction, binaryInputStream, binaryInputStream_length) {
	var req = new XMLHttpRequest();
	req.open("GET", "https://imgur.com/upload/checkcaptcha?total_uploads=1&create_album=0&album_title=Optional+Album+Title", true);

	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200) {
				var jrsp = null;
				try {
					jrsp = JSON.parse(req.responseText);
				} catch (e) {
					screengrab.errorUpload(req);
					return;
				};
				if (jrsp && jrsp.success) {
					screengrab.Upload_Imgur.doUpload_2(uploadAction, binaryInputStream, binaryInputStream_length);
				} else {
					screengrab.errorUpload(req);
				}
			} else {
				screengrab.errorUpload(req);
			}
		}
	}
	req.send(null);
}
//------------------------------------------------------------------------------
screengrab.Upload_Imgur.doUpload_2 = function(uploadAction, binaryInputStream, binaryInputStream_length) {
	var req = new XMLHttpRequest();
	//------------------------------------------------------------------
	var boundStr = '---------------------------' + new Date().getTime();
	var boundary = '--' + boundStr;
	if (screengrab.Upload_Imgur.sid == null) {
		screengrab.Upload_Imgur.sid = screengrab.Util.random_string(26);
	}

	var bodyStart = screengrab.setUploadBody(boundary, [
		{ 'param': 'current_upload', 'value': '1' },
		{ 'param': 'total_uploads', 'value': '1' },
		{ 'param': 'terms', 'value': '0' },
		{ 'param': 'gallery_type', 'value': '' },
		{ 'param': 'location', 'value': 'inside' },
		{ 'param': 'gallery_submit', 'value': '0' },
		{ 'param': 'create_album', 'value': '0' },
		{ 'param': 'album_title', 'value': 'Optional Album Title' },
		{ 'param': 'sid', 'value': screengrab.Upload_Imgur.sid }

//		{ 'param': 'layout', 'value': 'b' },
//		{ 'param': 'catify', 'value': '0' },
//		{ 'param': 'edit', 'value': '0' },
//		{ 'param': 'forceAnonymous', 'value': 'false' },
//		{ 'param': 'gallery_title', 'value': 'Gallery submission title (required)' },
	]);

	bodyStart += 'Content-Disposition: form-data; name="Filedata"; filename="' + screengrab.prefs.defaultFileName() + "." + uploadAction.formatImageExt + '"' + "\r\n";
	bodyStart += 'Content-Type: ' + uploadAction.formatMimeType + "\r\n" + "\r\n";

	var bodyStartStream = new sg.File.StringInputStream(bodyStart, bodyStart.length);
	var bodyEnd = "\r\n" + boundary + "--";
	var bodyEndStream = new sg.File.StringInputStream(bodyEnd, bodyEnd.length);

	var multiplexed = new sg.File.MultiplexInputStream();
	multiplexed.appendStream(bodyStartStream);
	multiplexed.appendStream(binaryInputStream);
	multiplexed.appendStream(bodyEndStream);

	var length = bodyStartStream.available() + binaryInputStream_length + bodyEndStream.available(); 
	req.open("POST", "https://imgur.com/upload", true);
	req.setRequestHeader("X-Requested-With","XMLHttpRequest");
	req.setRequestHeader("Referer", 'https://imgur.com/');
	req.setRequestHeader("Content-type", "multipart/form-data; boundary=" + boundStr);
	req.setRequestHeader("Content-Length", length);
	req.setRequestHeader("Connection", "close");
	req.overrideMimeType('text/xml');

	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200) {
				screengrab.Upload_Imgur.okUpload(req);
			} else {
				var jrsp = null;
				try {
					jrsp = JSON.parse(req.responseText);
				} catch (e) {
				};
				if (jrsp && (! jrsp.success) && jrsp.data && jrsp.data.error && jrsp.data.error.message) {
					alert('https://imgur.com/' + "\n" + jrsp.data.error.message);
				}
				screengrab.errorUpload(req);
			}
		}
	}
	req.upload.onprogress = function(event) {
		if (event.lengthComputable) {
			var percent = Math.round(100 * event.loaded / event.total);
			screengrab.Util.setNotify(req.notificationBox, 'notifyTypeUpload', 'Upload screen... ' + percent + '%');
		}
	}

	req.notificationBox = screengrab.Util.notificationBoxGet('notifyTypeUpload');
	screengrab.Util.setNotify(req.notificationBox, 'notifyTypeUpload', 'Upload screen...');

	req.siteTitle = uploadAction.siteTitle;
	req.siteDescription = uploadAction.siteDescription;
	req.siteURL = uploadAction.siteURL;
	req.formatImageExt = uploadAction.formatImageExt;

	req.send(multiplexed);
}
//------------------------------------------------------------------------------
screengrab.Upload_Imgur.okUpload = function(req) {
	var jrsp = null;
	try {
		jrsp = JSON.parse(req.responseText);
	} catch (e) {
		screengrab.errorUpload(req);
		return;
	};

//	{"data":{"hashes":["MfObArV","vscc7rF","quZJngf"],"hash":"quZJngf","album":false,"edit":false,"gallery":null,"gallery_type":null},"success":true,"status":200}

	if (jrsp && jrsp.success && jrsp.data.hash) {
		screengrab.Util.setNotify(req.notificationBox, 'notifyTypeUpload', 'Screen is uploaded');
		gBrowser.selectedTab = gBrowser.addTab('https://imgur.com/' + jrsp.data.hash);
		screengrab.copyUploadLink('https://imgur.com/' + jrsp.data.hash + '.' + req.formatImageExt);
		return 1;
	}
	screengrab.errorUpload(req);
}
//------------------------------------------------------------------------------
