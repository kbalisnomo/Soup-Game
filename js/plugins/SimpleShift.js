//=============================================================================
// SimpleShift.js
//=============================================================================

/*:
 * @plugindesc Allows to visually shift event graphics by note.
 * @author EvilCat
 * @email soevilcat@mail.ru
 * @version 1.1
 
 * @help
 * Couldn't find a basic script that does this in 10 minutes!
 * Place <Shift: x, y> into event's note.
 * Advantages in comparison to other such plugins:
 * - Only calculates shift on event's refresh (not every update).
 * - If you are using a plugin to update meta by page comments
 *   (such as EvilCat Utils), updates shift accordingly.
 * - Simple code, no additional functions, classes, or calculations.
 * Creative Commons 4.0 Attribution license
 */

"use strict";

(function()
{
	var _Game_Event_initMembers=Game_Event.prototype.initMembers;
	Game_Event.prototype.initMembers = function()
	{
		_Game_Event_initMembers.call(this);
		this._shiftX=0;
		this._shiftY=0;
	}
	
	var _Game_Event_refresh=Game_Event.prototype.refresh;
	Game_Event.prototype.refresh = function()
	{
		_Game_Event_refresh.call(this);
		var meta = this.meta || this.event().meta;
		var shift=meta.Shift;
		if (shift)
		{
			shift=shift.split(/\s*,\s*/);
			this._shiftX=Number(shift[0]) || 0;
			this._shiftY=Number(shift[1]) || 0;
		}
	}
	
	var _Game_Event_screenX=Game_Event.prototype.screenX;
	Game_Event.prototype.screenX = function() {
		return _Game_Event_screenX.call(this)+this._shiftX;
	};

	var _Game_Event_screenY=Game_Event.prototype.screenY;
	Game_Event.prototype.screenY = function() {
		return _Game_Event_screenY.call(this)+this._shiftY;
	};
})();