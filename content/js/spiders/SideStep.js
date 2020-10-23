/**
 * SideStep spider
 */
SideStep = new Class(
		{
			Extends :Spider,

			_domain :"sidestep.com",
			_url :"http://www.sidestep.com",
			_reloadCount:0,

			_queryUrl : function() {
				var tmpUrl;
			
				this.parent();
				
				tmpUrl=this._url
				+ "/flights?fid=&travelers="
				+ this._searchSettings.travelers
				+ "&cabin=e&return_date="
				+ this._searchSettings.destination.date
						.toLocaleFormat("%m/%d/%Y")
				+ "&return_time=a&depart_date="
				+ this._searchSettings.departure.date
						.toLocaleFormat("%m/%d/%Y")
				+ "&depart_time=a&origincode="
				+ this._searchSettings.departure.airport.iataCode
				+ "/25465&origin=ROM&destcode="
				+ this._searchSettings.destination.airport.iataCode
				+ "/36014&destination="
				+ this._searchSettings.destination.airport.iataCode
				+ "&action=doflights";
				
				if(this._searchSettings.departure.nearby) tmpUrl+="&nearbyO=true";
				if(this._searchSettings.destination.nearby)tmpUrl+="&nearbyD=true";
				if(this._searchSettings.type=="OneWay")tmpUrl+="&oneway=y"; else tmpUrl+="&oneway=n";

				return tmpUrl;
			},


			read : function(e) {
				var tmpRes = null;
				var tmpFare = null;
				var _r = null;
				var _filtered = null;
				var _filteredLength = null;
				var tmp1 = null;

				

				// pre-check
				{
					this.parent();
	
					// reloadCount
					if (this._reloadCount == 0) {
	
						// setting reloadCount
						this._reloadCount++;
	
						return true;
					}
				}
	
				try {
					_r = window.frames[this._idFrame]._r;
					_filtered = window.frames[this._idFrame]._filtered;
					_filteredLength = _filtered.length;

	
					// read all the results
					for ( var i = 0; i < _filteredLength; i++) {						
						tmpRes = new Result();
						tmpFare = _r[_filtered[i]];
	
						tmpRes.price = tmpFare._prices;
	
						// airports
						{
							tmpRes.departure.airports = this._readDepartureAirports(tmpFare);
							if (this._searchSettings.type=="RoundTrip")tmpRes.return.airports = this._readReturnAirports(tmpFare);
						}
						
						tmpRes.domain = this._domain;
	
						// airlines
						{
							tmpRes.departure.airlines = this._readSideStepAirlines(tmpFare._airline[0]);
							if (this._searchSettings.type=="RoundTrip") tmpRes.return.airlines = this._readSideStepAirlines(tmpFare._airline[1]);
						}
	
						// TODO H testare il cambio d'orario della mezzanotte
						// departure dates
						tmpRes.departure.dates=this._readSideStepDate(tmpFare, 0);		
	
						// Return dates
						if (this._searchSettings.type=="RoundTrip") tmpRes.return.dates=this._readSideStepDate(tmpFare, 1);
	
						// stops
						{
							tmpRes.departure.stops = tmpFare._stops[0];
							if (this._searchSettings.type=="RoundTrip") tmpRes.return.stops = tmpFare._stops[1];
						}
	
						tmpRes.bookingLink = this._url + tmpFare._p[0]._bookurl;

						this.results.push(tmpRes);
					}
					
					this.onComplete();
	
					return true;
				} catch (e) {		
					alert(sprintf(this._stringbundleset
							.getString("Errors.Spider.Read"), this._domain, e));
				}
			},
			
			/**
			 * Read the time in the sidestep page and give it in a array
			 * @param stringa the time in the page, es. "3:10p"
			 * @return a array like: {0=hours, 1=minutes}
			 */
			_readSideStepTime:function(stringa) {
				var RetVal = Array();
				var pivot = stringa.indexOf(":");
				var sl = stringa.length;

				RetVal[0] = eval(stringa.substr(0, pivot));
				RetVal[1] = eval(stringa.substr(pivot + 1, 2));

				if (stringa.substr(sl - 1, 1) == "p") {
					RetVal[0] += 12;
				}

				return RetVal;
			},
			
			/**
			 * Read the date in the sidestep page and give it in a array
			 * @param sideStepFare object the airfare of sidestep
			 * @param index int the index to examinate
			 * @return array of date
			 */
			_readSideStepDate:function(sideStepFare, index) {
				var retVal = [];
				var tmp1=null;

				tmp1 = this._readSideStepTime(sideStepFare._sLeave[index]);
				retVal.push(new Date(
						sideStepFare._flexLeave[index].substr(0, 4),
						sideStepFare._flexLeave[index].substr(4, 2),
						sideStepFare._flexLeave[index].substr(6, 2),
						tmp1[0], tmp1[1]));
				
				tmp1 = this._readSideStepTime(sideStepFare._sArrive[index]);
				retVal.push(new Date(
						sideStepFare._flexLeave[index].substr(0, 4),
						sideStepFare._flexLeave[index].substr(4, 2),
						sideStepFare._flexLeave[index].substr(6, 2),
						tmp1[0], tmp1[1]));

				return retVal;
			},

			/**
			 * Read the airlines from sidestep
			 * @param airlinesString string the airline strin in sidestep
			 * @return array of airlines
			 */
			_readSideStepAirlines:function(airlinesString) {
				var TmpArr = airlinesString.split(",");
				var RetVal = [];
				var tmpBuff;

				for ( var i2 = 0; i2 < TmpArr.length; i2++) {
					if (TmpArr[i2] != "MULT") {
						tmpBuff=new Airline();						
						tmpBuff.iataCode=TmpArr[i2];
						
						RetVal.push(tmpBuff);
					}
				}

				return RetVal;
			},
			
			/**
			 * Read the departure airports for a single fare
			 * @param sideStepFare object the airfare of sidestep
			 * @return array of Airport()
			 */
			_readDepartureAirports:function(sideStepFare){
				var retVal=[];
				var tmp;
				
				for ( var i = 0; i < sideStepFare._from.length; i++) {
					tmp=new Airport();
					tmp.iataCode=sideStepFare._from[i];
					retVal.push(tmp);
				}				
				
				if (this._searchSettings.type=="OneWay") {
					tmp=new Airport();
					tmp.iataCode=sideStepFare._to;
					retVal.push(tmp);
				}
				
				return retVal;
			},
			
			/**
			 * Read the return airports for a single fare
			 * @param sideStepFare object the airfare of sidestep
			 * @return array of Airport()
			 */
			_readReturnAirports:function(sideStepFare){
				var retVal=[];
				var tmp;
				
				for ( var i = 0; i < sideStepFare._to.length; i++) {
					tmp=new Airport();
					tmp.iataCode=sideStepFare._to[i];
					retVal.push(tmp);
				}
				
				return retVal;
			}

		});
