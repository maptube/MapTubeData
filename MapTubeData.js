/**
* MapTubeData.js
* Richard Milton 21 April 2017
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

//callback is ([csv object lines],xmlhttp object)
//xmlhttp.getResponseHeader("Content-Type") to get a header back from it
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
			callback.call(this,MapTube.data.core.parseCSV(this.responseText),xmlhttp);
		}
	}
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

MapTube.data.core.acquireJSON = function (url,callback) {
	//make a request for a json file
	var xmlhttp;
	if (window.XMLHttpRequest) {
		xmlhttp = new XMLHttpRequest();
	}
	else {
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange = function () {
		if ((this.readyState==4) && (this.status==200)) {
			//parse json and return formatted object
			var json = JSON.parse(this.responseText);
			callback.call(this,json,xmlhttp);
		}
	}
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

/*
 * parseYYYYMMDD_HHMMSS Parse a time from a filename in the form 20170503_101558 and return a Date object
 * TODO: could do with some error checking and safety
 * @param ft string time in the form YYYYMMDD_HHMMSS
 * @returns A Date object, or null if invalid
 */
MapTube.data.core.parseYYYYMMDD_HHMMSS = function(ft) {
	//YYYYMMDD_HHMMSS
	var year=parseInt(ft.substring(0,4));
	var month=parseInt(ft.substring(4,6));
	var day=parseInt(ft.substring(6,8));
	var hour=parseInt(ft.substring(9,11));
	var minute=parseInt(ft.substring(11,13));
	var second=parseInt(ft.substring(13,15));
	//NOTE: month-1 as January=0 in JS Date, but January=1 in the string parameter
	var d = new Date(year,month-1,day,hour,minute,second,0);
	return d;
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

//async, returns immediately, callback returning (csv data, filetime)
MapTube.data.TfL.underground.positions = function (callback) {
	var uri = 'http://loggerhead.casa.ucl.ac.uk/api.svc/f/trackernet?pattern=trackernet_*.csv';
	MapTube.data.core.acquireCSV(uri,function(csv,xmlhttp) {
		//Content-Disposition: attachment; filename="trackernet_20170502_215400.csv"
		var hdr = xmlhttp.getResponseHeader('Content-Disposition');
		var filename = '', file_dt=null;
		var pos = hdr.indexOf('filename=');
		if (pos>=0) {
			filename = hdr.substring(pos+10,pos+40); //trackernet_yyyymmdd_hhmmss.csv
			file_dt = MapTube.data.core.parseYYYYMMDD_HHMMSS(filename.substring(11,26));
		}
		callback.call(this,csv,file_dt);
	});
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
