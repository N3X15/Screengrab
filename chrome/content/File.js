
screengrab.File = function(file, mimeType) {
	this.nsFile = file;
	this.mimeType = mimeType;
}
screengrab.File.FileInputStream = Components.Constructor("@mozilla.org/network/file-input-stream;1", "nsIFileInputStream", "init");
screengrab.File.BinaryInputStream = Components.Constructor("@mozilla.org/binaryinputstream;1", "nsIBinaryInputStream", "setInputStream");
screengrab.File.MultiplexInputStream = Components.Constructor("@mozilla.org/io/multiplex-input-stream;1", "nsIMultiplexInputStream");
screengrab.File.BufferedInputStream = Components.Constructor("@mozilla.org/network/buffered-input-stream;1", "nsIBufferedInputStream", "init");
screengrab.File.StringInputStream = Components.Constructor("@mozilla.org/io/string-input-stream;1", "nsIStringInputStream", "setData");
screengrab.File.IOService = Components.Constructor("@mozilla.org/network/io-service;1", "nsIIOService");

screengrab.File.prototype = {
	remove : function() {
		this.nsFile.remove(false);
	},
	
	getBufferedStream: function() {
		var stream = new sg.File.FileInputStream(this.nsFile, 0x01, 00004, null);
		return new sg.File.BufferedInputStream(stream, 90000);
	},
	
	readBytes: function() {
		// open the local file
		var stream = new sg.File.FileInputStream(this.nsFile, 0x01, 00004, null);
		var buffered = new sg.File.BufferedInputStream(stream, 90000);
		var binary = new sg.File.BinaryInputStream(buffered);
		var data = "";
		while (binary.available() > 0) {
			data += binary.readBytes(binary.available());
		}
		return data;
	},
	
	toFileUrl : function() {
		return new sg.File.IOService().newFileURI(this.nsFile);
		
	},
	saveDataUrlWithCallbackWhenDone : function(dataUrl, callback) {
		var nsUri = new sg.File.IOService().newURI(dataUrl, "UTF8", null);
        
		var persist = this.createPersist();
		persist.progressListener = {
			onStateChange : function(aWebProgress, aRequest, aStateFlags, aStatus) {
				if ((aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_STOP) == Components.interfaces.nsIWebProgressListener.STATE_STOP) {
					if (callback) callback();
                }
			}
		};
		this.saveURIcustom(persist, nsUri, this.nsFile);
	},
	
	saveDataUrl: function(dataUrl, quietly) {
		this.notificationBox = screengrab.Util.notificationBoxGet('notifyTypeSave');
		var nsUri = new sg.File.IOService().newURI(dataUrl, "UTF8", null);
		
		var persist = this.createPersist();
//		if (!quietly) {
//			persist.progressListener = this.createTransferProgressListener(nsUri, persist);
//		}
		this.saveURIcustom(persist, nsUri, this.nsFile);
		screengrab.Util.setNotify(this.notificationBox, 'notifyTypeSave', 'Screen saved: "' + this.nsFile.path + '"', 'Screen is saved', this.createNotifyListener());
	},

	createNotifyListener: function() {
		var listener = {
			aFile: this.nsFile,
			observe: function(subject, topic, data) {
				if (topic == 'alertclickcallback') {
					this.openDir(this.aFile);
				}
			},
			openDir: function(file) {
				try {
//					this.aFile.launch();
					file.reveal();
				} catch(e) {
					var uri = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newFileURI(file.parent);
					var protocolSvc = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"].getService(Components.interfaces.nsIExternalProtocolService);
					protocolSvc.loadUrl(uri);
				}
			}
		};
		return listener;
	},

	openDir: function(dir) {
		var listener = this.createNotifyListener();
		listener.openDir(dir);
	},

	saveURIcustom: function(persist, nsUri, nsFile) {
		var nsILoadContext = null;
		try {
			var  getMainWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser");
			nsILoadContext = getMainWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIWebNavigation).QueryInterface(Components.interfaces.nsILoadContext);
		} catch(err) {
		};

		if (this.isIntegrateDownloadManager) {
			try {
				var ioService  = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
				var uri = ioService.newURI(this.isWebSiteURL, null , null);
/*
				var dm    = Components.classes["@mozilla.org/download-manager;1"].getService(Components.interfaces.nsIDownloadManager);
				var download = dm.addDownload ( 0 , uri ,  ioService.newFileURI(nsFile) , 'Screengrab!', null , null , null , null, null );
				persist.progressListener = download;
*/
				var transfer = Components.classes['@mozilla.org/transfer;1'].createInstance(Components.interfaces.nsITransfer);
				transfer.init(uri,  ioService.newFileURI(nsFile), 'Screengrab!', null, new Date(), null, persist, null);
				persist.progressListener = transfer; // new DownloadListener(window, transfer);
			}
			catch(err) {
			}
		}
		try {
			// for Firefox 18.0 - 36.0
			persist.saveURI(nsUri, null, null, null, null, nsFile, nsILoadContext);
		}
		catch(e) {
			try {
				// for Firefox 36.0+
				persist.saveURI(nsUri, null, null, null, null, null, nsFile, nsILoadContext);
			}
			catch(e) {
				// for Firefox 4.0 - 18.0
				persist.saveURI(nsUri, null, null, null, null, nsFile);
			}
		}
	},

	createPersist: function() {
		var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].createInstance(Components.interfaces.nsIWebBrowserPersist);
		persist.persistFlags = Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
		persist.persistFlags |= Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;
		return persist;
	},
	
	createTransferProgressListener: function(nsUri, persist) {
		var target = this.toFileUrl();
		var tr = Components.classes["@mozilla.org/transfer;1"].createInstance(Components.interfaces.nsITransfer);
		tr.init(nsUri, target, "", null, null, null, persist);
		return tr;
	}
}
screengrab.File.newTempFile = function(name, mimeType) {
	var file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("TmpD", Components.interfaces.nsIFile);
	file.append(name);
	file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0666);
	return new screengrab.File(file, mimeType);
}
screengrab.File.named = function(name, mimeType) {
	var nsFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
	nsFile.initWithPath(name);
	return new screengrab.File(nsFile, mimeType);
}
screengrab.ImageFilePicker = function(defaultFileName, message, selected, defaultSaveDir) {
    this.defaultFileName = defaultFileName;
    this.message = message;
    this.selected = selected;
    this.file = null;
    this.type = null;
    this.defaultSaveDir = defaultSaveDir;
}
screengrab.ImageFilePicker.prototype = {
	show : function() {
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
		fp.init(window, this.message, Components.interfaces.nsIFilePicker.modeSave);
		fp.defaultString = this.defaultFileName;
		fp.appendFilter("PNG", "*.png; *.gnp");
		fp.appendFilter("JPG", "*.jpg; *.jpeg");
		fp.appendFilter("BMP", "*.bmp");
		fp.defaultExtension = 'png';

		if (this.defaultSaveDir) {
			var localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
			try {
				localFile.initWithPath(this.defaultSaveDir);
			} catch(e) {
				localFile = false;
			}
			if (localFile) {
				fp.displayDirectory = localFile;
			}
		}

		if (this.selected == "image/png") {
			fp.filterIndex = 0;
		} else if (this.selected == "image/bmp") {
			fp.filterIndex = 2;
		} else {
			fp.filterIndex = 1;
		}
        
		var result = fp.show();
		//-----------------------------------------------------------------------------------
		if (result == fp.returnOK || result == fp.returnReplace) {
			this.mimeOptions = "";
			var file_ext_required = '';

			//---------------------------------------------------------------------------
			if (fp.filterIndex == 1) {
				this.type = "image/jpeg";
				if (! (/\.jpg$/.test(fp.file.path))) {
					file_ext_required = '.jpg';
				}
			} else if (fp.filterIndex == 2) {
				this.type = "image/bmp";
				if (! (/\.bmp$/.test(fp.file.path))) {
					file_ext_required = '.bmp';
				}
			} else {
				this.type = "image/png";
				if (! (/\.png$/.test(fp.file.path))) {
					file_ext_required = '.png';
				}
			}
			//---------------------------------------------------------------------------
			if (file_ext_required != '') {
				var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
				try {
					file.initWithPath(fp.file.path + file_ext_required);
					if (file.exists()) {
						file.remove(false);
					}
					file.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0664);
				} catch(e) {
					file = false;
				}
				this.file = file;
			}
			//---------------------------------------------------------------------------
			else {
				this.file = fp.file;
			}
		}
	},
	getFile : function() {
		if (this.file == null) {
			this.show();
		}
		return new screengrab.File(this.file, this.type);
	},
	getFileQuickly : function() {
		var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
		try {
			file.initWithPath(this.defaultSaveDir);
			file.appendRelativePath(this.defaultFileName);
			file.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0664);
		} catch(e) {
			file = false;
		}

		if (file) {
			this.file =  file;
			this.type = this.selected;
			this.mimeOptions = "";
		} else {
			this.show();
		}

		return new screengrab.File(this.file, this.type);
	}
}