/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * Editable object
 * @namespace GENTICS.Aloha
 * @class Editable
 * @method
 * @constructor
 * @param {Object} obj jQuery object reference to the object
 */
GENTICS.Aloha.Editable = function(obj) {
		
	// store object reference
	this.obj = obj;

	// the editable is not yet ready
	this.ready = false;

	// register the editable with Aloha
	GENTICS.Aloha.registerEditable(this);

	// try to initialize the editable
	this.init();
};

/**
 * True, if this editable is active for editing
 * @property
 * @type boolean
 */
GENTICS.Aloha.Editable.prototype.isActive = false;

/**
 * stores the original content to determine if it has been modified
 * @hide
 */
GENTICS.Aloha.Editable.prototype.originalContent = null;

/**
 * every time a selection is made in the current editable the selection has to
 * be saved for further use
 * @hide
 */
GENTICS.Aloha.Editable.prototype.range = undefined;

/**
 * Check if object can be edited by Aloha Editor
 * @return {boolean } editable true if Aloha Editor can handle else false 
 * @hide
 */
GENTICS.Aloha.Editable.prototype.check = function() {
	
	/* check elements
	'map', 'meter', 'object', 'output', 'progress', 'samp',
	'time', 'area', 'datalist', 'figure', 'kbd', 'keygen',
	'mark', 'math', 'wbr', 'area',
    */

	// supported elements
	var textElements = [ 'a', 'abbr', 'address', 'article', 'aside',
				'b', 'bdo', 'blockquote',  'cite', 'code', 'command',
				'del', 'details', 'dfn', 'div', 'dl', 'em', 'footer', 'h1', 'h2',
				'h3', 'h4', 'h5', 'h6', 'header', 'i', 'ins', 'menu',
				'nav', 'p', 'pre', 'q', 'ruby',  'section', 'small',
				'span', 'strong',  'sub', 'sup', 'var']; 	
	for (var i = 0; i < textElements.length; i++) {
		var e = this.obj.get(0).nodeName.toLowerCase();
		if ( this.obj.get(0).nodeName.toLowerCase() == textElements[i] ) {
			return true;
		}
	}
	
	// special handled elements
	if ( this.obj.get(0).nodeName.toLowerCase() == 'label') {
		// need some special handling.
	    return true;		
	}
	if ( this.obj.get(0).nodeName.toLowerCase() == 'button') {
		// need some special handling.
	    return true;		
	}
	if ( this.obj.get(0).nodeName.toLowerCase() == 'textarea') {
		// need some special handling.
	    return true;	
	}
				
	// all other elements are not supported
	/*		
	'canvas', 'audio', 'br', 'embed', 'fieldset', 'hgroup', 'hr', 
	'iframe', 'img', 'input', 'map', 'script', 'select', 'style', 
	'svg', 'table', 'ul', 'video', 'ol', 'form', 'noscript',
	 */
	return false;
}


/**
 * Initialize the editable
 * @return void
 * @hide
 */
GENTICS.Aloha.Editable.prototype.init = function() {
	var that = this;
	
	// check if Aloha can handle the obj as Editable
	if ( !this.check( this.obj ) ) {
		//GENTICS.Aloha.log('warn', this, 'Aloha cannot handle {' + this.obj[0].nodeName + '}');
		this.destroy();
		return;
	}
	
	// only initialize the editable when Aloha is ready
	if (GENTICS.Aloha.ready) {

		// initialize the object
		this.obj.addClass('GENTICS_editable');
		this.obj.attr('contenteditable', true);
		
		// add focus event to the object to activate
		this.obj.mousedown(function(e) {
			that.activate(e);
			e.stopPropagation();
		});
		
		this.obj.focus(function(e) {
			that.activate(e);
		});
		
		// by catching the keydown we can prevent the browser from doing its own thing
		// if it does not handle the keyStroke it returns true and therefore all other
		// events (incl. browser's) continue
		this.obj.keydown( function(event) { 
			return GENTICS.Aloha.Markup.preProcessKeyStrokes(event);
		});

		// handle shortcut keys
		this.obj.keyup( function(event) { 
			if (event['keyCode'] == 27 ) {
				GENTICS.Aloha.deactivateEditable();
				return false;
			}
		});
		
		// register the onSelectionChange Event with the Editable field
		this.obj.GENTICS_contentEditableSelectionChange(function (event) {
			GENTICS.Aloha.Selection.onChange(that.obj, event);
			return that.obj;
		});
		
		// throw a new event when the editable has been created
		/**
		 * @event editableCreated fires after a new editable has been created, eg. via $('#editme').aloha()
		 * The event is triggered in Aloha's global scope GENTICS.Aloha
		 * @param {Event} e the event object
		 * @param {Array} a an array which contains a reference to the currently created editable on its first position 
		 */
		GENTICS.Aloha.EventRegistry.trigger(
				new GENTICS.Aloha.Event(
						'editableCreated',
						GENTICS.Aloha,
						[ this ]
				)
		);

		// mark the editable as unmodified
		this.setUnmodified();
		
		// now the editable is ready
		this.ready = true;
	}
};

/**
 * destroy the editable
 * @return void
 * @hide
 */
GENTICS.Aloha.Editable.prototype.destroy = function() {
	var that = this;
	
	// leave the element just to get sure
	this.blur();
	
	// now the editable is not ready any more
	this.ready = false;

	// initialize the object
	this.obj.removeClass('GENTICS_editable');
	this.obj.removeAttr('contenteditable');
	
	// unbind all events 
	// TODO should only unbind the specific handlers.
	this.obj.unbind('mousedown'); 
	this.obj.unbind('focus'); 
	this.obj.unbind('keydown'); 
	this.obj.unbind('keyup'); 
	
	/* TODO remove this event, it should implemented as bind and unbind
	// register the onSelectionChange Event with the Editable field
	this.obj.GENTICS_contentEditableSelectionChange(function (event) {
		GENTICS.Aloha.Selection.onChange(that.obj, event);
		return that.obj;
	});
	*/
	
	// throw a new event when the editable has been created
	/**
	 * @event editableCreated fires after a new editable has been destroyes, eg. via $('#editme').mahalo()
	 * The event is triggered in Aloha's global scope GENTICS.Aloha
	 * @param {Event} e the event object
	 * @param {Array} a an array which contains a reference to the currently created editable on its first position 
	 */
	GENTICS.Aloha.EventRegistry.trigger(
			new GENTICS.Aloha.Event(
					'editableDestroyed',
					GENTICS.Aloha,
					[ this ]
			)
	);

	// finally register the editable with Aloha
	GENTICS.Aloha.unregisterEditable(this);

};

/**
 * marks the editables current state as unmodified. Use this method to inform the editable
 * that it's contents have been saved
 * @method
 */
GENTICS.Aloha.Editable.prototype.setUnmodified = function () {
	this.originalContent = this.getContents();
};

/**
 * check if the editable has been modified during the edit process#
 * @method
 * @return boolean true if the editable has been modified, false otherwise
 */
GENTICS.Aloha.Editable.prototype.isModified = function () {
	if (this.originalContent != this.getContents()) {
		return true;
	} else {
		return false;
	}
};

/**
 * String representation of the object
 * @method
 * @return GENTICS.Aloha.Editable
 */
GENTICS.Aloha.Editable.prototype.toString = function() {  
	return 'GENTICS.Aloha.Editable';
};

/**
 * check whether the editable has been disabled 
 */
GENTICS.Aloha.Editable.prototype.isDisabled = function () {
	if (this.obj.attr("contenteditable") == "false" || !this.obj.attr("contenteditable")) {
		return true;
	} else {
		return false;
	}
};

/**
 * disable this editable
 * a disabled editable cannot be written on by keyboard
 */
GENTICS.Aloha.Editable.prototype.disable = function() {
	if (this.isDisabled()) {
		return;
	}
	this.obj.attr("contenteditable", "false");
};

/**
 * enable this editable
 * reenables a disabled editable to be writteable again 
 */
GENTICS.Aloha.Editable.prototype.enable = function() {
	if (!this.isDisabled()) {
		return;
	}
	this.obj.attr("contenteditable", "true");
};


/**
 * activates an Editable for editing
 * disables all other active items
 * @method
 */
GENTICS.Aloha.Editable.prototype.activate = function(e) {
	
	// leave immediately if this is already the active editable
	if (this.isActive || this.isDisabled()) {
		return;
	}

	// get active Editable before setting the new one.
	var oldActive = GENTICS.Aloha.getActiveEditable(); 

	// set active Editable in core
	GENTICS.Aloha.activateEditable( this );
	
	// ie specific: trigger one mouseup click to update the range-object
	if (document.selection && document.selection.createRange) {
		this.obj.mouseup();
	}

	// finally mark this object as active
	this.isActive = true;
	
	/**
	 * @event editableActivated fires after the editable has been activated by clicking on it.
	 * This event is triggered in Aloha's global scope GENTICS.Aloha
	 * @param {Event} e the event object
	 * @param {Array} a an array which contains a reference to last active editable on its first position, as well
	 * as the currently active editable on it's second position 
	 */
	// trigger a 'general' editableActivated event
	GENTICS.Aloha.EventRegistry.trigger(
		new GENTICS.Aloha.Event('editableActivated', GENTICS.Aloha, {
			'oldActive' : oldActive,
			'editable' : this
		})
	);

	/**
	 * @event editableActivated fires after the editable has been activated by clicking on it.
	 * This event is triggered in the Editable's local scope
	 * @param {Event} e the event object
	 * @param {Array} a an array which contains a reference to last active editable on its first position 
	 */
	// and trigger our *finished* event
	GENTICS.Aloha.EventRegistry.trigger(
			new GENTICS.Aloha.Event('editableActivated', this, {
				'oldActive' : GENTICS.Aloha.getActiveEditable()
			})
	);

};

/**
 * handle the blur event
 * this must not be attached to the blur event, which will trigger far too often
 * eg. when a table within an editable is selected
 * @hide 
 */
GENTICS.Aloha.Editable.prototype.blur = function() {

	// blur this contenteditable
	this.obj.blur();

	// disable active status
	this.isActive = false;
	
	/**
	 * @event editableDeactivated fires after the editable has been activated by clicking on it.
	 * This event is triggered in Aloha's global scope GENTICS.Aloha
	 * @param {Event} e the event object
	 * @param {Array} a an array which contains a reference to this editable 
	 */	
	// trigger a 'general' editableDeactivated event
	GENTICS.Aloha.EventRegistry.trigger(
		new GENTICS.Aloha.Event('editableDeactivated', GENTICS.Aloha, {
			'editable' : this
		})
	);

	/**
	 * @event editableDeactivated fires after the editable has been activated by clicking on it.
	 * This event is triggered in the Editable's scope
	 * @param {Event} e the event object
	 */	
	GENTICS.Aloha.EventRegistry.trigger(
			new GENTICS.Aloha.Event('editableDeactivated', this)
	);
};

/**
 * check if the string is empty
 * used for zerowidth check
 * @return true if empty or string is null, false otherwise
 * @hide
 */
GENTICS.Aloha.Editable.prototype.empty = function(str) {
	if (null === str) {
		return true;
	}

	// br is needed for chrome
	return (GENTICS.Aloha.trim(str) == '' || str == '<br>');
};

/**
 * Get the contents of this editable as a HTML string
 * @method
 * @return contents of the editable
 */
GENTICS.Aloha.Editable.prototype.getContents = function() {
	// clone the object
	var clonedObj = this.obj.clone(true);
	GENTICS.Aloha.PluginRegistry.makeClean(clonedObj);
	return clonedObj.html();
};

/**
 * Get the id of this editable
 * @method
 * @return id of this editable
 */
GENTICS.Aloha.Editable.prototype.getId = function() {
	return this.obj.attr('id');
};
