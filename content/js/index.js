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
 * ***** END LICENSE BLOCK ******/

// ids in the xul file
{
	extensionId = "fabrizio.antonangeli@gmail.com";
	GoogleFinanceConverterFrameId = "GoogleFinanceConverterFrame";
	CurrencyMLId = "CurrencyML";
	departureStopsCtrlId = "DepartureStops";
	returnStopsCtrlId = "ReturnStops";
	progressMeterId="GeneralProgress";
	findDestinationCtrlId="FindDestinationCB";
	destinationAirportId="DestinationAirportTB";
	destinationAirportSpanId="DestinationAirportSpan";
	travelTypeCtrlId="TravelTypeCtrl";
	originAirportCtrlId="OriginAirportTB";
	departureCtrlId="DepartureDP";
	returnCtrlId="ReturnDP";
	destinationAirportCtrlId="DestinationAirportTB";
	originNearbyAirportsCtrlId="OriginNearbyAirportsCB";
	returnNearbyAirportsCtrlId="ReturnNearbyAirportsCB";
	travelersNumberCtrlId="TravelersNumberTB";
	timeEstimatedValueCtrlId="TimeEstimatedValueCtrl";
	resultsTreeCtrlId="resultsTree";
	maxSpidersNumberCtrlId="MaxSpidersNumberCtrl";
	spidersStatusCtrlId="SpidersStatusCtrl";
	DestinationFindEveryCtrlId="DestinationFindEvery";
	stringbundleCtrlId='lowcosttravel-strings';
}

iataAirportsDBPath="content/IataAirports.sqlite";
iataAirlinesDBPath="content/IataAirlines.sqlite";

searchSettings=new SearchSettings();
spiders=new SpidersArray();
googleFinanceCurrencyConverter=new GoogleFinanceCurrencyConverter("googleFinanceCurrencyConverter", null);

stringbundleCtrl=document.getElementById(stringbundleCtrlId);

/**
 * average of time requested by a spider
 */
estimatedTimePerSpider=null;

/**
 * interface for the tree
 */
treeView = {
	rowCount : 1000,
	getCellText : function(row, column) {
		var Result = spiders.results[row];

		if (column.id == "Departure")
			return PrintArrayOfDate(Result.departure.dates, stringbundleCtrl.getString(
							'CompleteDateFormat'));
		if (column.id == "Return")
			return PrintArrayOfDate(Result.return.dates, stringbundleCtrl.getString(
							'CompleteDateFormat'));
		if (column.id == "DepartureAirports")
			return Result.departure.airports;
		if (column.id == "ReturnAirports")
			return Result.return.airports;
		if (column.id == "DepartureAirline")
			return Result.departure.airlines;
		if (column.id == "ReturnAirline")
			return Result.return.airlines;
		if (column.id == "Price")
			return Math.round(eval(Result.price)
					* googleFinanceCurrencyConverter.value);
		if (column.id == "Site")
			return Result.domain;
		if (column.id == "BookingLink")
			return Result.bookingLink;
		if (column.id == departureStopsCtrlId)
			return Result.departure.stops;
		if (column.id == returnStopsCtrlId)
			return Result.return.stops;
		if (column.id == "Id")
			return row;
		return "";
	},
	setTree : function(treebox) {
		this.treebox = treebox;
	},
	isContainer : function(row) {
		return false;
	},
	isSeparator : function(row) {
		return false;
	},
	isSorted : function() {
		return false;
	},
	getLevel : function(row) {
		return 0;
	},
	getImageSrc : function(row, col) {
		return null;
	},
	getRowProperties : function(row, props) {
	},
	getCellProperties : function(row, col, props) {
	},
	getColumnProperties : function(colid, col, props) {
	}
};












/**
 * Open a url in a new tab and select it
 * 
 * @param url
 *            string the url
 * @return true if ok, false on error
 */
function UrlInNewSelectedTab(url) {
	var gBrowser;
	var wm;
	var mainWindow;
	
	try {
		wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
		                		.getService(Components.interfaces.nsIWindowMediator);
		mainWindow = wm.getMostRecentWindow("navigator:browser");
		gBrowser = mainWindow.getBrowser();
		gBrowser.selectedTab = gBrowser.addTab(url);
		return true;
	} catch (e) {
		return false;
	}
}

/**
 * Read a array of date and print it in a string
 * @param arr array of date
 * @param format the format for printing date
 * @return a string with all date in the array
 */
function PrintArrayOfDate(arr, format) {
	var RetVal = "";

	for ( var i = 0; i < arr.length; i++) {
		if (i > 0)
			RetVal += ",";
		RetVal += arr[i].toLocaleFormat(format);
	}

	return RetVal;
}

/**
 * funzione richiamata dal tree per l'ordinamento
 * @param column la colonna chiamante
 */
function sort(column) {
	var columnName;
	var tree = document.getElementById(resultsTreeCtrlId);

	var order = tree.getAttribute("sortDirection") == "ascending" ? 1 : -1;
	// if the column is passed and it's already sorted by that column, reverse
	// sort
	if (column) {
		columnName = column.id;
		if (tree.getAttribute("sortResource") == columnName) {
			order *= -1;
		}
	} else {
		columnName = tree.getAttribute("sortResource");
	}
	

	function columnSort(a, b) {
		var aVal = "";
		var bVal = "";

		try {
			// imposto aVal e bVal
			{

				if (columnName == "Departure") {
					aVal = a.departure.dates[0];
					bVal = b.departure.dates[0];
				} else if (columnName == "Return") {
					aVal = a.return.dates[0];
					bVal = b.return.dates[0];
				} else if (columnName == "DepartureAirports") {
					aVal = a.departure.airports[0];
					bVal = b.departure.airports[0];
				} else if (columnName == "ReturnAirports") {
					aVal = a.return.airports[0];
					bVal = b.return.airports[0];
				} else if (columnName == "DepartureAirline") {
					aVal = a.departure.airlines[0];
					bVal = b.departure.airlines[0];
				} else if (columnName == "ReturnAirline") {
					aVal = a.return.airlines[0];
					bVal = b.return.airlines[0];
				} else if (columnName == "Price") {
					aVal = a.price;
					bVal = b.price;
				} else if (columnName == "Site") {
					aVal = a.domain;
					bVal = b.domain;
				} else if (columnName == departureStopsCtrlId) {
					aVal = a.departure.stops;
					bVal = b.departure.stops;
				} else if (columnName == returnStopsCtrlId) {
					aVal = a.return.stops;
					bVal = b.return.stops;
				} else {
					return 0;
				}
			}

			// effettuo l'ordinamento
			{
				if ((aVal) > (bVal))
					return 1 * order;
				if ((aVal) < (bVal))
					return -1 * order;
				return 0;
			}
		} catch (e) {
			return 0;
		}

	}
	spiders.results.sort(columnSort);

	// setting these will make the sort option persist
	tree.setAttribute("sortDirection", order == 1 ? "ascending" : "descending");
	tree.setAttribute("sortResource", columnName);
	tree.view = treeView;
	// set the appropriate attributes to show to indicator
	var cols = tree.getElementsByTagName("treecol");
	for ( var i = 0; i < cols.length; i++) {
		cols[i].removeAttribute("sortDirection");
	}
	document.getElementById(columnName).setAttribute("sortDirection",
			order == 1 ? "ascending" : "descending");
}

/**
 * Start the loading of the frames
 */
function doSearch() {	 
	// pre-check
	{
		if (document.getElementById('DepartureDP').dateValue
				.toLocaleFormat("%Y%m%d") > document.getElementById('ReturnDP').dateValue
				.toLocaleFormat("%Y%m%d")) {

			alert(stringbundleCtrl.getString(
					'InputErrors.DepartureGtReturn'));
			return;
		}
		if (($('#OriginAirportTB').val().length) != 3) {
			alert(stringbundleCtrl.getString(
					'InputErrors.DepartureAirportCodeWrong'));
			return;
		}
		if (($('#DestinationAirportTB').val().length) != 3) {
			alert(stringbundleCtrl.getString(
					'InputErrors.ReturnAirportCodeWrong'));
			return;
		}
	}
	
	try {
		$('#'+spidersStatusCtrlId).show('slow');
		
		$('#'+timeEstimatedValueCtrlId).empty();

		// start searching
		googleFinanceCurrencyConverter.to=document.getElementById(CurrencyMLId).value;
		googleFinanceCurrencyConverter.start();
		
		googleFinanceCurrencyConverter.addEvent("onComplete", function(){
			spiders=new SpidersArray(readSearchSettings());
			/* TODO eliminare questa riga (è solo di debug) */
			spiders.start();
			spiders.addEventToAll("onComplete", function() {
				if (estimatedTimePerSpider==null) {
					estimatedTimePerSpider=((( new Date() ).getTime())-this._startTime);
				} else {
					estimatedTimePerSpider=((estimatedTimePerSpider+((( new Date() ).getTime())-this._startTime))/2);
				}
				
				updateResults();
				
				spiders.startNext();
			});
		});
	} catch (e) {
		alert(stringbundleCtrl.getString("Errors.Generic.WithDetails")+" "+e);
	}
}
 
/**
 * Update the results and the progressmeter
 * @return true if ok, false on error 
 */
function updateResults() {
	var tmpProgress=0;
	 
	try {
		spiders.getResults();
		tmpProgress=spiders.getProgress();

		// update the treeview
		treeView.rowCount = (spiders.results.length - 1);
		document.getElementById(resultsTreeCtrlId).view = treeView;
		
		// update the progress meter
		$('#'+progressMeterId)[0].value=tmpProgress;
		
		// update estimated time
		$('#'+timeEstimatedValueCtrlId).text(((estimatedTimePerSpider*(spiders.length-spiders.getCompletedCount()))/1000)/60);
		
		return true;
	} catch (e) {
		return false;
	}
}

/**
 * Find a airport name by IataCode
 * @param iataCode string the code to find
 * @return array of string airport name, false on error 
 */
function findAirportbyIataCode(iataCode) {
 var retVal=[];
 var em;
 var file;
 var storageService;
 var statement;

 try {
	 em = Components.classes["@mozilla.org/extensions/manager;1"].
	 getService(Components.interfaces.nsIExtensionManager);
	 file = em.getInstallLocation(extensionId).getItemFile(extensionId, iataAirportsDBPath);


	 storageService = Components.classes["@mozilla.org/storage/service;1"]
	                                     .getService(Components.interfaces.mozIStorageService);
	 mDBConn = storageService.openDatabase(file); 

	 statement = mDBConn.createStatement("SELECT airport FROM tn WHERE code == :iataCode"); 
	 statement.bindStringParameter(0, iataCode);

	 while (statement.executeStep()) {
		 retVal.push(statement.getUTF8String(0));
	 }

	 return retVal;
 } catch (e) {
	 return false;
 }
} 

/**
 * Read IataCode of all cities
 * @return array of iata codes, false on error 
 */
function getIataCodesOfAllCities() {
	var retVal=[];
	var em;
	var file;
	var storageService;
	var statement;

	try {
		em = Components.classes["@mozilla.org/extensions/manager;1"].
		getService(Components.interfaces.nsIExtensionManager);
		file = em.getInstallLocation(extensionId).getItemFile(extensionId, iataAirportsDBPath);


		storageService = Components.classes["@mozilla.org/storage/service;1"]
		                                    .getService(Components.interfaces.mozIStorageService);
		mDBConn = storageService.openDatabase(file); 

		statement = mDBConn.createStatement("SELECT tn.code FROM tn LEFT JOIN iata "+
				"ON tn.code==iata.iata "+
		"WHERE iata.iata IS NULL"); 

		while (statement.executeStep()) {
			retVal.push(statement.getUTF8String(0));
		}

		return retVal;
	} catch (e) {
		return false;
	}
} 

/**
 * Find airlines name by IataCode
 * @param iataCode string the code to find
 * @return array of string airline name, false on error 
 */
function findAirlinesbyIataCode(iataCode) {
	var retVal=[];
	var em;
	var file;
	var storageService;
	var statement;

	try {
		em = Components.classes["@mozilla.org/extensions/manager;1"].
		getService(Components.interfaces.nsIExtensionManager);
		file = em.getInstallLocation(extensionId).getItemFile(extensionId, iataAirlinesDBPath);


		storageService = Components.classes["@mozilla.org/storage/service;1"]
		                                    .getService(Components.interfaces.mozIStorageService);
		mDBConn = storageService.openDatabase(file); 

		statement = mDBConn.createStatement("SELECT name FROM Airlines WHERE code == :iataCode"); 
		statement.bindStringParameter(0, iataCode);

		while (statement.executeStep()) {
			retVal.push(statement.getUTF8String(0));
		}

		return retVal;
	} catch (e) {
		return false;
	}
} 

/**
 * read the search settings
 * @return object SearchSettings() with all the settings readed
 */
function readSearchSettings()
{
	var searchSettings=new SearchSettings();

	searchSettings.departure.date = $('#'+departureCtrlId)[0].dateValue;
	searchSettings.destination.date = $('#'+returnCtrlId)[0].dateValue;		
	searchSettings.departure.airport.iataCode = $('#'+originAirportCtrlId).val();
	searchSettings.destination.airport.iataCode = ($('#'+findDestinationCtrlId)[0].checked)?null:$('#'+destinationAirportCtrlId).val();
	searchSettings.departure.nearby = $('#'+originNearbyAirportsCtrlId)[0].checked;		
	searchSettings.destination.nearby = $('#'+returnNearbyAirportsCtrlId)[0].checked;
	searchSettings.travelers = $('#'+travelersNumberCtrlId).val();
	searchSettings.type=$('#'+travelTypeCtrlId).val();
	searchSettings.maxSpidersNumber=$('#'+maxSpidersNumberCtrlId).val();	
	searchSettings.destination.airport.findEvery=($('#'+findDestinationCtrlId)[0].checked)?$('#'+DestinationFindEveryCtrlId).val():null;

	return searchSettings;
}
