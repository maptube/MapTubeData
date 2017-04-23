/*
 * model_trackernet.js
 * Richard Milton 21 April 2017
 * Model of London Underground network using the real-time Trackernet API
 * Uses MapTube ABM and MapTube Data libraries for the modelling and data functions.
 * This is a Cesium version of the model, but all Cesium specific code is held in setup and updateScene.
 */
 
 ModelTrackernet.prototype = new MapTube.ABM.Model(); //inherit from MapTube's ABM Model class
 ModelTrackernet.prototype.constructor=MapTube.ABM.Model;
 function ModelTrackernet() {
	 console.log('ModelTrackernet::constructor');
	 //MapTube.ABM.Model.call(this);
	 
	 //properties
	 this.viewer = null; //need to set this as a link to the Cesium instance
	 this.tubeDataSource = null;
	 
	 //private methods
	 /*
	  * @name lineCodeToCSSColour Take line code char (BCDHJMNPVW) and return the official hex colour
	  * @param code Line code character (BCDHJMNPVW)
	  * @returns a hex colour as a CSS colour string i.e. N is #231f20 which is black
	  */
	this.lineCodeToCSSColour = function (code) {
		var lineBColour = '#b06110',
			lineCColour = '#ef2e24',
			lineDColour = '#008640',
			lineHColour = '#ffd203', //this is yellow!
			lineJColour = '#959ca2',
			lineMColour = '#98005d',
			lineNColour = '#231f20',
			linePColour = '#1c3f95',
			lineVColour = '#009ddc',
			lineWColour = '#86cebc';
			//lineY colour?
		switch (code) {
			case 'B': return lineBColour; //Bakerloo
			case 'C': return lineCColour; //Central
			case 'D': return lineDColour; //District
			case 'H': return lineHColour; //Hammersmith and City and Circle
			case 'J': return lineJColour; //Jubilee
			case 'M': return lineMColour; //Metropolitan
			case 'N': return lineNColour; //Northern
			case 'P': return linePColour; //Piccadilly
			case 'V': return lineVColour; //Victoria
			case 'W': return lineWColour; //Waterloo and City
			default: return '#ffffff'; //white
		}
	};
	//
	/*
	 * @name positionAgent (From GeoGL)
	 * @param agent
	 * @param lineCode
	 * @param timeToStation
	 * @param nextStation
	 * @param direction
	 * @returns true on success, false on failure
	 */
	this.positionAgent = function(agent,lineCode,timeToStation,nextStation,direction)
	{
		//TODO: from GeoGL
/*		var success = false;
		std::vector<ABM::Agent*> agent_d = _agents.With("name",NextStation); //destination node station
		if (agent_d.size()>0) {
			if (TimeToStation<=0) {
				//Agent is currently "At Platform", so we don't have a to node - set to=from and a dummy velocity plus direction
				//and let the animate code figure out the next station. We need to do this, otherwise tubes are going to sit in
				//the same location until the next data frame
				ABM::Agent* fromNode = agent_d.front();
				agent->Set<ABM::Agent*>("fromNode", fromNode);
				agent->Set<ABM::Agent*>("toNode", fromNode); //yes, really fromNode
				agent->Set<float>("v", 5); //put in a fake velocity - 5ms-1 should do it - all we need to do is to trigger the arrived at station code in the animate loop
				agent->Set<int>("direction", Direction);
				agent->Set<std::string>("lineCode", strLineCode);
//			agent->SetColour(LineCodeToVectorColour(LineCode)); //NO! Colour only set on hatch
				glm::dvec3 P = fromNode->GetXYZ();
				agent->SetXYZ(P.x,P.y,P.z); //position agent on its toNode
				Success=true;
			}
			else {
				std::vector<ABM::Link*> links = agent_d.front()->InLinks();
				for (std::vector<ABM::Link*>::iterator itLinks = links.begin(); itLinks!=links.end(); ++itLinks)
				{
					ABM::Link* l = *itLinks;
					if ((l->Get<std::string>("lineCode")==strLineCode) && (l->Get<int>("direction")==Direction))
					{
						agent->Set<ABM::Agent*>("fromNode", l->end1);
						agent->Set<ABM::Agent*>("toNode", l->end2);
						//agent->Set<float>("v", l->Get<float>("velocity")); //use pre-created velocity for this link
						agent->Set<int>("direction", l->Get<int>("direction"));
						agent->Set<std::string>("lineCode", strLineCode);
//					agent->SetColour(LineCodeToVectorColour(LineCode)); //NO! Colour only set on hatch
						//interpolate position based on runlink and time to station
						float dist = l->end2->Distance(*(l->end1));
						//NOTE: dist/TimeToStation is wrong for the velocity - this is for the full link distance, but we're using the time to station to position based on velocity (runlink and distance)
						//float velocity = dist/(float)TimeToStation; //calculate velocity needed to get to the next node when it says we should
						float runlink = l->Get<float>("runlink");
						float velocity = dist/runlink;
						agent->Set<float>("v",velocity); //this is the timetabled speed for this runlink
						if (TimeToStation>=runlink) {
							//cerr<<"Error: TimeToStation greater than runlink! "<<agent->Name<<endl;
							//in the annoying case when the time to station is greater than the time it's supposed to take to get there, position at the fromNode
							glm::dvec3 Pfrom = l->end1->GetXYZ();
							agent->SetXYZ(Pfrom.x,Pfrom.y,Pfrom.z);
						}
						else {
							glm::dvec3 Pfrom = l->end1->GetXYZ();
							glm::dvec3 Pto = l->end2->GetXYZ();
							glm::dvec3 delta = Pto-Pfrom;
							double scale = TimeToStation/runlink;
							agent->SetXYZ(Pto.x-scale*delta.x,Pto.y-scale*delta.y,Pto.z-scale*delta.z); //linear interpolation X seconds back from target node based on runlink
						}
						//agent->Face(*agent->Get<ABM::Agent*>("toNode")); //put the face last as we need the position
						agent->Face(*l->end2);
						Success=true;
						break;
					}
				}
			}
			//if !Success, then do it again, but relax the direction? Would cover situation where agent has got to the end of the line and turned around
			//you could always do this yourself though
		}
		if ((Success)&&(LineCode=='V')) std::cout<<"PositionAgent "<<agent->Name<<" fromNode="<<agent->Get<ABM::Agent*>("fromNode")->Name
			<<" toNode="<<agent->Get<ABM::Agent*>("toNode")->Name<<" TimeToStn="<<TimeToStation
			<<" Direction="<<Direction<<" v="<<agent->Get<float>("v")<<std::endl;
		return Success;
*/
	};
	//
 }
 ModelTrackernet.prototype.setup = function () {
	 console.log('ModelTrackernet::setup');
	 //TODO: initialisation here
	 
	 //TODO: add logic here which separates the visualisation from the ABM itself i.e. the model can
	 //run headless, but there are overloads on agent visualisation properties which tie in with Cesium.
	 //This can be made into a separate import later.
	 //Need: Position, Transform, Size, Colour
	 
	 //TODO: this explicit creation of the link between the ABM and Cesium needs to change - you should just create the agent and set the properties
	 
	 //create a datasrouce and load stations (TODO: this should be a MapTube datasource)
	 this.stationDataSource = new Cesium.CustomDataSource('stations');
	 this.viewer.dataSources.add(this.stationDataSource)
	 MapTube.data.core.acquireCSV('station-codes.csv',function(data) {
		 for (var i=0; i<data.length; i++) {
			//#code,NPTGCode,lines,lon,lat,name
			//ACT,9400ZZLUACT1,DP,-0.28025120353611,51.50274977300050,Acton Town
			var stationCode = data[i]['#code']; //OK, I know it needs to change
			var lon = MapTube.data.safeParseFloat(data[i],'lon');
			var lat = MapTube.data.safeParseFloat(data[i],'lat');
			var stationName = data[i].name;
			if (isNaN(lat)||isNaN(lon)) continue;
			//console.log("Station: ",stationCode,lon,lat,stationName);
			var stnAgent = this.createAgents(1,'node')[0];
			stnAgent.name=stationCode;
			var pos = Cesium.Cartesian3.fromDegrees(lon, lat);
			stnAgent.setXYZ(pos.x,pos.y,pos.z);
			
			//create entity in Cesium and maintain a link between the entity and the MapTubeABM
			stnAgent._cesiumEntity = this.stationDataSource.entities.add(
			{
				name : data[i].name,
				position: Cesium.Cartesian3.fromDegrees(lon, lat, 0.0), //TODO: this needs to be half the height
				cylinder : {
					length : 100.0,
					topRadius : 200.0,
					bottomRadius : 200.0,
					dimensions : new Cesium.Cartesian3(200.0, 200.0, 100.0),
					material : Cesium.Color.WHITE
				}
			});
		 }
	 }.bind(this));
	 
	 //now we have the station nodes, make the relevant links between them to build the network
	 var polylines = new Cesium.PolylineCollection();
//polylines.add({
//  positions : Cesium.Cartesian3.fromDegreesArray([
//    -75.10, 39.57,
//    -77.02, 38.53,
//    -80.50, 35.14,
//    -80.12, 25.46]),
//  width : 2
//});
//polylines.add({
//  positions : Cesium.Cartesian3.fromDegreesArray([
//    -73.10, 37.57,
//    -75.02, 36.53,
//    -78.50, 33.14,
//    -78.12, 23.46]),
//  width : 4
//});
	 MapTube.data.core.acquireJSON('tube-network.json',function(json) {
		 //console.log(json);
		 //"B" : { "0" : [ { "o": "ELE", "d": "LAM", "r": 120 },
		 for (lineCode in json) {
			 var lineData = json[lineCode];
			 for (var dir = 0; dir<2; dir++)
			 {
				var links = lineData[dir];
				for (var i=0; i<links.length; i++) {
					var link = links[i];
					var e = this.createLink('line_'+lineCode,link.o,link.d);
					e.weight = link.r;
					e.direction = dir;
					console.log('CreateLink: ',lineCode,link,e);
					//Cesium specific
					fromAgent = this._agents.tubes[e._fromVertex.id]; //vertex id in graph is the link to the agent
					toAgent = this._agents.tubes[e._toVertex.id];
					polylines.add({
						positions : [
							new Cesium.Cartesian3(fromAgent.position.x, fromAgent.position.y, fromAgent.position.z),
							new Cesium.Cartesian3(toAgent.position.x, toAgent.position.y, toAgent.position.z),
							],
						width : 2
					})
				}
			 }
		 }

	 }.bind(this));
	 
	 
	 //create a datasource for the tube entities (trains)
	 this.tubeDataSource = new Cesium.CustomDataSource('trackernet');
	 //this.tubeDataSource.entities.add(<your entity here>)
	 this.viewer.dataSources.add(this.tubeDataSource)
	 
	 
	 //obtain latest data from API
	 MapTube.data.TfL.underground.positions(function(data) {
		//console.log(data);
		
		for (var i=0; i<data.length; i++)
		{
			//read data from http request result
			var lineCode = data[i].linecode;
			var tripnumber = data[i].tripnumber;
			var setnumber = data[i].setnumber;
			var lat=MapTube.data.safeParseFloat(data[i],'lat');
			var lon=MapTube.data.safeParseFloat(data[i],'lon');
			if (isNaN(lat)||isNaN(lon)) continue;
			var agentName = lineCode+'_'+setnumber+'_'+tripnumber;
			
			//create the agent and set his properties from the data line
			var tubeAgent = this.createAgents(1,'tube')[0]; //TODO: make this more elegant for cases when you only want one created
			tubeAgent.name=agentName;
			tubeAgent.lineCode=lineCode;
			var pos = Cesium.Cartesian3.fromDegrees(lon, lat);
			tubeAgent.setXYZ(pos.x,pos.y,pos.z);
			
			//create entity in Cesium and maintain a link between the entity and the MapTubeABM
			tubeAgent._cesiumEntity = this.tubeDataSource.entities.add(
			{
				name : data[i].name,
				position: Cesium.Cartesian3.fromDegrees(lon, lat, 0.0), //TODO: this needs to be half the height
				//position: Cesium.Cartesian3.fromDegrees(-114.0, 40.0, 300000.0),
				box : {
					dimensions : new Cesium.Cartesian3(200.0, 200.0, 100.0),
					material : Cesium.Color.fromCssColorString(this.lineCodeToCSSColour(tubeAgent.lineCode))  //was Cesium.Color.BLUE
				}
			});
		}
	 }.bind(this));
	 
 }
 ModelTrackernet.prototype.step = function(ticks) {
	 //TODO: logic for getting new data and moving agents around here
	 //ticks in seconds
	 
 }
 ModelTrackernet.prototype.updateScene = function() {
	 //TODO: visualisation update here i.e. link to globe
 }