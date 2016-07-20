/*
Copyright (C) 2004-2010  Andy Mutton

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

Contact: andy@5263.org
*/

Components.utils.import("resource://gre/modules/Services.jsm");

screengrab.prefs = {
	
	PNG : "png",
//	JPEG : "jpeg",
	JPEG : "jpg",
	BMP : "bmp",
	
	extensionPrefix : "extensions.screengrab.",
	convertumlaute : "convertumlaute",
	onlyascii : "onlyascii",
	imageFormat : "imageFormat",
	imageQuality : "jpgImageQuality",
	showInContextMenu : "showInContextMenu",
	defaultSaveDir : "defaultSaveDir",
	quicklySave : "quicklySave",
	disableUpload : "disableUpload",
	buttonClickIconGeneral : "buttonClickIconGeneral",
	buttonClickIconAdditional : "buttonClickIconAdditional",
	showButtonInToolbar : "showButtonInToolbar",
	insertTextInImage : "insertTextInImage",
	replaceCharInFilename : "replaceCharInFilename",
	showButtonWithoutArrow : "showButtonWithoutArrow",

	prefBranch : null,
	
	getBool: function(pref) {
		return screengrab.nsPreferences.getBoolPref(this.extensionPrefix + pref);
	},
	setBool: function(pref, value) {
		return screengrab.nsPreferences.setBoolPref(this.extensionPrefix + pref, value);
	},

	getInt: function(pref) {
		return screengrab.nsPreferences.getIntPref(this.extensionPrefix + pref);
	},
	setInt: function(pref, value) {
		return screengrab.nsPreferences.setIntPref(this.extensionPrefix + pref, value);
	},

	getString: function(pref) {
		return screengrab.nsPreferences.copyUnicharPref(this.extensionPrefix + pref);
	},
	setString: function(pref, value) {
		return screengrab.nsPreferences.setUnicharPref(this.extensionPrefix + pref, value);
	},

	getDefaultSaveDir: function() {
		var path = screengrab.nsPreferences.copyUnicharPref(this.extensionPrefix + this.defaultSaveDir);
		return path;
	},

	getReplaceCharInFilename: function() {
		var char = screengrab.nsPreferences.copyUnicharPref(this.extensionPrefix + this.replaceCharInFilename);
		if ((char != "_") && (char != "-") && (char != ".") && (char != " ")) {
			char = "_";
		}
		return char;
	},

	getQuicklySave: function() {
		return screengrab.nsPreferences.getBoolPref(this.extensionPrefix + this.quicklySave);
	},

	getInsertTextImage: function() {
		return screengrab.nsPreferences.getBoolPref(this.extensionPrefix + this.insertTextInImage, false);
	},

	format : function() {
		var formatMimeType = screengrab.nsPreferences.getIntPref(this.extensionPrefix + this.imageFormat);
		if (formatMimeType == 0) {
			return this.PNG;
		} else if (formatMimeType == 2) {
			return this.BMP;
		} else {
			return this.JPEG;
		}
	},
	
	formatMimeType : function() {
		var formatMimeType = screengrab.nsPreferences.getIntPref(this.extensionPrefix + this.imageFormat);
		if (formatMimeType == 0) {
			return "image/png";
		} else if (formatMimeType == 2) {
			return "image/bmp";
		} else {
			return "image/jpeg";
		}
	},
	
	formatQuality : function(mimeType) {
		if (mimeType == "image/jpeg") {
			return screengrab.nsPreferences.getIntPref(this.extensionPrefix + this.imageQuality) / 100;
		}
		return "";
	},

	getWindowTitle : function() {
		return window.content.document.title;
	},

	getWindowURL : function() {
		return window.content.window.location;
	},

	getWindowDomain : function(without_www) {
		var domain = window.content.window.location.host || '';
		if (without_www) {
			domain = domain.replace(/^www\./i, '');
		}
		return domain;
	},

	getWindowDescription : function() {
		var metas = gBrowser.contentDocument.getElementsByTagName('META');
		var descr = metas.namedItem("description") || metas.namedItem("Description") || metas.namedItem("DESCRIPTION");
		if (descr) {
			return descr.content;
		}
		return '';
	},
	//-------------------------------------------------------------------------------------------------
	defaultFileName : function() {
		return this.sanitiseName(this.createTemplateName('templateFileName').replace(/https?\:\/\//g, ''));
	},
	//-------------------------------------------------------------------------------------------------
	createTemplateName : function(pref_name) {
		var result_name = this.getString(pref_name) || '{#SG#}';
		//-------------------------------------------------------------------------------------------
		function crop_title(str, p1) {
			var title = screengrab.prefs.getWindowTitle();
			if (title.length > p1) {
				return title.substr(0, p1) + '...';
			}
			return title;
		}

		//-------------------------------------------------------------------------------------------
		result_name = result_name.replace(/\{\#SG\#\}/ig, 'Screengrab');
		result_name = result_name.replace(/\{\#TITLE\#\}/ig, this.getWindowTitle());
		result_name = result_name.replace(/\{\#TITLE(\d+)\#\}/ig, crop_title);
		result_name = result_name.replace(/\{\#URL\#\}/ig, this.getWindowURL());
		result_name = result_name.replace(/\{\#DOMAIN\#\}/ig, this.getWindowDomain());
		result_name = result_name.replace(/\{\#DOMAIN\!WWW\#\}/ig, this.getWindowDomain(true));

		var dt = new Date();
		result_name = result_name.replace(/\{\#YYYY\#\}/ig, dt.getFullYear());

		var template_short_yy = dt.getFullYear() + '';
		template_short_yy = template_short_yy.replace(/^\d\d/, '');
		result_name = result_name.replace(/\{\#YY\#\}/ig, template_short_yy);

		result_name = result_name.replace(/\{\#MM\#\}/ig, this.check_2_digits(dt.getMonth()+1));
		result_name = result_name.replace(/\{\#DD\#\}/ig, this.check_2_digits(dt.getDate()));

		result_name = result_name.replace(/\{\#MONTH\#\}/ig, dt.toLocaleFormat("%B"));
		result_name = result_name.replace(/\{\#WEEKDAY\#\}/ig, dt.toLocaleFormat("%A"));

		result_name = result_name.replace(/\{\#H\#\}/ig, this.check_2_digits(dt.getHours()));
		result_name = result_name.replace(/\{\#M\#\}/ig, this.check_2_digits(dt.getMinutes()));
		result_name = result_name.replace(/\{\#S\#\}/ig, this.check_2_digits(dt.getSeconds()));
		result_name = result_name.replace(/\{\#UT\#\}/ig, dt.getTime());

		if (screengrab.nsPreferences.getBoolPref(this.extensionPrefix + this.convertumlaute)) {
			// convert german umlaute
			var RegEx_ae = new RegExp('[ä]', 'g');
			var RegEx_oe = new RegExp('[ö]', 'g');
			var RegEx_ue = new RegExp('[ü]', 'g');
			var RegEx_Ae = new RegExp('[Ä]', 'g');
			var RegEx_Ue = new RegExp('[Ü]', 'g');
			var RegEx_Oe = new RegExp('[Ö]', 'g');
			var RegEx_ss = new RegExp('[ß]', 'g');
			result_name = result_name.replace(RegEx_ae, "ae");
			result_name = result_name.replace(RegEx_oe, "oe");
			result_name = result_name.replace(RegEx_ue, "ue");
			result_name = result_name.replace(RegEx_Ae, "Ae");
			result_name = result_name.replace(RegEx_Ue, "Ue");
			result_name = result_name.replace(RegEx_Oe, "Oe");
			result_name = result_name.replace(RegEx_ss, "ss");
		}

		if (pref_name != 'templateImageName') {
			var replaceChar = this.getReplaceCharInFilename();
			if (screengrab.nsPreferences.getBoolPref(this.extensionPrefix + this.onlyascii)) {
				// only ascii: (a-zA-Z0-9_ -)
				result_name = result_name.replace(/[^a-zA-Z0-9_ -]/g, replaceChar);
			}
			// replace more than one _, (___ -> _)
			result_name = result_name.replace(new RegExp("\\s*\\" + replaceChar + "+\\s*",'g'), replaceChar);
		}

		return result_name;
	},
	//-------------------------------------------------------------------------------------------------
	sanitiseName : function(name) {
//		var fileNameRegEx = new RegExp('[,\/\\\:\*\?\"\<\>\|]', 'g');
//		return name.replace(fileNameRegEx, replaceChar);
		var replaceChar = this.getReplaceCharInFilename();
		return name.replace(/[\/\\\:\*\?\'\"\<\>\|\s]/g, replaceChar).replace(new RegExp("\\" + replaceChar + "+",'g'), replaceChar);
	},

	refreshContextMenu : function() {
		if (screengrab.nsPreferences.getBoolPref(this.extensionPrefix + this.showInContextMenu, true)) {
			this.show("screengrab-context-menu");
			this.show("screengrab-context-separator");
		} else {
			this.hide("screengrab-context-menu");
			this.hide("screengrab-context-separator");
		}
		var useZoom = this.getBool('useZoom');
		document.getElementById('screengrab-use-zoom').setAttribute("checked", useZoom);
	},

	refreshUploadMenu : function() {
		if (this.getBool(this.disableUpload)) {
			this.hide('screengrab-upload');
		} else {
			this.show('screengrab-upload');
		}
	},

	observe : function(aSubject, aTopic, aData) {
		switch (aData) {
		    	case this.showInContextMenu:
				this.refreshContextMenu();
	        		break;
			case this.disableUpload:
				this.refreshUploadMenu();
	        		break;
			case this.showButtonInToolbar:
				this.buttonToolBar_refresh();
	        		break;
			case 'hotkeys':
				this.refreshHotkeys();
	        		break;
			case this.showButtonWithoutArrow:
				this.buttonWithoutArrow();
	        		break;
		}
	},

	register: function() {
		var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		this.prefBranch = prefService.getBranch(this.extensionPrefix);
		if (!("addObserver" in this.prefBranch)) {
			this.prefBranch.QueryInterface(Components.interfaces.nsIPrefBranch2);
		}
		this.prefBranch.addObserver("", this, false);
	},

	unregister: function() {
	    if (!this.prefBranch) return;
	    this.prefBranch.removeObserver("", this);
	},
	
	hide : function(elementId) {
		try {
			document.getElementById(elementId).style.display = "none";
		} catch (error) {
//			sg.error(error + ":" + elementId);
		}
	},
	
	show : function(elementId) {
		try {
			document.getElementById(elementId).style.display = "";
		} catch (error) {
//			sg.error(error + ":" + elementId);
		}
	},

	buttonToolBar_check : function() {
		var bar_id = '';
		var button_state = 'disabled';

		try {
			bar_id = document.getElementById("screengrab-toolbar-button").parentNode.id;
		} catch (e) {};

		if (bar_id.substring(0,7) == 'nav-bar') {
			button_state = 'toolbar';
		} else if (bar_id == 'addon-bar') {
			button_state = 'addonbar';
		}

		return button_state;
	},

	buttonToolBar_refresh : function() {
		var button_state = this.buttonToolBar_check();
		var pref_state = this.getString(this.showButtonInToolbar);

		if (button_state == pref_state) {
			return true;
		}

		if (button_state != 'disabled') {
			this.buttonToolBar_hide();
		}

		if (pref_state != 'disabled') {
			this.buttonToolBar_show(pref_state);
		}
	},

	buttonToolBar_hide : function() {
		var bar = document.getElementById("screengrab-toolbar-button").parentNode;
		if (bar) {
			if (bar.id.substring(0,7) == 'nav-bar') {
				bar = document.getElementById("nav-bar");
			}
			var curSet  = bar.currentSet.split(",");
			var index = curSet.indexOf("screengrab-toolbar-button");
			if (index >= 0) {
				curSet.splice(index, 1);
			}
			bar.setAttribute("currentset", curSet.join(","));
			bar.currentSet = curSet.join(",");
			document.persist(bar.id, "currentset");
			try {
				BrowserToolboxCustomizeDone(true);
			}
			catch (e) {};
		}
	},

	buttonToolBar_show : function(bar_name) {
		var bar = document.getElementById((bar_name == "addonbar") ? "addon-bar" : "nav-bar");
		if (bar) {
			var curSet  = bar.currentSet.split(",");
			var index = curSet.indexOf("screengrab-toolbar-button");
			if (index == -1) {
				curSet.push("screengrab-toolbar-button");
			}
			bar.setAttribute("currentset", curSet.join(","));
			bar.currentSet = curSet.join(",");
			document.persist(bar.id, "currentset");
			try {
				BrowserToolboxCustomizeDone(true);
			}
			catch (e) {};
		}
	},

	buttonToolBar_custom : function() {
		screengrab.prefs.setString(screengrab.prefs.showButtonInToolbar, screengrab.prefs.buttonToolBar_check());
	},

	buttonWithoutArrow : function() {
		var button = document.getElementById("screengrab-toolbar-button");
		if (button) {
			if (this.getBool(this.showButtonWithoutArrow)) {
				button.removeAttribute('type');
			} else {
				button.setAttribute('type', 'menu-button');
			}
		}
	},

	configuratePrefs : function() {
		screengrab.prefs.register();
		screengrab.prefs.refreshUploadMenu();
		screengrab.prefs.buttonToolBar_refresh();
		screengrab.prefs.buttonWithoutArrow();
		screengrab.prefs.refreshHotkeys();

		setTimeout(function() {
			screengrab.prefs.refreshContextMenu();
		}, 100);
		window.removeEventListener("load", screengrab.prefs.configuratePrefs, false);
	},

	refreshHotkeys : function() {
		screengrab.hotkey.remove_all();
		var hotkeys_list = screengrab.prefs.getString('hotkeys');
		try {
			hotkeys_list = JSON.parse(hotkeys_list);
		} catch (e) {
			hotkeys_list = [];
		}
	
		var count = 0;
//		var exists_key = {};
		for (var i in hotkeys_list) {
			var hotkey = hotkeys_list[i];
//			if (exists_key[hotkey.action]) { continue; }
//			exists_key[hotkey.action] = true;

			count++;
			if (count > 5) { break; }

			var key_id = hotkey.action + '-' + count + '-key';
			screengrab.hotkey.apply(hotkey, key_id);
		}
	},

	openOptions: function() {
		this.buttonToolBar_custom();
		if (Services.appinfo.OS == "Darwin") {
			window.open("chrome://screengrab/content/preferences.xul", "screengrab-options-dialog", "centerscreen,chrome,modal,resizable=no,alwaysRaised");
		} else {
			window.openDialog("chrome://screengrab/content/preferences.xul", "screengrab-options-dialog", "centerscreen,chrome,modal,resizable=no,alwaysRaised");
		}
	},

	check_2_digits : function(number) {
		return  ((number < 10)  ? "0" : "")  + number;
	}
};

window.addEventListener("load", screengrab.prefs.configuratePrefs, false);
window.addEventListener("aftercustomization", screengrab.prefs.buttonToolBar_custom, false);