/**
* MapTubeData.js
* Provide easy and unified access to real-time and static data e.g. tubes, buses, trains, TfL gate entry exit data, weather,
* air quality etc.
*
*/

var MapTube = MapTube || {};
MapTube.data = MapTube.data || {};
MapTube.data.core = MapTube.data.core || {};
MapTube.data.Census2011 = MapTube.data.Census2011 || {};
MapTube.data.TfL = MapTube.data.TfL || {};
MapTube.data.TfL.underground = MapTube.data.TfL.underground || {};
MapTube.data.TfL.bus = MapTube.data.TfL.bus || {};
MapTube.data.TfL.cyclehire = MapTube.data.TfL.cyclehire || {};
MapTube.data.NetworkRail = MapTube.data.NetworkRail || {};

//strip leading and trailing quotes
MapTube.data.core.stripQuotes = function (text)
{
	if (text.charAt(0) === '"' && text.charAt(text.length -1) === '"')
	{
		text = text.substr(1,text.length -2);
	}
	return text;
} 

//TODO: need to make the csv handling more resilent regarding quotes and commas - copy the geogl code
MapTube.data.core.parseCSV = function (text) {
	//Take a block of text which is a CSV file containing a single line header and return a formatted Javascript object.
	//Each line of data becomes an object with fields named according to the header field names.

	var csv = [];
	var lines = text.split(/\r?\n/);
	
	var headers = lines[0].split(','); //assumes no quotes
	for (var i=0; i<headers.length; i++) headers[i]=MapTube.data.core.stripQuotes(headers[i]);
	for (var i=1; i<lines.length; i++) {
		var line = lines[i].split(','); //assumes no quotes
		//if any columns from the header are missing then we skip them, any extra columns on the end of the line[i] are dropped
		var cmax = line.length;
		var ob = {}
		for (var c=0; c<headers.length; c++) {
			if (line[c]) line[c] = MapTube.data.core.stripQuotes(line[c]);
			if (c<cmax) {
				ob[headers[c]]=line[c]; //NOTE: this is always going to be a string
			}
			else {
				ob[headers[c]]=''; //Missing value
			}
		}
		csv.push(ob);
	}
	return csv;
}

MapTube.data.core.acquireCSV = function (url,callback) {
	//make an http get request for a csv file
	var xmlhttp;
	if (window.XMLHttpRequest) {
		xmlhttp = new XMLHttpRequest();
	}
	else {
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange = function () {
		if ((this.readyState==4) && (this.status==200)) {
			//parse CSV and return formatted object
			callback.call(this,MapTube.data.core.parseCSV(this.responseText));
		}
	}
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

/*
 * @name safeParseFloat Parse a floating point field on an object, but in a safe way.
 * @param ob
 * @param fieldName
 * @returns the value, or null
 */
MapTube.data.safeParseFloat = function(ob,fieldName)
{
	if (ob.hasOwnProperty(fieldName)) {
		return parseFloat(ob[fieldName]);
	}
	return null;
}

/*
 * Census 2001
 */

/*
 * Census 2011
 */
 
//varName i.e. KS001 TODO: table, variable etc
//also, what about MSOA, LSOA, OA etc?
MapTube.data.Census2011.variable = function (varName) {
}

//specials
//MapTube.data.Census2011.population


/*
 * Transport for London data for the Underground (Trackernet)
 */

//async, returns immediately
MapTube.data.TfL.underground.positions = function (callback) {
	var uri = 'http://loggerhead.casa.ucl.ac.uk/api.svc/f/trackernet?pattern=trackernet_*.csv';
	MapTube.data.core.acquireCSV(uri,callback);
}

MapTube.data.TfL.underground.status = function () {
}

//tube entry exit data?
//expected waits?

/*
 * Transport for London data for buses (Countdown)
 */
 
MapTube.data.TfL.bus.positions = function (callback) {
	var uri = 'http://loggerhead.casa.ucl.ac.uk/api.svc/f/countdown?pattern=countdown_*.csv';
	MapTube.data.core.acquireCSV(uri,callback);
}

/*
 * Transport for London cycle hire
 */
 
MapTube.data.TfL.cyclehire.docks = function (callback) {
	var uri = 'http://loggerhead.casa.ucl.ac.uk/api.svc/f/cyclehire?pattern=cyclehire_*.csv';
	MapTube.data.core.acquireCSV(uri,callback);
}


/*
 * Network Rail train feed
 */

MapTube.data.NetworkRail.positions = function () {
}

//weather
//airq
//aircraft
