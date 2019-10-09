//=============================================================================
// EvilCatUtils.js
//=============================================================================

/*
 * @plugindesc Some core functions used in EvilCat plugins.
 * @author EvilCat
 * @email soevilcat@mail.ru
 * @version 1.6
 
 * @param Read Meta from Page
 * @desc Updates meta from the current page (first comments only).
 * @default On
 
 * @help
 * This plugins is intended to ease some of scripting needs.
 * Please refer to code comments.
 *
 * Plugin Commands:
 * Calc $v(2) = 2+2+$v(4)
 * Sets variable #2 to the result of 2 + 2 + variable #4.
 * You can do the same with Script event command, but it's more verbose.
 *
 * Creative Commons 4.0 Attribution license
 */

/*
* Add-ons:
* EvilCatUtils Colors: Adds Color type and class.
* EvilCatUtils Controls: Adds Key type and class.
*/
 
/*
* TODO:
* Better Error descriptions
*/
 
"use strict";

var EvilCat = {};

(function()
{
	// #############################
	// ### Convenience functions ###
	// #############################
	// Used to simplify common JS needs.
	
	/*
	* Converts any value to true or false per standard JavaScript expression rules.
	* @return bool
	*/
	EvilCat.toBool		=function(val) { return val ? true : false; }
	
	/*
	* Use in cases where "no argument" can be expressed as either ommiting, passing undefined or passing null.
	* @return bool
	*/
	EvilCat.isEmpty		=function(val) { return val===null || val===undefined;  }
	
	/*
	* Checks if value can be used as number. Doesn't parse expression like parseInt() and parseFloat() do.
	* @return bool
	*/
	EvilCat.isNumber	=function(n)	{ return !isNaN(Number(n)) && isFinite(n); }
	
	/*
	* Checks value is arguments objects, which is similar to an array, but isn't an array. Have to be careful with that!
	* @return bool
	*/
	EvilCat.isArguments	=function(item)	{ return Object.prototype.toString.call(item)==='[object Arguments]'; }
	
	/*
	* Checks if value is an array or an arguments object.
	* @return bool
	*/
	EvilCat.isArrayLike	=function(item)	{ return item instanceof Array || EvilCat.isArguments(item); }
	
	/*
	* Creates new Map from an iterable object or appends elements to an existing map.
	* Use this for compatibility with IE 11 and Safari 7.1+
	* @return Map
	*/
	EvilCat.IterableToMap=function(iterable, map)
	{
		if (!map) map=new Map();
		for (var x in iterable) map.set(x, iterable[x]);
		return map;
	}
	
	/*
	* Shallow copy of a basic data object (an object used only to store basic data, no functions or prototype).
	* @param Object source
	* @return Object a new object having the same own properties as the original.
	*/
	EvilCat.cloneDataObject=function(source)
	{
		if (source.constructor!==Object) throw new Error('cloneDataObject is for basic object only!');
		return EvilCat.receiveProperties({}, source);
	}
	
	/*
	* @return New object of specied class created with the array of arguments.
	*/
	EvilCat.newApply=function(constructor, args)
	{
		obj=Object.create(constructor.prototype);
		constructor.apply(obj, args);
		return obj;
	}
	
	// ##########################
	// ### Inheritance engine ###
	// ##########################
	// A pretty standard take on inheriting and composing JS "classes".
	
	/*
	* Creates a "trait" (object for mixing into prototypes) by adding together other traits.
	* Accepts any number of object arguments.
	* @return Object A new trait object composed of all objects.
	*/
	EvilCat.composeTrait=function()
	{
		var trait={};
		for (var x=0; x<arguments.length; x++)
		{
			EvilCat.receiveProperties(trait, arguments[x]);
		}
		return trait;
	}

	/*
	* Function-style class extension. Sets parent_constructor's prototype (if provided) as constructor's prototype's prototype, which is a form of class inheritance in JavaScript.
	* @param Function constructor Constructor of target class.
	* @param Function|Object parent_constructor May be a constructor of parent class or a trait.
	* Also accepts any number of traits.
	
	* Usually used like this:
	* var <class_name>=function () { ... }
	* EvilCat.extend(<class_name>, <parent_class_name>, { new and overloaded methods in object notation });
	*/
	EvilCat.extend=function(constructor, parent_constructor /* , trait, trait... */)
	{
		var traits_from;
		if (parent_constructor instanceof Function)
		{
			constructor.prototype=Object.create(parent_constructor.prototype);
			constructor.prototype.constructor=constructor;
			traits_from=2;
		}
		else traits_from=1;
		
		if (arguments.length<=traits_from) return;
		for (var x=traits_from; x<arguments.length; x++)
		{
			if (arguments[x] instanceof Function) EvilCat.useTrait(constructor, arguments[x].prototype);
			else EvilCat.useTrait(constructor, arguments[x]);
		}
	}

	/*
	* Mixes a trait into prototype
	* @param Function constructor Target class constructor
	* @param Object trait A trait to mix-in.
	*/
	EvilCat.useTrait=function(constructor, trait)
	{
		EvilCat.receiveProperties(constructor.prototype, trait);
	}

	/*
	* Copies properties of one object to another. Handles get/set properties correctly. Doesn't clone sub-objects.
	* @param Object target A target to copy properties to.
	* @param Object source The donor of properties.
	*/
	EvilCat.receiveProperties=function(target, source)
	{
		var keys=Object.getOwnPropertyNames(source), key, prop;
		keys.forEach(function(key)
		{
			prop=Object.getOwnPropertyDescriptor(source, key);
			Object.defineProperty(target, key, prop);
		});
	}
	
	// #####################
	// ### Plugin engine ###
	// #####################
	
	/*
	* A class for handling singleton plugin objects.
	* Usage:
		
		var <some_var> = function <plugin_name> {
			// JS constructor notation here
		}
		<some_var>.prototype = Object.create(EvilCat.Plugin.prototype);
		<some_var>.prototype.constructor = <some_var>;
		
		OR
		
		var <some_var> = function <plugin_name> {
			// JS constructor notation here
		}
		EvilCat.extend(<some_var>, EvilCat.Plugin, { new and overloaded methods in object notation }
		
		OR
		
		THEN
		
		var <plugin_var> = new <some_var>; // the class is singleton, meaning it has only one instance; we create it now.
	*/
	var Plugin = EvilCat.Plugin = function()
	{
		/*
		* Don't forget to call parent's constructor when inheriting from this class! Use either:
		  EvilCat.Plugin.apply(this, arguments);
		* Note that constructor (or class definition for JS6 way) should have a name to be activated properly by EvilCatUtils system!
		* @throws Error if constructor function has no name.
		*/
		
		this.name=this.constructor.name;
		if (!this.name) throw new Error('Plugin constructor should have a name!');
		else if (EvilCat.Plugins.has(this.name)) throw new Error('Duplicate plugin!');
		EvilCat.Plugins.set(this.name, this);
		
		this.makeCommandsList();
		
		this.initTypes();
		this._parsedParams=new Map();
		this.addOns=new Map();
	}
	
	// ##############################
	// ### Plugin commands engine ###
	// ##############################
	
	/*
	* Overload this method to append string names of methods that are valid as Plugin Commands. For example:
	* makeCommandsList() { this.validCommands=['loadEvent']; }		
	* Methods listed here are called with Game_Event object as first argument, then all other Plugin Command arguments.
	* @return Array A list of string names of plugin's methods that should be available as Plugin Command.
	*/
	Plugin.prototype.makeCommandsList=function() { this.validCommands=[]; }
		
	/*
	* Handles Plugin Commands.
	* @private
	* @param Game_Interperter interpreter The interpreter that called Plugin Command.
	* @param Array args Arguments of Plugin Command as parsed by Game_Interpreter
	* @throws Error if command is not found among methods available as Plugin Commands.
	*/
	Plugin.prototype._eventCommand=function(plugin_name, interpreter, args)
	{
		var command_method=this._getCommandMethod(args[0], plugin_name);
		if (!command_method) throw new Error('unknown command '+args[0]);
		var plugin_args=args.slice(1);
		plugin_args.unshift(interpreter);
		plugin_args.unshift(plugin_name);
		command_method.apply(this, plugin_args);
	}
		
	/*
	* Returns plugin's method to handle specific Plugin Command.
	* @private
	* @param string command String command name as parsed by Game_Interpreter.
	* @return Function|null Either the desired method or null if not a valid Plugin Command.
	* @throws Error if Plugin Command is listed as available, but the plugin object doesn't actually have this method.
	*/
	Plugin.prototype._getCommandMethod=function(command, plugin_name)
	{
		var ind=this.validCommands.indexOf(command);
		if (ind==-1) return;
		if (!this[command] || !(this[command] instanceof Function)) throw new Error('bad plugin command');
		return this[command];
	}
	
	var _Game_Interpreter_pluginCommand=Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args)
	{
		if (EvilCat.Plugins.has(command)) EvilCat.Plugins.get(command)._eventCommand(command, this, args);
		else if (EvilCat.PluginAliases.has(command)) EvilCat.PluginAliases.get(command)._eventCommand(command, this, args);
        else _Game_Interpreter_pluginCommand.call(this, command, args);
    };
	
	Game_Interpreter.prototype.getContext = function()
	{
		if (this._eventId>0) return $gameMap.event(this._eventId);
		// in all other cases, the Interpreter isn't informed of its master.
	}
	
	// ################################
	// ### Plugin parameters engine ###
	// ################################
		
	/*
	* Returns plugin's raw parameters (not parsed).
	* @return Map
	*/
	Plugin.prototype.parameters=function()
	{
		if (!this._paramaters)
		{
			var params = this._parameters = EvilCat.IterableToMap(PluginManager.parameters(this.name));
			this.addOns.forEach(function(name) { EvilCat.IterableToMap(PluginManager.parameters(name), params); } );
		}
		return this._parameters;
	}
		
	/*
	* Returns plugin's parameter converted to desired type.
	* Type should be 'Bool', 'Int', 'Float', 'String', a parser method or a string name of pre-extended types (see below).
	* If a param is parsed once, the result is stored. It is assumed that param is supposed to be of specific type only, and neither it nor the type changes at runtime.
	* @param string name A string name of a parameter.
	* @param string|Function type Either a string name of a type, or a parser.
	* @param by_default (optional) A value to return if the parameter is not present.
	* @return Parsed parameter value.
	* @throws Error if parameter is not set and by_default is not provided.
	*/
	Plugin.prototype.parameter=function(name, type, by_default)
	{
		if (this._parsedParams.has(name)) return this._parsedParams.get(name);
		
		var me=this, save=function(val) { me._parsedParams.set(name, val); return val; }
		
		var parameters=this.parameters();
		if (!parameters.has(name))
		{
			if (by_default===undefined) throw new Error('Required param: '+name);
			return save(by_default);
		}
		
		var param=parameters.get(name);
		if (type)
		{
			try
			{
				return this._parseParam(param, type, name);
			}
			catch (err)
			{
				if (by_default!==undefined)
				{
					console.log(this.name+' plugin: Default value used for '+name);
					return save(by_default);
				}
				else throw err;
			}
		}
		else return save(param);
	}
		
	/*
	* Parses a parameter according to a type.
	* @private
	* @param string param A value of a parameter.
	* @param string|Function type Either a string name of a type, or a parser.
	* @param string name A string name of a parameter.
	* @return Parsed parameter value.
	* @throws Error if can't decide parsed for the type.
	*/
	Plugin.prototype._parseParam=function(param, type, name)
	{
		var method;
		if (type instanceof Function) method=type;
		else method=this._parserByName(type);
		if (!method) throw new Error('no parse method for '+type);
		var parsed=method(param);
		if (name!==undefined) this._parsedParams.set(name, parsed);
		return parsed;
	}
		
	/*
	* Find parser by type's string name.
	* @private
	* @param string type_name A string name of a type, like 'Bool', 'Int', 'Float'. The type should be pre-extended to the class.
	* @return undefined|Function The parsed function if found; undefined otherwise.
	*/
	Plugin.prototype._parserByName=function(type_name)
	{
		var method='parse'+type_name;
		if (!this[method] || !(this[method] instanceof Function)) return undefined;
		return this[method].bind(this); // Parsers usually don't requre a context, but it should be a reliable feature nonetheless.
	}
		
	/*
	* Supplies a Plugin class with additinal parameter parser.
	* Example: EvilCat.ShadowedCharacters.extendType('Color'); // If EvilCatColors add-on plugin is used.
	*
	* Has sereval signatures:
	*
	* @param string name Type name
	* @param Function parser The function to convert to type.
	*
	* @param Function parser The function to convert to type, shoul'd have a name!
	*
	* @param string name Type name that is present in EvilCat.parses object.
	*/
	Plugin.prototype.extendType=function(name, parser)
	{
		if (parser===undefined)
		{
			if (name instanceof Function && Function.name) { parser=name; name=parser.name; }
			else if (EvilCat.parsers.has(name)) parser=EvilCat.parsers.get(name);
			else throw new Error('No parser!')
		}
		
		var parserName='parse'+name, paramName='param'+name;
		if (this[parserName]) throw new Error('Parser '+name+' already exists!');
		if (this[paramName])  throw new Error('Parser '+name+' already exists!');
		
		this[paramName]=function(pname, by_default) { return this.parameter(pname, name, by_default); }
		this[parserName]=parser;
	}
		
	/*
	* Supplies a Plugin class with additinal parameter parsers. Should be called in plugin class (not instance) context!
	* Accepts a list constisting of names and parsers in any combination. They are handed to extendType function.
	*/
	Plugin.prototype.extendTypes=function()
	{
		for (var x=0; x<arguments.length; x++)
		{
			this.extendType(arguments[x]);
		}
	}
	
	Plugin.prototype.initTypes=function()
	{
		this.extendTypes('Bool', 'Int', 'Id', 'Float', 'String', 'Array', 'IntArray');
	}
	
// ##################################
// ##    Standard type parsers    ###
// ##################################
	EvilCat.parsers=EvilCat.IterableToMap(
	{
		Bool: function Bool(param)
		{
			if (param===true || param===false) return param;
			param=param.toLowerCase().trim();
			
			var string_true =['true',	'y',	'yes',	'on',	'1',	'enable',	'enabled'];
			var string_false=['false',	'n',	'no',	'off',	'0',	'disable',	'disabled'];
			
			if (string_true.indexOf(param)!=-1) return true;
			if (string_false.indexOf(param)!=-1) return false;
			
			throw new Error('unknown boolean value: '+param);
		},
		
		Int: function Int(param)
		{
			if (Number.isInteger(param)) return param;
			return Math.floor(Number(param));
		},
		
		Id: function Id(param)
		{
			param=EvilCat.parsers.get('Int')(param);
			if (param<1) throw new Error('bad Id');
			return param;
		},
		
		Float: function Float(param)
		{
			if (Number.isFinite(param)) return param;
			var result=Number(param);
			if (isNaN(result)) throw new Error('Not a number');
			return result;
		},
		
		String: function String(param)
		{
			if (typeof param === 'string') return param;
			return window.String(param); // accessing global String property instead of local (which is the function itself for portability reasons)
		},
		
		Array: function Array(param) // String array by default!
		{
			if (param instanceof Array) return param;
			if (typeof param === 'string') return param.split(/\s*,\s*/);
			throw new Error('bad array');
		},
		
		IntArray: function IntArray(param)
		{
			if (typeof param === 'string') param=param.split(/\s*,\s*/);
			if (!(param instanceof Array)) throw new Error('bad array');
			return param.map(function(val) { return Math.floor(Number(val)); });
		}
	});
	
	// #############################
	// ### Plugin add-ons engine ###
	// #############################
	
	/*
	* Registers an add-on for an EvilCat Plugin. Combines plugin arguments and possibly adds an alias for plugin calls.
	*/
	Plugin.prototype.registerAddOn=function(name, applyAlias)
	{
		this.addOns.push(name);
		if (this._parameters) EvilCat.receiveProperties(this._parameters, PluginManager.parameters(name));
		if (applyAlias) EvilCat.PluginAliases[name]=this;
	}
	
	EvilCat.Plugins=new Map();
	EvilCat.PluginAliases=new Map();
	
// ##################################
// ##       The utils plugin	   ##
// ##################################

	var Utils = EvilCat.Utils = function Utils()
	{
		EvilCat.Plugin.call(this);
	}
	EvilCat.extend(Utils, EvilCat.Plugin);

	Utils.prototype._eventCommand=function(plugin_name, interpreter, args)
	{
		if (plugin_name==='Calc') this.Calc(args.join(''));
		else EvilCat.Plugin.prototype._eventCommand.apply(this, arguments);
	}
		
	Utils.prototype.Calc=function(expr)
	{
		var match=/^\s*\$v\(\s*(\d+)\s*\)\s*=(.+)$/.exec(expr);
		if (!match) throw new Error('Bad or useless expression: '+expr);
		var $v=function(index) { return $gameVariables.value(index); };
		$gameVariables.setValue(match[1], eval(match[2]));
	}
	Utils = EvilCat.Utils = new Utils();
	EvilCat.PluginAliases.set('Calc', Utils);
	
// ##############################################
// ###    Getting meta from various objects   ###
// ##############################################
	
	/*
	* A standard method to extract and parse data from meta.
	* @private
	
	* Has several signatures:
	* @param Array meta A meta array.
	* @return Array Raw meta
	
	* @param Array meta A meta array.
	* @param string name A string name of a meta parameter
	* @param string|Function type Either a string name of a standard type, or a parser.
	* @param by_default (optional) A value to return if the parameter is not present.
	* @return Parsed meta parameter value; or undefined if either parameter or meta is not present.
	* @throws Error if can't decide parser function.
	*/
	var extractFromMeta = EvilCat.extractFromMeta =function(meta, name, parser, by_default)
	{
		if (!meta) return undefined;
		if (name===undefined) return meta;
		
		var value;
		if (!meta.hasOwnProperty(name)) return by_default;
		value=meta[name];
		if (parser)
		{
			if (typeof parser === 'string')
			{
				if (!EvilCat.parsers.has(parser)) throw new Error('Bad parser name!');
				parser=EvilCat.parsers.get(parser);
			}
			value=parser(value);
		}
		return value;
	}
	
	/*
	* Method attached to most objects that have notes. Has same signature as EvilCat.Plugin.parameter.
	* Doesn't store parsed values, so is slightly more expensive than plugin's method.
	* @param string name A string name of a meta parameter.
	* @param string|Function type Either a string name of a standard type, or a parser.
	* @param by_default (optional) A value to return if the parameter is not present.
	* @return Parsed meta parameter value.
	*/
	var getMeta=function(param, parser, by_default)
	{
		var meta;
		if (this.meta) meta=this.meta;
		else if (this.getDBData)
		{
			var data=this.getDBData();
			if (data && data.meta) meta=data.meta;
		}
		if (!meta) return by_default;
		return extractFromMeta(meta, param, parser, by_default);
	}
	
	Game_Item	.prototype.getMeta	=getMeta;
	Game_Actor	.prototype.getMeta	=getMeta;
	Game_Enemy	.prototype.getMeta	=getMeta;
	Game_Map	.prototype.getMeta	=getMeta;
	Game_Event	.prototype.getMeta	=getMeta;
	Game_Player	.prototype.getMeta	=getMeta;
	Game_Follower.prototype.getMeta	=getMeta;
	// Troops, Common Events, and Vehicles don't have notes
	
	if (Utils.paramBool('Read Meta from Page', true))
	{
		var gatherIntroComments=function(list)
		{
			if (!list) return;
			var comments=[], command;
			for (var x=0; x<list.length; x++)
			{
				command=list[x];
				if (command.code!==108 && command.code!==408) break;
				comments.push(command.parameters[0]);
			}
			return comments.join("\n");
		}
		
		var _Game_Event_setupPageSettings=Game_Event.prototype.setupPageSettings;
		Game_Event.prototype.setupPageSettings = function()
		{
			_Game_Event_setupPageSettings.call(this);
			var metaSource=this.getDBData().note;
			var page=this.page();
			var intro=gatherIntroComments(page && page.list);
			if (intro) metaSource=[metaSource, intro].join("\n");
			
			var fakeData={note: metaSource};
			DataManager.extractMetadata(fakeData);
			this.meta=fakeData.meta;
		}
		var _Game_Event_clearPageSettings=Game_Event.prototype.clearPageSettings;
		Game_Event.prototype.clearPageSettings = function()
		{
			_Game_Event_clearPageSettings.call(this);
			var fakeData={note: this.getDBData().note};
			DataManager.extractMetadata(fakeData);
			this.meta=fakeData.meta;
		}
		
		Game_CommonEvent.prototype.getMeta=getMeta;
		var _Game_CommonEvent_refresh=Game_CommonEvent.prototype.refresh;
		Game_CommonEvent.prototype.refresh = function()
		{
			this.initMeta(); // CommonEvent doesn't have a clear setup method: it sets ID, then proceeds to refresh, which may already need meta.
			_Game_CommonEvent_refresh.call(this);
		}
		
		Game_CommonEvent.prototype.initMeta = function()
		{
			if (this.meta!==undefined) return;
			var intro=gatherIntroComments(this.list());	
			var fakeData={note: intro};
			DataManager.extractMetadata(fakeData);
			this.meta=fakeData.meta;
			this.setupMeta();
		}
		
		Game_CommonEvent.prototype.setupMeta = function() { } // overload me!
	}
	
// #########################################
// ###     Common function for DB data   ###
// #########################################
	
	// for skills, weapons, armor and items
	Game_Item	.prototype.getDBData	=function() { return this.object();	}
	Game_Actor	.prototype.getDBData	=function() { return this.actor();	}
	Game_Enemy	.prototype.getDBData	=function() { return this.enemy();	}
	Game_Troop	.prototype.getDBData	=function() { return this.troop();	}
	Game_Map	.prototype.getDBData	=function() { return $dataMap;		}
	Game_CommonEvent.prototype.getDBData
										=function() { return this.event();	}
	Game_Event	.prototype.getDBData	=function() { return this.event();	}
	Game_Player	.prototype.getDBData	=function() { return $gameParty.leader().getDBData(); }
	Game_Follower.prototype.getDBData	=function() { return this.actor() && this.actor().getDBData(); }
	Game_Vehicle.prototype.getDBData	=function() { return this.vehicle();}
	
// #########################################
// ###     Additional manager methods    ###
// #########################################
	
	SceneManager.isInStack=function(sceneClass)
	{
		return this._stack.indexOf(sceneClass)!=-1;
	}
	
// #########################################
// ##    Additional Character methods    ###
// #########################################

	/*
	* Sets arbitrary data to event instead of what it had before.
	* @param Object data Data in json format.
	*/
	Game_Event.prototype.setData=function(data)
	{
		data.id=this.eventId();
		DataManager.extractMetadata(data);
		var x=this.x, y=this.y;
		this.event=function() { return data; }
		this.initMembers();
		this.locate(x, y);
		this.refresh();
	}

	var oldGameEvent_initialize=Game_Event.prototype.initialize;
	Game_Event.prototype.initialize = function(mapId, eventId)
	{
		if (eventId>=Game_Event._nextFreeId) Game_Event._nextFreeId=eventId+1;
		oldGameEvent_initialize.call(this, mapId, eventId);
	}
	
	Game_Event._nextFreeId=1;
	Game_Event.getNextFreeId=function()
	{
		return Game_Event._nextFreeId;
	}

	/*
	* Checks if Event is near enough to a position by its real coordinates. Analogous to standard pos() method.
	* Doesn't take into account diagonals! Point 1,1 is withint distance 1 of point 0,0 by this system, but 1.1, 0 isn't.
	* @param float x Reference point x
	* @param float y Reference point y
	* @param float max_distance (Optional) Maximum divergence by an axis to be considered out of range; default is 1.
	* @return bool
	*/
	Game_CharacterBase.prototype.realPos=function(x, y, max_distance)
	{
		if (max_distance===undefined) max_distance=1;
		return (Math.abs(this._realX-x)<max_distance) && (Math.abs(this._realY-y)<max_distance);
	}
	
	/*
	* Calculates trigonometrical distance from Event's real coordinates to the reference point.
	* @param float x Reference point x
	* @param float y Reference point y
	* @return float Distance
	*/
	Game_CharacterBase.prototype.realDistanceTo=function(x, y)
	{
		return Math.sqrt( Math.pow(this._realX-x, 2) + Math.pow(this._realY-y, 2) );
	}
	
	/*
	* Lists events that are near enough in a square range to a position by their real coordinates. Analogous to standard eventsXy() method.
	* @see Game_CharacterBase.prototype.realPos()
	* @param float x Reference point x
	* @param float y Reference point y
	* @param float max_distance (Optional) Maximum divergence by an axis to be considered out of range; default is 1.
	* @return Array of Game_Event
	*/
	Game_Map.prototype.eventsRealXy=function(x, y, max_distance)
	{
		return this.events().filter(function(event) {
			return event.realPos(x, y);
		});
	}
	
	/*
	* Returns Event that is nearest trigonometrically to the reference point by its real coordinates.
	* Picks from events filtered by eventsRealXy() method, that is - all events in square range of the refernce point.
	* @see Game_Map.prototype.eventsRealXy()
	* @param float x Reference point x
	* @param float y Reference point y
	* @param float max_distance (Optional) Maximum divergence by an axis to be considered out of range; default is 1.
	* @return Game_Event|null Either Game_Event object; or null if not found.
	*/
	Game_Map.prototype.nearestEvent=function(x, y, max_distance)
	{
		var distance=null;
		return this.events().reduce(
			function(carry, event)
			{
				if (!event.realPos(x, y, max_distance)) return carry;
				var new_distance=event.realDistanceTo(x, y);
				if (distance===null || new_distance<distance)
				{
					distance=new_distance;
					return event;
				}
				else return carry;
			},
			null
		);
	}
	
})()