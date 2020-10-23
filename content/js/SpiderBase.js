/* ***** BEGIN LICENSE BLOCK *****
 *   Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Low Cost Travel.
 *
 * The Initial Developer of the Original Code is
 * Fabrizio Antonangeli.
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 * 
 * ***** END LICENSE BLOCK ***** */

/**
 * Class for storing a flight
 */
Flight=new Class({
	dates:Array(),
	airports:Array(),
	airlines:Array(),
	stops:0
});

/**
 * Class for store a airport or airline
 */
IataElement=new Class({
	name:null,
	iataCode:null,
	
	/**
	 * return a printable string about thi airport
	 * @return string
	 */
	toString:function(){
		if(this.name==null) this.setNameFromDB();
		
		if(this.name=="") return this.iataCode;
		return this.name;
	}

	
});

/**
 * Class for store a airline
 */
Airline=new Class({
	Implements: IataElement,
	
	/**
	 * find a iataCode in the db and set the name to the value 
	 */
	setNameFromDB:function(){
		var tmp;
		
		try {			
			tmp=findAirlinesbyIataCode(this.iataCode);
			
			if(tmp.length==1) this.name=tmp[0];
			else this.name="";
		} catch (e) {
			this.name="";
		}
	}
});

/**
 * Class for store a airport
 */
Airport=new Class({
	Implements: IataElement,
	
	/**
	 * find a iataCode in the db and set the name to the value 
	 */
	setNameFromDB:function(){
		var tmp;
		
		try {
			tmp=findAirportbyIataCode(this.iataCode);
			
			if(tmp!=false) this.name=tmp;
			else this.name="";
		} catch (e) {
			this.name="";
		}
	}
});

/**
 * Class for store a airport
 */
SearchAirport=new Class({
	Implements: Airport,
	
	/**
	 * find for every airport, city...
	 * type of the value {'Airports', 'Cities', 'AirportsAndCities'}
	 */
	findEvery:null
});

/**
 * Class for storing a airfare
 */
Result = new Class({
	departure:new Flight(),
	return:new Flight(),

	/**
	 * Price in USD
	 */
	price:null,

	/**
	 * The domain where was found the airfare
	 */
	domain:null,

	/**
	 * The url for booking the airfare
	 */
	bookingLink:null
});

/*
 * Class for store search settings for a flight
 */
SearchSettingsFlight=new Class({
	date:null,
	airport:new SearchAirport(),

	/**
	 * Bool find nearby airport about the origin
	 */
	nearby:false
});


/*
 * Class for store the search settings
 */ 
SearchSettings = new Class({
	departure:new SearchSettingsFlight(),
	destination:new SearchSettingsFlight(),
	
	/**
	 * number of travelers
	 */
	travelers : 0,
	
	/**
	 * max number of simultaneous spiders per time
	 */
	maxSpidersNumber : 10,
	
	/**
	 * type of the travel {'OneWay', 'RoundTrip'}
	 */
	type:"RoundTrip"

});


/**
 * Baseclass for creation of spiders
 */
Spider = new Class( {
	
	Implements: Events,
	
	
	//VARIABLES-----------------------------------------------------------------

	// spider settings
	_url : null,
	_domain : null,
	_idFrame : null,
	_startTime : null,

	
	/**
	 * the type of the spider {'Currency', 'Airfare'}
	 */
	_type:"Airfare",
	
	/**
	 * the search settings
	 */
	_searchSettings:null,

	/**
	 * results of the spider
	 */
	results : Array(),

	/**
	 * true if the search is started
	 */
	isStarted : false,

	/**
	 * true if the search is completed
	 */
	isCompleted : false,

	/**
	 * Enable or disable the spider
	 */
	enable : true,

	/**
	 * The parent that contain the spider's frame
	 */
	framesParent : "FramesParent",

	/**
	 * the stringbundleset
	 */
	_stringbundleset : document.getElementById('lowcosttravel-strings'),
	
	/**
	 * the name of the instance
	 */
	_instanceName: null,
	
	
	
	
	//EVENTS--------------------------------------------------------------------
	
	/**
	 * Fired when searching and indexing are completed
	 */
	onComplete:function(){
		this.isComplete=true;
		
		//firing event onComplete
		this.fireEvent('onComplete');

		// remove the frame from the dom
		setTimeout(function() {
			$('#'+arguments[0]).remove();
		}, 0, this._idFrame);
		
	},
	
	
	
	//METHODS-------------------------------------------------------------------
	
	/**
	 * Create a new spider
	 * 
	 * @param instanceName
	 *            the name of the instance
	 * @param searchSettings
	 *            Search Settings for search airfares
	 */
	initialize:function(instanceName, searchSettings){
		this._searchSettings=searchSettings;
		this._instanceName=instanceName;
		this._idFrame="SpiderFrame_"+rand();
	},

	/**
	 * Return the url used to contact the page
	 * 
	 * @return string the url
	 */
	_queryUrl : function() {
		this._startTime   = ( new Date() ).getTime();

		if (!this.enable)
			return "";

		return null;
	},

	/**
	 * Compile the forms in the page and start the search
	 * @return bool true if ok, false if not
	 */
	start : function() {
		var e = null;

		
		// pre-check
		{
			//enable
			if (!this.enable) return true;
			
			// isStarted
			if (this.isStarted) return true;
		}

		e = document.createElement("iframe");
		e.setAttribute("src", this._queryUrl());
		e.setAttribute("id", this._idFrame);
		e.setAttribute("type", this._type);
		e.setAttribute("onload", this._instanceName+".read(this)");

		document.getElementById(this.framesParent).appendChild(e);
		
		this.isStarted=true;
		this.results=[];
		
		return true;
	},

	/**
	 * Read the results from the page and write it in an array
	 * 
	 * TODO N aggiungere il supporto di meta indefinita (usare qualcosa tipo
	 * String.fromCharCode(a.charCodeAt(0)+1))
	 * @return bool true if ok, false if not
	 */
	read : function(e) {

		if (!this.enable) return true;
		
		return true;
	}
	
	

});
