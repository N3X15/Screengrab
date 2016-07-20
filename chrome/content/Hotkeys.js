screengrab.hotkey = {};
Components.utils.import("resource://gre/modules/Services.jsm");

//------------------------------------------------------------------------------
screengrab.hotkey.input = function(event, el, key_id_current) {
	event.preventDefault();
	event.stopPropagation();
	event.stopImmediatePropagation();

	var key = { modifiers: [], key: "", keycode: "", disabled: false };
	var modifiers_list = [ 'ctrl','meta','alt','shift' ];
	for (var i in modifiers_list) {
		var k = modifiers_list[i];
		if (event[k + 'Key']) {
			if (k == 'ctrl') {
				k = 'control';
			}
			key.modifiers.push(k);
		}
	}
	if (key.modifiers.length == 0) {
		el.select();
		return 'SKIP';
	}
	if (key.modifiers.length == 1) {
		if (key.modifiers[0] == 'shift') {
			el.select();
			return 'SKIP';
		}
	}

	if (event.charCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_SPACE) {
		key.keycode = "VK_SPACE";
	} else if (event.keyCode == 8) {
		key.keycode = "VK_BACK";
	} else if (event.charCode) {
		key.key = String.fromCharCode(event.charCode).toUpperCase();
	} else {
		for (let [keycode, val] in Iterator(Components.interfaces.nsIDOMKeyEvent)) {
			if (val == event.keyCode) {
				key.keycode = keycode.replace("DOM_","");
				break;
			}
		}
	}
	if ((key.key == '') && (key.keycode == '')) {
		el.select();
		return 'SKIP';
	}
	el.value = screengrab.hotkey.key2string(key);
	var res_check = screengrab.hotkey.check_hotkey(key, key_id_current);
	el.select();
	el.prefs_hash = key;
	return res_check;
}
//------------------------------------------------------------------------------
screengrab.hotkey.key2string = function(key) {
	var result = [];
	var platformKeys_string = Services.strings.createBundle("chrome://global-platform/locale/platformKeys.properties");

	for (var i in key.modifiers) {
		var k = key.modifiers[i];
		if (k == 'accel') {
			k = screengrab.hotkey.get_accel_key();
		}
		result.push(platformKeys_string.GetStringFromName("VK_" + k.toUpperCase()));
	}

	if (key.key == " ") {
		key.key = "";
		key.keycode = "VK_SPACE";
	}
	if (key.key) {
		result.push(key.key.toUpperCase());
	}
	else if (key.keycode) {
		try {
			var keys_string = Services.strings.createBundle("chrome://global/locale/keys.properties");
			result.push(keys_string.GetStringFromName(key.keycode));
		} catch (e) {
			result.push('<' + key.keycode + '>');
		}
	}
	var separator = platformKeys_string.GetStringFromName("MODIFIER_SEPARATOR");
	return result.join(' ' + separator + ' ');
}
//------------------------------------------------------------------------------
screengrab.hotkey.get_accel_key = function() {
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).QueryInterface(Components.interfaces.nsIPrefBranch);
	switch (prefs.getIntPref("ui.key.accelKey")) {
		case 17:  return "control"; break;
		case 18:  return "alt"; break;
		case 224: return "meta"; break;
    	}
	return "control";
}
//------------------------------------------------------------------------------
screengrab.hotkey.check_hotkey = function(key, skip_id) {
	var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
	var win = wm.getMostRecentWindow("navigator:browser");

	var keys = win.document.getElementsByTagName("key");
	var accel_key = screengrab.hotkey.get_accel_key();
	var result = '';

	//-----------------------------------------------------------------------------------
	for (var i=0; i<keys.length; i++) {
		var k = keys[i];
		var key_id = k.id || k.getAttribute('id') || 'unknown';
		if (key_id == skip_id) {
			continue;
		}

		//---------------------------------------------------------------------------
		try {
			var key_ary = k.getAttribute("modifiers").split(/\W+/);
			var key_length = key.modifiers.length;
			for (var k1 in key_ary) {
				var km = key_ary[k1];
				for (var k2 in key.modifiers) {
					var km2 = key.modifiers[k2];
					if (km == 'accel') {
						km = accel_key;
					}
					if (km.toUpperCase() == km2.toUpperCase()) {
						key_length--;
					}
				}
			}
			if ((key_length == 0) && (key.modifiers.length == key_ary.length)) {
				var key_value = k.key || k.getAttribute('key') || '';
				var keycode_value = k.keycode || k.getAttribute('keycode') || '';
				if ((key_value.toUpperCase() == key.key.toUpperCase()) && (keycode_value.toUpperCase() == key.keycode.toUpperCase())) {
					result = key_id;
				}
			}
		}
		catch (e) {
		}
	}

	return result;
}
//------------------------------------------------------------------------------
screengrab.hotkey.apply = function(key, key_id) {
	try {
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var e = wm.getEnumerator(null);
		var win;

		var modifiers = key.modifiers.join(' ').replace(screengrab.hotkey.get_accel_key(),"accel");

		while (e.hasMoreElements()) {
			win = e.getNext();
			var key_node = win.document.getElementById( key_id );
			var keyset_node = null;

			if ((! key_node) && (key.action)) {
				var screengrab_keyset = win.document.getElementById('screengrab_keyset');
				var menu_item = win.document.getElementById(key.action);
				if (screengrab_keyset && menu_item) {
					key_node = win.document.createElement('key');
					screengrab_keyset.appendChild(key_node);
					key_node.id = key_id;
					menu_item.setAttribute("key", key_id);
					key_node.oncommand = menu_item.oncommand;
					key_node.setAttribute('oncommand', menu_item.getAttribute('oncommand'));
				}
			}
			if (key_node) {
				key_node.removeAttribute("keycode");
				key_node.removeAttribute("charcode");
				key_node.removeAttribute("keytext");
				key_node.removeAttribute("key");
				key_node.removeAttribute("modifiers");

				if (key.disabled) {
					key_node.setAttribute("modifiers", '');
					key_node.setAttribute("key", '');
					key_node.setAttribute("keycode", '');
				} else {
					key_node.setAttribute("modifiers", modifiers);
					if (key.key !== undefined) {
						key_node.setAttribute("key", key.key);
					}
					if (key.keycode !== undefined) {
						key_node.setAttribute("keycode", key.keycode);
					}
				}

				var keyset_node = key_node.parentNode;
				while (keyset_node.parentNode && keyset_node.parentNode.localName == "keyset") {
					keyset_node = keyset_node.parentNode;
				}
				keyset_node.parentNode.insertBefore(keyset_node, keyset_node.nextSibling);

				var menuitems = win.document.getElementsByAttribute("key", key_id);
				for (var m in menuitems) {
					menuitems[m].setAttribute("acceltext","");
					menuitems[m].removeAttribute("acceltext");
				}
			}
		}
	}
	catch (e) {
	}
}
//-------------------------------------------------------------------------------------------
screengrab.hotkey.remove_all = function() {
	try {
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var e = wm.getEnumerator(null);
		var win;

		while (e.hasMoreElements()) {
			win = e.getNext();
			var screengrab_keyset = win.document.getElementById('screengrab_keyset');
			if (screengrab_keyset) {
				var keys = screengrab_keyset.getElementsByTagName("key");
				for (var i in keys) {
					var k = keys[i];

					var key_id = k.id;
					try {
						key_id = k.getAttribute('id');
					} catch(e) {};
					key_id = (key_id) ? key_id : 'unknown';

					var menuitems = win.document.getElementsByAttribute("key", key_id);
					for (var m in menuitems) {
						try {
							menuitems[m].setAttribute("acceltext","");
							menuitems[m].removeAttribute("acceltext");
						} catch(e) {};
					}
				}
				while (screengrab_keyset.firstChild) {
					screengrab_keyset.removeChild(screengrab_keyset.firstChild);
				}
				screengrab_keyset.parentNode.insertBefore(screengrab_keyset, screengrab_keyset.nextSibling);
			}
		}
	} catch(e) {
	}
}
//-------------------------------------------------------------------------------------------
