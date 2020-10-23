/**
 * Class for create a array of spiders
 */
SpidersArray = new Class(
		{
			Extends : Array,

			//VARIABLES-----------------------------------------------------------------

			/**
			 * results of the spider
			 */
			results : [],

			/**
			 * The parent that contain the spider's frame
			 */
			framesParent : "FramesParent",

			/**
			 * the search settings
			 */
			_searchSettings : null,
			
			
			

			//METHODS-------------------------------------------------------------------	

			/**
			 * initialize all spiders
			 * 
			 * @param searchSettings
			 *            Search Settings for search airfares
			 * @return null if error
			 */
			initialize : function(searchSettings) {
				var destinations=[];
				var tmpSearchStettings;
			
				$('#' + this.framesParent).empty();

				if (searchSettings == undefined) return null;
				
				
				this._searchSettings = searchSettings;
				

				
				if(this._searchSettings.destination.airport.findEvery==null) 
					destinations.push(this._searchSettings.destination.airport.iataCode);
				else if(this._searchSettings.destination.airport.findEvery=="Cities")
					destinations=getIataCodesOfAllCities();
				

				
				for ( var i = 0; i < destinations.length; i++) {
					//initialize a single spider
					{
						tmpSearchStettings=this._searchSettings;
						tmpSearchStettings.destination.airport.iataCode=destinations[i];
						tmpSearchStettings.destination.airport.findEvery=null;


						if (SideStep.prototype.enable) this.push(new SideStep("spiders[" + spiders.length + "]", tmpSearchStettings));
					}
				}
				
			},

			/**
			 * Adds an event to all spider
			 * @param type (string) The type of event (e.g. 'onComplete')
			 * @param fn (function) The function to execute.
			 */
			addEventToAll : function(type, fn) {
				try {
					for ( var i = 0; i < this.length; i++) {
						this[i].addEvent(type, fn);
					}

					return true;
				} catch (e) {
					return false;
				}
			},

			/**
			 * start all spiders
			 * @return true if ok, false if not
			 */
			start : function() {

				try {
					for ( var i = 0; (i < this.length) && (i <= this._searchSettings.maxSpidersNumber); i++) {
						if (this[i].start() == false) {
							throw (null);
						}
						
					}

					return true;
				} catch (e) {
					return false;
				}
			},

			/**
			 * start next startable spiders
			 * @return true if ok, false if not
			 */
			startNext : function() {

				try {
					for ( var i = 0; (i < this.length); i++) if((this[i]!=null) && (!this[i].isStarted)){
						if (this[i].start() == false) {
							throw (null);
						}
						
						break;
					}

					return true;
				} catch (e) {
					return false;
				}
			},

			/**
			 * get the results array of all spiders
			 * @return true if ok, false if not
			 */
			getResults : function() {
				this.results = [];

				/**
				 * fill all name field for all Airport object in a array
				 * 
				 * @param airportArray
				 *            array of Airport class
				 * @return array of Airport class whith all name field filled
				 *         (when is possible), false on error
				 */
				function fillNameforAirportArray(airportArray) {
					try {
						for ( var i = 0; i < airportArray.length; i++) {
							if (airportArray[i].name == null) {
								airportArray[i].name = findAirportbyIataCode(airportArray[i].iataCode);
								
								if ((airportArray[i].name=="") || (airportArray[i].name==null)) {
									airportArray[i].name==null;
								} else {
									airportArray[i].name = "("+airportArray[i].iataCode+") "+airportArray[i].name;
								}
							}
						}
						
						return airportArray;
					} catch (e) {
						return false;
					}
				}

				// pre-check
				{
					if (!this || (this == null)) {
						return false;
					}
				}

				try {
					//for all spider
					for ( var i = 0; i < this.length; i++) if((this[i].isComplete) && (this[i]!=null)){

						//for all results of current spider
						for ( var i2 = 0; i2 < this[i].results.length; i2++) {
							this[i].results[i2].departure.airports=fillNameforAirportArray(this[i].results[i2].departure.airports);
							this[i].results[i2].return.airports=fillNameforAirportArray(this[i].results[i2].return.airports);
							this.results.push(this[i].results[i2]);
						}

						//free the memory
						this[i] = null;
					}

					return true;
				} catch (e) {
					this.results = [];
					return false;
				}

			},

			/**
			 * Get the count of spiders that are completed
			 * @return the count, -1 if error
			 */
			getCompletedCount : function() {
				var retVal = 0;

				try {
					for ( var i = 0; i < this.length; i++) {
						if (this[i]==null)
							retVal++;
					}

					return retVal;
				} catch (e) {
					return -1;
				}
			},

			/**
			 * Get the progress 
			 * @return the progress in percentage, -1 if error
			 */
			getProgress : function() {
				var retVal = 0;

				try {
					retVal = this.getCompletedCount();
					return (100 / (this.length / retVal));
				} catch (e) {
					return -1;
				}
			}

		});