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
	 
	 //constants
	 this.lineColours = {
		'B' : Cesium.Color.fromCssColorString('#b06110'),
		'C' : Cesium.Color.fromCssColorString('#ef2e24'),
		'D' : Cesium.Color.fromCssColorString('#008640'),
		'H' : Cesium.Color.fromCssColorString('#ffd203'), //yellow!
		'J' : Cesium.Color.fromCssColorString('#959ca2'),
		'M' : Cesium.Color.fromCssColorString('#98005d'),
		'N' : Cesium.Color.fromCssColorString('#231f20'),
		'P' : Cesium.Color.fromCssColorString('#1c3f95'),
		'V' : Cesium.Color.fromCssColorString('#009ddc'),
		'W' : Cesium.Color.fromCssColorString('#86cebc')
	 }
	 
	 //Cesium visualisation hooks here - to be moved into a separate unit at a later point in time
	 //This section makes the link between the agent model and how it displays on the globe.
	 //There are two ways that this can be done: overload all methods and properties that change the visualisation
	 //with ones that update Cesium directly, or alternatively, let the ABM run headless and do a screen update
	 //periodically. You could used "dirty" flags for performance.
	 //On reflection, the second method seems better.
	 //TODO:
	 this.cesiumSetup = function() {
		 //setup and initialisation for the Cesium visualisation
		 //put stations and tube agents into separate custom datasources as stations don't move
		 this._cesiumStationDataSource = new Cesium.CustomDataSource('stations');
		 this.viewer.dataSources.add(this._cesiumStationDataSource);
		 //create a datasource for the tube entities (trains)
		 this._cesiumTubeDataSource = new Cesium.CustomDataSource('trackernet');
		 this.viewer.dataSources.add(this._cesiumTubeDataSource);
		 //and we need a polylines object for the network graph
		 //this._cesiumLinksPolylines = new Cesium.PolylineCollection();
	 }
	 this.cesiumUpdate = function() {
		 console.log('ModelTrackernet::cesiumUpdate');
		 //NOTE: agents are tagged with __cesiumEntity which contains the cesium entity displayed on the globe, which allows for manipulation
		 //if this was outside the model, then pass in viewer and Model - this might be a good way of separating
		 //the model from the visualisation as ModelTrackernet should contain no Cesium code at all.
		 //NOTE: what about coordinate conversions? Surely, you need Cesium for that?
		 
		 //for all agents (TODO: how about a dirty flag on each class and on each individual agent?)
		 for (var c in this._agents) { //agent class name c
			console.log('ModelTrackernet::cesiumUpdate agent class='+c);
			 var agents = this._agents[c];
			 for (var i=0; i<agents.length; i++) {
				 var a = agents[i]; //this is the agent
				 if (!a.hasOwnProperty('__cesiumEntity')) {
					 //this agent has no Cesium object associated with it, so we need to create one
					 if (c=='station') {
						 //create entity in Cesium and maintain a link between the entity and the MapTubeABM
						 a.__cesiumEntity = this._cesiumStationDataSource.entities.add(
						 {
							 name : a.name,
							 position: new Cesium.Cartesian3(a.position.x,a.position.y,a.position.z),
							 cylinder : {
								 length : 100.0,
								 topRadius : 200.0,
								 bottomRadius : 200.0,
								 dimensions : new Cesium.Cartesian3(200.0, 200.0, 100.0),
								 material : Cesium.Color.WHITE
							}
						}); 
					 }
					 else if (c=='tube') {
						 //create entity in Cesium and maintain a link between the entity and the MapTubeABM
						 a.__cesiumEntity = this._cesiumTubeDataSource.entities.add(
						 {
							 name : a.name,
							 position: new Cesium.Cartesian3(a.position.x,a.position.y,a.position.z),
							 box : {
								 dimensions : new Cesium.Cartesian3(200.0, 200.0, 150.0),
								 material : Cesium.Color.fromCssColorString(this.lineCodeToCSSColour(a.lineCode))
							}
						}); 
					 }
				 }
				 //dirty bit test?
				 
			 }
		 }
		 
		 //for all links
		 //TODO: I think the only way of doing this might be to make the whole graph class dirty and recreate it rather than
		 //individual links - links don't change that often
		 //NOTE: I'm using the graph class to determine the colour of the link - you could colour them individually if you wanted
		 for (var c in this._graphs) { //graph class c
			console.log('ModelTrackernet::cesiumUpdate graph class='+c);
			var lineColour = this.lineColours[c.charAt(5)]; //the class is line_B, line_C etc
			var G = this._graphs[c];
			//We're using _cesiumLinksPolylines on each graph class as a holder for the network polylines for that class.
			//In other words, if the links get changed, then the whole graph is re-created. This can be changed quite easily if it's
			//a performance problem.
			if (!G.hasOwnProperty('__cesiumLinksPolylines'))
				G._cesiumLinksPolylines = new Cesium.PolylineCollection();
			//console.log("Graph: ",G);
			for (var i=0; i<G._edges.length; i++) {
				var e = G._edges[i];
				//Cesium specific
				var fromAgent = e._fromAgent;
				var toAgent = e._toAgent;
				G._cesiumLinksPolylines.add({
					positions : [
						new Cesium.Cartesian3(fromAgent.position.x, fromAgent.position.y, fromAgent.position.z),
						new Cesium.Cartesian3(toAgent.position.x, toAgent.position.y, toAgent.position.z),
					],
					width: 1,
					material : new Cesium.Material({
						fabric : {
							type : 'Color',
							uniforms : {
								color : lineColour
							}
						}
					})
				});
			}
			this.viewer.scene.primitives.add(G._cesiumLinksPolylines); //one per graph class
		 }
		 
	 }
	 //End of Cesium visualisation hooks
	 
	 
	 
	 //properties
	 this.viewer = null; //need to set this as a link to the Cesium instance
	 
	 
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
	 this.cesiumSetup(); //Cesium visualisation initialisation
	 
	 //TODO: add logic here which separates the visualisation from the ABM itself i.e. the model can
	 //run headless, but there are overloads on agent visualisation properties which tie in with Cesium.
	 //This can be made into a separate import later.
	 //Need: Position, Transform, Size, Colour
	 
	 //TODO: this explicit creation of the link between the ABM and Cesium needs to change - you should just create the agent and set the properties
	 
	 //load stations and create agents (TODO: this should be a MapTube datasource)
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
			var stnAgent = this.createAgents(1,'station')[0]; //create agent of class "station", which is used by the visualisation
			stnAgent.name=stationCode;
			var pos = Cesium.Cartesian3.fromDegrees(lon, lat, 0.0); //TODO: this needs to be half the height
			stnAgent.setXYZ(pos.x,pos.y,pos.z);
		 }
	 }.bind(this));
	 
	 //now we have the station nodes, make the relevant links between them to build the network
	 MapTube.data.core.acquireJSON('tube-network.json',function(json) {
		 //console.log(json);
		 //"B" : { "0" : [ { "o": "ELE", "d": "LAM", "r": 120 },
		 for (lineCode in json) {
			 //var lineColour = this.lineColours[lineCode];
			 var lineData = json[lineCode];
			 for (var dir = 0; dir<2; dir++)
			 {
				var links = lineData[dir];
				for (var i=0; i<links.length; i++) {
					var link = links[i];
					var e = this.createLink('line_'+lineCode,link.o,link.d);
					e.weight = link.r;
					e.direction = dir;
					//console.log('CreateLink: ',lineCode,link,e);
				}
			 }
		 }
		 //console.log(this._linksPolylines);
		 //this._linksPolylines.material = Cesium.Color.RED;
		 //this.viewer.scene.primitives.add(this._linksPolylines);

	 }.bind(this));
	 
	 
	 
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
			//create agent of class "tube" which is used by the visualisation
			var tubeAgent = this.createAgents(1,'tube')[0]; //TODO: make this more elegant for cases when you only want one created
			tubeAgent.name=agentName;
			tubeAgent.lineCode=lineCode;
			var pos = Cesium.Cartesian3.fromDegrees(lon, lat);
			tubeAgent.setXYZ(pos.x,pos.y,pos.z);
		}
		this.cesiumUpdate(); //HACK, call the update now for testing - you need this to create the entities on the globe
	 }.bind(this));
	 
	 
 }
 ModelTrackernet.prototype.step = function(ticks) {
	 //TODO: logic for getting new data and moving agents around here
	 //ticks in seconds
	 
 }
 ModelTrackernet.prototype.updateScene = function() {
	 //TODO: visualisation update here i.e. link to globe
 }