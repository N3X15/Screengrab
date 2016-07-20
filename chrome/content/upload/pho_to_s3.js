screengrab.Upload_PhoToS3 = {};

//------------------------------------------------------------------------------
screengrab.Upload_PhoToS3.doUpload = function(uploadAction, binaryInputStream, binaryInputStream_length, only_pho_to) {
	var prefs_global = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	var is_e10s = false;
	try {
		is_e10s = prefs_global.getBoolPref('browser.tabs.remote.autostart');
	} catch(e) {
	}
	if (is_e10s) {
		only_pho_to = true;
	}
	//------------------------------------------------------------------------

	var req = new XMLHttpRequest();
//	req.open("POST", 'http://share.pho.to/photosets', false);
	req.open("POST", 'http://api.share.pho.to/v1/photosets', false);
	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        req.setRequestHeader("Referer", 'http://share.pho.to/');
	req.send('app_key=1effede988baac0fe3171eb69a41a25b');
	var jrsp = null;
	try {
		jrsp = JSON.parse(req.responseText);
	} catch (e) {
		screengrab.errorUpload(req);
		return;
	};
	var admin_token_param = '';
	var image_id_param = '';
	if (jrsp && jrsp.admin_token && jrsp.id) {
		admin_token_param = jrsp.admin_token;
		image_id_param = jrsp.id;
	} else {
		screengrab.errorUpload(req);
		return;
	}

	//------------------------------------------------------------------
	var boundStr = '---------------------------' + new Date().getTime();
	var boundary = '--' + boundStr;
//	var req = new XMLHttpRequest();
	var bodyStart = screengrab.setUploadBody(boundary, [
		{ 'param': 'admin_token', 'value': admin_token_param },
		{ 'param': 'images[src_type]', 'value': 'file' }
	]);

	bodyStart += 'Content-Disposition: form-data; name="images[src]"; filename="' + screengrab.prefs.defaultFileName() + "." + uploadAction.formatImageExt + '"' + "\r\n";
	bodyStart += 'Content-Type: ' + uploadAction.formatMimeType + "\r\n" + "\r\n";

	var bodyStartStream = new sg.File.StringInputStream(bodyStart, bodyStart.length);
	var bodyEnd = "\r\n" + boundary + "--";
	var bodyEndStream = new sg.File.StringInputStream(bodyEnd, bodyEnd.length);

	var multiplexed = new sg.File.MultiplexInputStream();
	multiplexed.appendStream(bodyStartStream);
	multiplexed.appendStream(binaryInputStream);
	multiplexed.appendStream(bodyEndStream);

	var length = bodyStartStream.available() + binaryInputStream_length + bodyEndStream.available(); 
	req.open("POST", "http://api.share.pho.to/v1/photosets/" + image_id_param, true);
	req.setRequestHeader("Content-type", "multipart/form-data; boundary=" + boundStr);
	req.setRequestHeader("Content-Length", length);
	req.setRequestHeader("Connection", "close");
	req.overrideMimeType('text/xml');

	req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200) {
				screengrab.Upload_PhoToS3.okUpload(req);
			} else {
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
	req.only_pho_to = only_pho_to;

	req.send(multiplexed);
}
//------------------------------------------------------------------------------
screengrab.Upload_PhoToS3.okUpload = function(req) {
	var jrsp = null;
	try {
		jrsp = JSON.parse(req.responseText);
	} catch (e) {
		screengrab.errorUpload(req);
		return;
	};

//	{"id":"1iri0","mode":0,"comments_enabled":true,"created_at":"2014-02-10 08:06:53","page_views":0,
//		"links":{
//			"self":"http:\/\/api.share.pho.to\/v1\/photosets\/1iri0",
//			"web_page":"http:\/\/pho.to\/1iri0",
//			"delete_page":"http:\/\/share.pho.to\/delete\/1iri0.799686.e87bfc3590eb814bf3f82a402d06e47483968783",
//			"admin_page":"http:\/\/share.pho.to\/1iri0\/auth?token=1iri0.799686.e87bfc3590eb814bf3f82a402d06e47483968783"
//		},
//		"admin_token":"1iri0.799686.e87bfc3590eb814bf3f82a402d06e47483968783",
//		"images":[
//			{"id":"yc","name":"1a5c2c71","comments_enabled":true,"created_at":"2014-02-10 08:06:54","page_views":0,"avg_color":"#f2f3f4","aspect_ratio":0.50199,
//			"format":"jpeg","width":126,"height":251,"size":4409,"set_id":"1iri0","order":0,
//			"links":{"self":"http:\/\/api.share.pho.to\/v1\/photosets\/1iri0\/yc","original":"http:\/\/i.share.pho.to\/1a5c2c71_o.jpeg","large":"http:\/\/i.share.pho.to\/1a5c2c71_o.jpeg","medium":"http:\/\/i.share.pho.to\/1a5c2c71_o.jpeg","small_square":"http:\/\/i.share.pho.to\/1a5c2c71_ss.jpeg","web_page":"http:\/\/pho.to\/1iri0\/yc","delete_page":"http:\/\/share.pho.to\/delete\/yc\/1iri0.655364.6fbc583d4117982cbfdd27ab432aa98a995613cf"}
//			}
//		]
//	}

//	if (jrsp && (Object.prototype.toString.call(jrsp) === "[object Array]") && jrsp[0].admin_token) {
	if (jrsp && jrsp.admin_token) {
		screengrab.Util.setNotify(req.notificationBox, 'notifyTypeUpload', 'Screen is uploaded');
		if (req.only_pho_to) {
			gBrowser.selectedTab = gBrowser.addTab(jrsp.links.admin_page);
		} else {
			var dataString = 'json=' + req.responseText + '&title=' + screengrab.Util.urlencode(req.siteTitle) + '&descr=' + screengrab.Util.urlencode(req.siteDescription) + '&url=' + screengrab.Util.urlencode(req.siteURL);
			var stringStream = Components.classes["@mozilla.org/io/string-input-stream;1"].createInstance(Components.interfaces.nsIStringInputStream);
			if ("data" in stringStream) { stringStream.data = dataString; } else { stringStream.setData(dataString, dataString.length); }
			var postData = Components.classes["@mozilla.org/network/mime-input-stream;1"].createInstance(Components.interfaces.nsIMIMEInputStream);
			postData.addHeader("Content-Type", "application/x-www-form-urlencoded");
			postData.addContentLength = true;
			postData.setData(stringStream);
			gBrowser.selectedTab = gBrowser.addTab('http://www.s3blog.org/screengrab/create.html', { 'postData': postData });
		}

		screengrab.copyUploadLink(jrsp.images[0].links.original);
		return 1;
	}
	screengrab.errorUpload(req);
}
//------------------------------------------------------------------------------
