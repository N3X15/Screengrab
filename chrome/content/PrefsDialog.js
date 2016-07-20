var screengrab = {};
screengrab.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).QueryInterface(Components.interfaces.nsIPrefBranch);

screengrab.configuratePrefs = function() {
	document.getElementById('jpgImageQuality').value = document.getElementById('prefJpgImageQuality').value;
	document.getElementById('jpgImageQuality_label').value = document.getElementById('prefJpgImageQuality').value + '%';
	document.getElementById('jpgImageQuality').addEventListener('change', function(event){
		screengrab.changeJpgImageQuality(event.target.value);
	});

	//------------------------------------------------------------------------
	for (var name in ({ 'Icon':1, 'Arrow':1, 'Middle':1, 'Right':1 })) {
		document.getElementById('buttonClick' + name + 'General').appendChild(document.getElementById('menuActionGeneral').cloneNode(true));
		document.getElementById('buttonClick' + name + 'General').value = document.getElementById('prefButtonClick' + name + 'General').value;

		document.getElementById('buttonClick' + name + 'Additional').appendChild(document.getElementById('menuActionAdditional').cloneNode(true));
		document.getElementById('buttonClick' + name + 'Additional').value = document.getElementById('prefButtonClick' + name + 'Additional').value;

		screengrab.changeActionsGeneral('buttonClick' + name + 'General', 'buttonClick' + name + 'Additional');

		screengrab.changeDisableUpload(document.getElementById('disableUpload').checked);
		screengrab.disableUpload(name, document.getElementById('disableUpload').checked);
	}
	screengrab.hotkey_create_list();
	screengrab.strings = document.getElementById("screengrab-strings");

	//------------------------------------------------------------------------
	var extra2 = document.documentElement.getButton('extra2');
	if (extra2) {
	        extra2.setAttribute('popup', 'screengrab_settings_popup');
        	extra2.setAttribute('type', 'menu');
	}

	//------------------------------------------------------------------------
	try {
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var e = wm.getEnumerator("navigator:browser");
		while (e.hasMoreElements()) {
			var win = e.getNext();
			if (win.screengrab && win.screengrab.Util) {
				document.getElementById("show_button_toolbar_addon").hidden = ! win.screengrab.Util.check_addon_bar();
			}
		}
	} catch (e){
	}
	//------------------------------------------------------------------------
	window.removeEventListener("load", screengrab.configuratePrefs, false);
}
screengrab.changeActionsGeneral = function(general, additional) {
	if (document.getElementById(general).value == 'menu')  {
		document.getElementById(additional).disabled=true;
	} else {
		document.getElementById(additional).disabled=false;
	}
}
screengrab.changeDisableUpload = function(is_disabled) {
	screengrab.disableUpload('Icon', is_disabled);
	screengrab.disableUpload('Arrow', is_disabled);
	screengrab.disableUpload('Middle', is_disabled);
	screengrab.disableUpload('Right', is_disabled);
	document.getElementById('uploadClipboardLink').disabled = is_disabled;
	document.getElementById('uploadStorageLabel').disabled = is_disabled;
	document.getElementById('uploadStorage').disabled = is_disabled;
}
screengrab.disableUpload = function(name, is_disabled) {
	var name_id = 'buttonClick' + name + 'General';
	var kids = document.getElementById(name_id).childNodes;
	for (var k in kids) {
		if (kids[k].id == 'menuActionGeneral') {
			var menu_list = kids[k].childNodes;
			for (var m in menu_list) {
				if (menu_list[m].id == 'menuActionUpload') {
					menu_list[m].style.display = '';
					if (is_disabled) {
						menu_list[m].style.display = 'none';
						if (document.getElementById(name_id).value == 'upload') {
							document.getElementById(name_id).value = 'menu';
							document.getElementById('prefButtonClick' + name + 'General').value = 'menu';
							document.getElementById('buttonClick' + name + 'Additional').disabled = true;
						}
					}
				}
			}
		}
	}
}
screengrab.changeJpgImageQuality = function(value) {
	document.getElementById('jpgImageQuality').value = value;
	document.getElementById('jpgImageQuality_label').value = value + '%';
	document.getElementById('prefJpgImageQuality').value = value;
}
screengrab.selectDir = function() {
	var localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
	fp.init(window, '', Components.interfaces.nsIFilePicker.modeGetFolder);

	try {
		localFile.initWithPath(document.getElementById('defaultSaveDir').value);
		fp.displayDirectory = localFile;
	} catch(e) {}

	var result = fp.show();
	if (result == fp.returnOK) {
		document.getElementById('defaultSaveDir').value = fp.file.path;
		document.getElementById('prefDefaultSaveDir').value = fp.file.path;
	}
}
screengrab.resetDir = function() {
	document.getElementById('defaultSaveDir').value = '';
	document.getElementById('prefDefaultSaveDir').value = '';
}
screengrab.setDefaultFileName = function() {
	if (confirm('Reset to default?')) {
		document.getElementById('templateFileName').value = '{#TITLE#} - {#YYYY#}-{#MM#}-{#DD#}_{#H#}.{#M#}.{#S#}';
		document.getElementById('prefTemplateFileName').value = document.getElementById('templateFileName').value;
	}
}
screengrab.setDefaultImageName = function() {
	if (confirm('Reset to default?')) {
		document.getElementById('templateImageName').value = '{#URL#}';
		document.getElementById('prefTemplateImageName').value = document.getElementById('templateImageName').value;
	}
}
//------------------------------------------------------------------------------
screengrab.hotkey_create_list = function() {
	var screengrab_hotkeys_list = document.getElementById('screengrab_hotkeys_list');
	var hotkeys_list = document.getElementById('prefHotkeys').value;
	try {
		hotkeys_list = JSON.parse(hotkeys_list);
	} catch (e) {
		hotkeys_list = [];
	}

	var count = 0;
//	var exists_key = {};

	for (var i in hotkeys_list) {
		var hotkey = hotkeys_list[i];
//		if (exists_key[hotkey.action]) { continue; }
//		exists_key[hotkey.action] = true;

		var action = screengrab.hotkey_id_map(hotkey.action);
		if ((action.general == 'upload') && (document.getElementById('disableUpload').checked)) {
			continue;
		}
		count++;
		if (count > 5) {
			break;
		}
		var screengrab_template = screengrab.hotkey_create_template();
		screengrab_hotkeys_list.appendChild(screengrab_template);
		screengrab.Util.get_element(screengrab_template, 'screengrab_hotkeys_list_general').value = action.general;
		screengrab.Util.get_element(screengrab_template, 'screengrab_hotkeys_list_additional').value = action.additional;
		screengrab.Util.get_element(screengrab_template, 'screengrab_hotkeys_textbox').value  = screengrab.hotkey.key2string(hotkey);
		screengrab.Util.get_element(screengrab_template, 'screengrab_hotkeys_textbox').prefs_hash  = hotkey;
	}
	screengrab.hotkey_set_pref();
}
//------------------------------------------------------------------------------
screengrab.hotkey_plus = function() {
	var screengrab_hotkeys_list = document.getElementById('screengrab_hotkeys_list');
	if (screengrab_hotkeys_list.childNodes.length >= 5) {
		return;
	}
	var screengrab_template = screengrab.hotkey_create_template();
	screengrab_hotkeys_list.appendChild(screengrab_template);
}
//------------------------------------------------------------------------------
screengrab.hotkey_minus = function(el) {
	var screengrab_template = el.parentNode.parentNode;
	screengrab_template.hidden = true;
	screengrab.hotkey_set_pref();
}
//------------------------------------------------------------------------------
screengrab.hotkey_input = function(event, el) {
	event.preventDefault();
	event.stopPropagation();
	event.stopImmediatePropagation();

	var screengrab_template = el.parentNode.parentNode;
	var key_id_current = screengrab.hotkey_id_get(screengrab.Util.get_element(screengrab_template, 'screengrab_hotkeys_list_general').value, screengrab.Util.get_element(screengrab_template, 'screengrab_hotkeys_list_additional').value);
	key_id_current += '-key';
	var old_value = el.value;
	var res_check = screengrab.hotkey.input(event, el, key_id_current);
	if (res_check == 'SKIP') {
		return;
	}

	if (res_check) {
		screengrab.Util.get_element(screengrab_template, 'screengrab_hotkeys_not_unique_text').value = '(' + res_check + ')';
		screengrab.Util.get_element(screengrab_template, 'screengrab_hotkeys_not_unique').hidden = false;
	} else {
		screengrab.Util.get_element(screengrab_template, 'screengrab_hotkeys_not_unique').hidden = true;
	}
	screengrab.hotkey_set_pref();
}
//------------------------------------------------------------------------------
screengrab.hotkey_create_template = function() {
	var screengrab_template = document.getElementById("screengrab_hotkeys_template").cloneNode(true);
	screengrab_template = screengrab.Util.get_element(screengrab_template, 'screengrab_hotkeys_vbox');
	screengrab.Util.get_element(screengrab_template, 'screengrab_hotkeys_list_general').appendChild(document.getElementById('menuActionGeneral').cloneNode(true));
	screengrab.Util.get_element(screengrab_template, 'screengrab_hotkeys_list_additional').appendChild(document.getElementById('menuActionAdditional').cloneNode(true));

	var actionMenu = screengrab.Util.get_element(screengrab_template, 'menuActionMenu');
	actionMenu.parentNode.removeChild(actionMenu);

	if (document.getElementById('disableUpload').checked) {
		var actionUpload = screengrab.Util.get_element(screengrab_template, 'menuActionUpload');
		actionUpload.parentNode.removeChild(actionUpload);
	}

	return screengrab_template;
}
//------------------------------------------------------------------------------
screengrab.hotkey_id_map = function(action) {
	var map = {
		'screengrab-pop-grabFrame' : { general: 'save', additional: 'page'},
		'screengrab-pop-grabViewPort' : { general: 'save', additional: 'visible.page'},
		'screengrab-pop-grabSelection' : { general: 'save', additional: 'selection'},

		'screengrab-pop-copyFrame' : { general: 'copy', additional: 'page'},
		'screengrab-pop-copyViewPort' : { general: 'copy', additional: 'visible.page'},
		'screengrab-pop-copySelection' : { general: 'copy', additional: 'selection'},

		'screengrab-pop-uploadFrame' : { general: 'upload', additional: 'page'},
		'screengrab-pop-uploadViewPort' : { general: 'upload', additional: 'visible.page'},
		'screengrab-pop-uploadSelection' : { general: 'upload', additional: 'selection'},
	};
	return map[action];
}
//------------------------------------------------------------------------------
screengrab.hotkey_id_get = function(general, additional) {
	var id = 'screengrab-pop-';

	if (general == 'save') {
		id += 'grab';
	} else if (general == 'copy') {
		id += 'copy';
	} else if (general == 'upload') {
		id += 'upload';
	}

	if (additional == 'page') {
		id += 'Frame';
	} else if (additional == 'visible.page') {
		id += 'ViewPort';
	} else if (additional == 'selection') {
		id += 'Selection';
	}

	return id;
}
//------------------------------------------------------------------------------
screengrab.hotkey_set_pref = function() {
	var screengrab_hotkeys_list = document.getElementById('screengrab_hotkeys_list');
	var key_list = [];
	var hotkeys_list = screengrab_hotkeys_list.childNodes;
	for (var i=0; i<hotkeys_list.length; i++) {
		var screengrab_template = hotkeys_list[i];
		if (screengrab_template.hidden) { continue; }
		var key = screengrab.Util.get_element(screengrab_template, 'screengrab_hotkeys_textbox').prefs_hash;
		if (key) {
			key.action = screengrab.hotkey_id_get(screengrab.Util.get_element(screengrab_template, 'screengrab_hotkeys_list_general').value, screengrab.Util.get_element(screengrab_template, 'screengrab_hotkeys_list_additional').value);
			key_list.push(key);
		}
	}
	document.getElementById('prefHotkeys').value = JSON.stringify(key_list);
}
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
screengrab.defaultSettings = function() {
	var confirmTxt = screengrab.strings.getString("areYouSureConfirm");
	if (! screengrab.Util.confirm(confirmTxt)) {
		return;
	}
	//-----------------------------------------------------------------------
	var pref_branch = screengrab.prefs.getBranch("extensions.screengrab.");
	var pref_list = pref_branch.getChildList('');
	for (var i in pref_list) {
		var pref_name = pref_list[i];
		pref_branch.clearUserPref(pref_name);
	}
	//-----------------------------------------------------------------------
	screengrab.Util.alert(screengrab.strings.getString('settingsRestored'));
	window.location.reload();
}
//------------------------------------------------------------------------------
screengrab.saveSettings = function(mode) {
	var result = [];
	//-----------------------------------------------------------------------
	var supportsString = Components.interfaces.nsISupportsString;
	var pref_branch = screengrab.prefs.getBranch("extensions.screengrab.");
	var pref_list = pref_branch.getChildList('');
	//-----------------------------------------------------------------------
	for (var i in pref_list) {
		var pref_name = pref_list[i];

		try {
			var pref_type = pref_branch.getPrefType(pref_name);
			if (pref_type == screengrab.prefs.PREF_STRING) {
				result.push(pref_name + '='  + pref_branch.getComplexValue(pref_name, supportsString).data);
			} else if (pref_type == screengrab.prefs.PREF_BOOL) {
				result.push(pref_name + '='  + pref_branch.getBoolPref(pref_name));
			} else if (pref_type == screengrab.prefs.PREF_INT) {
				result.push(pref_name + '='  + pref_branch.getIntPref(pref_name));
			}
		}
		catch(e) {
		}
	}
 	//-----------------------------------------------------------------------
	var result_txt = result.join("\n");

 	//-----------------------------------------------------------------------
	if (mode == "copy") {
		var gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
		gClipboardHelper.copyString(result_txt);
		screengrab.Util.alert(screengrab.strings.getString('settingsCopied'));
	}
 	//-----------------------------------------------------------------------
	else if(mode == "save") {
		var date = (new Date()).toLocaleFormat('%Y.%m.%d.%H.%M.%S');
		var filename = 'Screengrab.'+date;

		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
		var stream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);

 		fp.init(window, document.getElementById('scg-pref-window').getAttribute('title'), fp.modeSave);
		fp.defaultExtension = 'txt';
		fp.defaultString = filename;
		fp.appendFilters(fp.filterText);

		if (fp.show() != fp.returnCancel) {
			if (fp.file.exists()) {
				fp.file.remove(true);
			}
			fp.file.create(fp.file.NORMAL_FILE_TYPE, 0666);
			stream.init(fp.file, 0x02, 0x200, null);
			stream.write(result_txt, result_txt.length);
			stream.close();
			screengrab.Util.alert(screengrab.strings.getString('settingsSaved'));
		}
	}
}
//------------------------------------------------------------------------------
screengrab.loadSettings = function() {
	var result_txt = '';
 	//-----------------------------------------------------------------------
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
	var stream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
	var streamIO = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
	fp.init(window, document.getElementById('scg-pref-window').getAttribute('title'), fp.modeOpen);
	fp.defaultExtension = 'txt';
	fp.appendFilters(fp.filterText);
	if (fp.show() != fp.returnCancel) {
		stream.init(fp.file, 0x01, 0444, null);
		streamIO.init(stream);
		result_txt = streamIO.read(stream.available());
		streamIO.close();
		stream.close();
	} else {
		return;
	}
 	//-----------------------------------------------------------------------
	var pref_list = result_txt.split("\n");
 	//-----------------------------------------------------------------------
	var supportsString = Components.interfaces.nsISupportsString;
	var pref_branch = screengrab.prefs.getBranch("extensions.screengrab.");
	//-----------------------------------------------------------------------
	for (var i in pref_list) {
		var pref = pref_list[i];
		var p = pref.match(/^(.*?)\=(.*)$/);
		if (p && (p.length>1)) {
			try {
				var pref_type = pref_branch.getPrefType(p[1]);
				if (pref_type == screengrab.prefs.PREF_STRING) {
					var pref_unichar = Components.classes["@mozilla.org/supports-string;1"].createInstance(supportsString);
					pref_unichar.data = p[2];
					pref_branch.setComplexValue(p[1], supportsString, pref_unichar);
				} else if (pref_type == screengrab.prefs.PREF_BOOL) {
					pref_branch.setBoolPref(p[1], p[2] == 'true'  ? true : false);
				} else if (pref_type == screengrab.prefs.PREF_INT) {
					pref_branch.setIntPref(p[1], parseInt(p[2]));
				}
			}
			catch(e) {
			}
		}
	}
	//-----------------------------------------------------------------------
	screengrab.Util.alert(screengrab.strings.getString('settingsLoaded'));
	window.location.reload();
}
//-------------------------------------------------------------------------------------------

window.addEventListener("load", screengrab.configuratePrefs, false);
