screengrab.Clipboard = {
	putImgDataUrl : function(dataUrl, callbackWhenDone) {
		var imagedata = dataUrl;
		var io = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
		var channel = io.newChannel(imagedata, null, null);
		var input = channel.open();
		var imgTools = Components.classes["@mozilla.org/image/tools;1"].getService(Components.interfaces.imgITools);

		var container  = {};
		imgTools.decodeImageData(input, channel.contentType, container);

		var wrapped = Components.classes["@mozilla.org/supports-interface-pointer;1"].createInstance(Components.interfaces.nsISupportsInterfacePointer);
		wrapped.data = container.value;

		var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
		trans.addDataFlavor(channel.contentType);
		trans.setTransferData(channel.contentType, wrapped, channel.contentLength);

		var clipid = Components.interfaces.nsIClipboard;
		var clip   = Components.classes["@mozilla.org/widget/clipboard;1"].getService(clipid);
		clip.setData(trans, null, clipid.kGlobalClipboard);
		if (callbackWhenDone) {
			callbackWhenDone();
		}
	}
}