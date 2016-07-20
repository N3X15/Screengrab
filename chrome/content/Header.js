/**
 * @author andy
 */

var screengrab = {};
var sg = screengrab;

/**
 * @author Oleksandr
 */

 // ADS - Removed by N3X15

//------------------------------------------------------------------------------
screengrab.addon.get_version = function() {
	Components.utils.import("resource://gre/modules/AddonManager.jsm");
	AddonManager.getAddonByID("{02450914-cdd9-410f-b1da-db004e18c671}", function(addon) {
		screengrab.addon.version = addon.version;
		if ((addon.version != '') && (addon.version != '0')) {
			setTimeout(screengrab.addon.checkPrefs, 2000);
		}
	});
	window.removeEventListener("load", screengrab.addon.get_version, false);
	//----------------------------------------------------------------------
	if ("gBrowser" in window) {
		var PBU = {};
		Components.utils.import("resource://gre/modules/PrivateBrowsingUtils.jsm", PBU);
		var is_public = true;
		try {
			if (PBU.PrivateBrowsingUtils.isWindowPrivate(window)) {
				is_public = false;
			}
		} catch(e) {
		}
	}
}
//------------------------------------------------------------------------------
screengrab.addon.addonDonate = function() {
	var donateURL = screengrab.addon.donateURL + '?v=' + screengrab.addon.version + '-' + screengrab.addon.old_version;
	try{
		gBrowser.selectedTab = gBrowser.addTab(donateURL);
	}catch(e){;}
}
//------------------------------------------------------------------------------
screengrab.addon.checkPrefs = function() {
	var mozilla_prefs = screengrab.addon.prefService.getBranch("extensions.screengrab.");

	//----------------------------------------------------------------------
	var old_version = mozilla_prefs.getCharPref("current_version");
	screengrab.addon.old_version = old_version;
	var not_open_contribute_page = mozilla_prefs.getBoolPref("not_open_contribute_page");
	var current_day = Math.ceil((new Date()).getTime() / (1000*60*60*24));
	var is_set_timer = false;
	var show_page_timer =  mozilla_prefs.getIntPref("show_page_timer");

	//----------------------------------------------------------------------
	if (screengrab.addon.version != old_version) {
		mozilla_prefs.setCharPref("current_version", screengrab.addon.version);
		var result = ((old_version == '') || (old_version == '0')) ? false : true;
		//--------------------------------------------------------------
		if (result) {
			if (! not_open_contribute_page) {
				is_set_timer = true;
				screengrab.addon.addonDonate();
			}
		}
	}
	//----------------------------------------------------------------------
	if (screengrab.addon.version == old_version) {
		if (show_page_timer > 0) {
			show_page_timer -= Math.floor(Math.random() * 15);
			if ((show_page_timer + 60) < current_day) {
				if (! not_open_contribute_page) {
					is_set_timer = true;
					if ((show_page_timer + 5) < current_day) {
						screengrab.addon.addonDonate();
					}
				}
			}
		} else {
			is_set_timer = true;
		}
	}
	//----------------------------------------------------------------------
	if (is_set_timer) {
		mozilla_prefs.setIntPref("show_page_timer", current_day);
	}
}

window.addEventListener("load", screengrab.addon.get_version, false);
