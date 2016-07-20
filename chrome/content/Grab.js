/**
 * @author andy
 */
screengrab.Grab = function(target, capture, action) {
	try {
		target.obtainDimensions(function(browser, dimensions) {
			capture(browser, dimensions, function(canvas) {
				action.doAction(canvas);
			});
		});
	} catch (error) {
//		screengrab.error(error);
	}
}
