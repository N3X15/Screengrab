
screengrab.Action = function() {}
screengrab.Action.prototype = {
	doAction: function(canvas) {}
}

screengrab.SaveAction = function() {}
screengrab.SaveAction.prototype = {
	doAction: function(canvas) {
		var formatMimeType = screengrab.prefs.formatMimeType();
		var isQuicklySave = screengrab.prefs.getQuicklySave();
		var defaultFileName = screengrab.prefs.defaultFileName() + "." + screengrab.prefs.format();

		var msg = document.getElementById("screengrab-strings").getString("SaveAsMessage");
	        var picker = new screengrab.ImageFilePicker(defaultFileName, msg, formatMimeType, screengrab.prefs.getDefaultSaveDir());

		var file = (isQuicklySave) ? picker.getFileQuickly() : picker.getFile();
		if (file.nsFile == null) {
			return 0;
		}
		file.isWebSiteURL = screengrab.prefs.getWindowURL();
		file.isIntegrateDownloadManager = screengrab.prefs.getBool('integrateIntoDownloadManager');
		screengrab.prefs.setString('defaultSaveDir', file.nsFile.parent.path);

		try {
			var dataUrl = canvas.toDataURL(file.mimeType, screengrab.prefs.formatQuality(file.mimeType));
       			file.saveDataUrl(dataUrl, true);
		} catch (error) {
//			alert(error);
		}
	}
}

screengrab.CopyAction = function() {}
screengrab.CopyAction.prototype = {
	doAction: function(canvas) {
		var formatMimeType = screengrab.prefs.formatMimeType();
		var dataUrl = canvas.toDataURL(formatMimeType, screengrab.prefs.formatQuality(formatMimeType));
		screengrab.Clipboard.putImgDataUrl(dataUrl, null);
    }
}

screengrab.UploadAction = function() {}
screengrab.UploadAction.prototype = {
	//--------------------------------------------------------------------------
	formatMimeType : screengrab.prefs.formatMimeType(),
	formatImageExt : screengrab.prefs.format(),
	siteTitle : '',
	siteDescription : '',
	siteURL : '', 
	timeout : null,

	//--------------------------------------------------------------------------
	doAction: function(canvas) {
		this.siteTitle = screengrab.prefs.getWindowTitle();
		this.siteDescription = screengrab.prefs.getWindowDescription();
		this.siteURL = gBrowser.contentDocument.location.href;
        	var dataUrl = canvas.toDataURL(this.formatMimeType, screengrab.prefs.formatQuality(this.formatMimeType));
		this.doUpload(this.dataUrlToBinInputStream(dataUrl), canvas);
	},
	//--------------------------------------------------------------------------
	dataUrlToBinInputStream: function(dataUrl) {
		var nsIoService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
		var channel = null;
		try {
			channel = nsIoService.newChannelFromURI(nsIoService.newURI(dataUrl, null, null));
		} catch(e) {
			Components.utils.import("resource://gre/modules/Services.jsm");
			var principal = Services.scriptSecurityManager.getSystemPrincipal();
			channel = nsIoService.newChannelFromURI2(
				nsIoService.newURI(dataUrl, null, null),
				null, // aLoadingNode
				principal, // aLoadingPrincipal
				null, // aTriggeringPrincipal
				Components.interfaces.nsILoadInfo.SEC_NORMAL,
				Components.interfaces.nsIContentPolicy.TYPE_OTHER
			);
		}
		var binaryInputStream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
		binaryInputStream.setInputStream(channel.open());
		return binaryInputStream;
	},
	//--------------------------------------------------------------------------
	doUpload: function(binaryInputStream, canvas) {
		var binaryInputStream_length = binaryInputStream.available();
		var upload_cancel = false;

		//------------------------------------------------------------------
		if (binaryInputStream_length > 10000000) {
			if (this.formatMimeType != 'image/jpeg') {
				if (confirm('Image PNG is large. Convert to JPEG?')) {
					this.formatMimeType = 'image/jpeg';
					this.formatImageExt = 'jpg';
					return this.doAction(canvas);
				} else {
					return false;
				}
			}
			else {
				screengrab.Util.setNotify(screengrab.Util.notificationBoxGet('notifyTypeUpload'), 'notifyTypeUpload', 'Upload is canceled. Max size of an image is 10 MB');
				return 0;
			}
		}
		//-------------------------------------------------------
		var upload_storage = screengrab.prefs.getString('uploadStorage');
		if (upload_storage == 'share.pho.to') {
			screengrab.Upload_PhoToS3.doUpload(this, binaryInputStream, binaryInputStream_length, true);
		} else if (upload_storage == 'imgur.com') {
			screengrab.Upload_Imgur.doUpload(this, binaryInputStream, binaryInputStream_length);
		} else if (upload_storage == 'imagebam.com') {
			screengrab.Upload_Imagebam.doUpload(this, binaryInputStream, binaryInputStream_length);
		} else if (upload_storage == 'lut.im') {
			screengrab.Upload_Lutim.doUpload(this, binaryInputStream, binaryInputStream_length);
		} else {
			screengrab.Upload_PhoToS3.doUpload(this, binaryInputStream, binaryInputStream_length);
		}
	}
}
//-------------------------------------------------------------------
screengrab.setUploadBody = function(boundary, form) {
	var bodyStart = boundary + "\r\n";
	for (var i in form) {
		var f = form[i];
		bodyStart += 'Content-Disposition: form-data; name="' + f.param + '"' + "\r\n" + "\r\n" + f.value + "\r\n";
		bodyStart += boundary + "\r\n";
	}
	return bodyStart;
}
//-------------------------------------------------------------------
screengrab.copyUploadLink = function(link) {
	if (screengrab.prefs.getBool('uploadLinkToClipboard')) {
		try {
			var clipboard = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
			clipboard.copyString(link);
		} catch(e) {
		}
	}
}
//-------------------------------------------------------------------
screengrab.errorUpload = function(req) {
	screengrab.Util.setNotify(req.notificationBox, 'notifyTypeUpload', 'Upload screen... ERROR');
	return false;
};
//--------------------------------------------------------------------------
screengrab.SelectAction = function(event) {
	var isButtonWithoutArrow = screengrab.prefs.getBool(screengrab.prefs.showButtonWithoutArrow);

	//-------------------------------------------------------------------
	if (event.target.id != 'screengrab-toolbar-button') {
		return true;
	}

	//-----------------------------------------------------------------------------
	document.getElementById('screengrab-toolbar-menupopup').style.display = "none";

	var name = (event.target.buttonover) ? 'Icon' : 'Arrow';
	if (isButtonWithoutArrow) {
		name = 'Icon';
	}
	if (event.button != 0) {
		name = (event.button == 1) ? 'Middle' : 'Right';
	}

	var general = screengrab.prefs.getString('buttonClick' + name + 'General');
	var additional = screengrab.prefs.getString('buttonClick' + name + 'Additional');
	var doAction = null;
	var doTarget = null;

	//-----------------------------------------------------------------------------
	if (general == 'save') {
		doAction = new screengrab.SaveAction();
	} 
	else if (general == 'copy') {
		doAction = new screengrab.CopyAction();
	}
	else if (general == 'upload') {
		doAction = new screengrab.UploadAction();
	}
	else {
		document.getElementById('screengrab-toolbar-menupopup').style.display = "";
		if (isButtonWithoutArrow) {
			document.getElementById('screengrab-toolbar-menupopup').openPopup(event.target, "after_start", 0, 0, false, false);
		} else {
			event.target.open = true;
		}
		return true;
	}

	//-----------------------------------------------------------------------------
	if (additional == 'visible.page') {
		doTarget = new screengrab.VisibleTarget();
	} 
	else if (additional == 'selection') {
		doTarget = new screengrab.SelectionTarget();
	}
	else {
		doTarget = new screengrab.FrameTarget();
	}

	//-----------------------------------------------------------------------------
	if (doAction != null) {
		screengrab.Grab(doTarget, screengrab.CaptureViewPort, doAction);
	}
};

//--------------------------------------------------------------------------
screengrab.OpenDir = function() {
	var dir_path = screengrab.prefs.getString('defaultSaveDir');
	dir_obj = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
	try {
		dir_obj.initWithPath(dir_path);
		var file = new screengrab.File(null, null);
		file.openDir(dir_obj);
	} catch(e) {
		screengrab.prefs.openOptions();
	}
};
//--------------------------------------------------------------------------
screengrab.UseZoom = function() {
	var useZoom = screengrab.prefs.getBool('useZoom');
	screengrab.prefs.setBool('useZoom', ! useZoom);
	screengrab.prefs.refreshContextMenu();
};
//--------------------------------------------------------------------------
screengrab.OpenContextMenu = function() {
	document.getElementById('screengrab-use-zoom').hidden = (screengrab.Util.get_zoom() == 1) ? true : false;
};
