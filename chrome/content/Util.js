screengrab.Util = {
	consoleLog : function(msg) {
		var acs = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		acs.logStringMessage(msg);
	},
	clonePopup : function(event, popupSourceId, expectedParentId) {
		var popup = event.target;
		if (popup.parentNode.id != expectedParentId) return;
		this.clearPopup(event, expectedParentId);
		var primary = document.getElementById(popupSourceId);
		for (var i = 0; i < primary.childNodes.length; i++) {
			var node = popup.appendChild(primary.childNodes[i].cloneNode(true));
			if (node.id == 'screengrab-use-zoom') {
				node.hidden = (this.get_zoom() == 1) ? true : false;
			}
		}
	},
	//------------------------------------------------------------------------
	get_string : function(name, params) {
		var result = '';
		if (! params) { params = [] }

		try {
			if (! screengrab.Util.stringbundle) {
				screengrab.Util.stringbundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService).createBundle("chrome://screengrab/locale/screengrab.properties");
			}
			result = screengrab.Util.stringbundle.formatStringFromName(name, params, params.length);
			result = result.replace(/\\n/g, "\n");
		} catch(e) {
			result = name + e;
		}
		return result;
	},
	//------------------------------------------------------------------------
	clearPopup : function(event, expectedParentId) {
		var popup = event.target;
		if (popup.parentNode.id != expectedParentId) return;
		while (popup.hasChildNodes()) {
			popup.removeChild(popup.firstChild);
		}
	},
	hidingPopup : function(event, expectedParentId) {
		var popup = event.target;
		if (popup.parentNode.id != expectedParentId) return;
//		popup.style.display = "none";
		this.clearPopup(event, expectedParentId);
	},
	setNotify : function(notificationBox, notifyType, message1, message2, clickNotify) {
		notifyType = screengrab.nsPreferences.getIntPref('extensions.screengrab.' + notifyType);
		if (notifyType == '1') {
			this.notificationBoxSet(notificationBox, message1, clickNotify);
		}
		else if (notifyType == '2') {
			this.notificationPopupSet(message2 || message1, clickNotify);
		}
		else if (notifyType == '3') {
			this.notificationStatusBarSet(notificationBox, message1);
		}
		return true;
	},
	notificationBoxGet : function(notifyType) {
		var  getMainWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser");
		var notificationBox = getMainWindow.gBrowser;
		notifyType = screengrab.nsPreferences.getIntPref('extensions.screengrab.' + notifyType);
		if (notifyType == '1') {
			notificationBox = getMainWindow.gBrowser.getNotificationBox();
		}
		else if (notifyType == '3') {
			notificationBox = getMainWindow.gBrowser.contentWindow;
		}
		return notificationBox;
	},
	notificationBoxSet : function(notificationBox, message, clickNotify) {
		notificationBox.removeAllNotifications(true);
		var buttons = null;
		if (clickNotify) {
			buttons = [{
				label: 'Open Dir',
				accessKey: null,
				popup: null,
				callback: function(notification, buttonInfo) {
					clickNotify.openDir(clickNotify.aFile);
					return true;
				}
			}];
		}
		notificationBox.appendNotification('Screengrab! ' + message, "screengrab-notification", "chrome://screengrab/skin/screengrab_24_icon.png", notificationBox.PRIORITY_INFO_HIGH, buttons);
		return true;
	},
	notificationPopupSet : function(message, clickNotify) {
		setTimeout(function() {
			var alertsService =Components.classes["@mozilla.org/alerts-service;1"].getService(Components.interfaces.nsIAlertsService);
			if (clickNotify) {
				alertsService.showAlertNotification("chrome://screengrab/skin/screengrab_24_icon.png", 'Screengrab!', message, true, "", clickNotify, "Screengrab notification");
			} else {
				alertsService.showAlertNotification("chrome://screengrab/skin/screengrab_24_icon.png", 'Screengrab!', message, false, "", null, "Screengrab notification");
			}
		}, 500);
		return true;
	},
	notificationStatusBarSet : function(notificationBox, message) {
		notificationBox.status = 'Screengrab! ' + message;
		if (notificationBox.timeout) {
			clearTimeout(notificationBox.timeout);
		}
		notificationBox.timeout = setTimeout(this.notificationStatusBarRemove, 5000, notificationBox);
		return true;
	},
	notificationStatusBarRemove : function(notificationBox) {
		if (notificationBox) {
			notificationBox.status = '';
		}
		return true;
	},
	urlencode : function(str) {
		str = (str + '').toString();
		return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
	},
	get_zoom : function() {
		try {
			var docViewer = gBrowser.selectedBrowser.markupDocumentViewer;
			return docViewer.fullZoom;
		} catch(e) {
			try {
				var docViewer = gBrowser.selectedBrowser;
				var zoom = docViewer.fullZoom;
				if (parseFloat(zoom) == zoom) { 
					return zoom;
				}
				return 1;
			} catch(e) {
				return 1;
			}
		}
	},
	check_zoom : function() {
		if (screengrab.nsPreferences.getBoolPref('extensions.screengrab.useZoom')) {
			return this.get_zoom();
		} else {
			return 1;
		}
	},
	random_string : function(size) {
		var a = 'qwertyuiopasdfghjklzxcvbnm0123456789';
		var result = '';
		for (var i=0; i<size; i++) {
			result += a.substr(Math.floor(Math.random() * a.length), 1);
		}
		return result;
	},
	check_addon_bar : function() {
		var result = false;
		var addon_bar = document.getElementById("addon-bar");
		if (addon_bar) {
			result = addon_bar.getAttribute('toolbar-delegate') ? false : true;
		}
		return result;
	},
	//------------------------------------------------------------------------------
	get_element : function(parent, search_id) {
		if (parent == null) { return null; };
		var parent_list = parent.childNodes;
		for (var i=0; i<parent_list.length; i++) {
			var el = parent_list[i];
			if (parent_list[i].id == search_id) {
				return parent_list[i];
			}
			if (parent_list[i].hasChildNodes()) {
				var res = this.get_element(parent_list[i], search_id);
				if (res != null) {
					return res;
				}
			}
		}
		return null;
	},
	//------------------------------------------------------------------------------
	alert : function(text) {
		var title = 'Screengrab!';
		var promptSer = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
		promptSer.alert(null, title, text);
	},
	//------------------------------------------------------------------------------
	confirm : function(text) {
		var title = 'Screengrab!';
		var promptSer = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
		return promptSer.confirm(null, title, text);
	}
}
