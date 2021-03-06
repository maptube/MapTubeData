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
	
	//properties
	this.currentDataDT = null; //timestamp on the last data downloaded from the API 

	//Cesium visualisation hooks here - to be moved into a separate unit at a later point in time
	//This section makes the link between the agent model and how it displays on the globe.
	//There are two ways that this can be done: overload all methods and properties that change the visualisation
	//with ones that update Cesium directly, or alternatively, let the ABM run headless and do a screen update
	//periodically. You could use "dirty" flags for performance.
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
		//polylines are created for each Graph, with the cesium entity hooked into the graph object
		
		//define and entity that we can use for a popup to show information - it's a billboard
		var entity = this.viewer.entities.add({
			label : {
				show : false,
				showBackground : true,
				font : '14px monospace',
				horizontalOrigin : Cesium.HorizontalOrigin.LEFT,
				verticalOrigin : Cesium.VerticalOrigin.TOP,
				pixelOffset : new Cesium.Cartesian2(15, 0)
			}
		});
		
		//define a pick handler for the tubes and stations - NOTE: the tube lines get picked, but don't have an id
		var scene = this.viewer.scene;
		var model = this; //the handler binds this to the event object
		this.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
		this.handler.setInputAction(function(movement) {
			var pickedObject = scene.pick(movement.endPosition);
			if (Cesium.defined(pickedObject)&&Cesium.defined(pickedObject.id)) {
				var cartesian = viewer.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid);
				if (cartesian) {
					//console.log("PICK: ",pickedObject);
					entity.position = cartesian;
					entity.label.show = true;
					var text = pickedObject.id.name;
					var a = model.getAgent(pickedObject.id.name);
					if ((a)&&(a.className=='tube')) {
						text = pickedObject.id.name + " O: "+a.fromNode.name+" D: "+a.toNode.name;
					}
					entity.label.text = text;
				}
			}
			else {
				entity.label.show=false;
			}
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
	}
	this.cesiumUpdate = function() {
		//console.log('ModelTrackernet::cesiumUpdate');
		//NOTE: agents are tagged with __cesiumEntity which contains the cesium entity displayed on the globe, which allows for manipulation
		//if this was outside the model, then pass in viewer and Model - this might be a good way of separating
		//the model from the visualisation as ModelTrackernet should contain no Cesium code at all.
		//NOTE: what about coordinate conversions? Surely, you need Cesium for that?

		//for all agents (TODO: how about a dirty flag on each class and on each individual agent?)
		for (var c in this._agents) { //agent class name c
			//console.log('ModelTrackernet::cesiumUpdate agent class='+c);
			var agents = this._agents[c];
			for (var i=0; i<agents.length; i++) {
				var a = agents[i]; //this is the agent
				if ((a.isVisible)&&(a.isDirty))
				{
					//new agent
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
									material : Cesium.Color.WHITE //new Cesium.Color(1.0,1.0,1.0,0.75)
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
								//can't get this to work - you need a gltf model
								//polygon: {
								//	hierarchy : Cesium.Cartesian3.fromArray([-115.0, 37.0,0,
                                //                        -115.0, 32.0,0,
                                //                        -107.0, 33.0,0,
                                //                        -102.0, 31.0,0,
                                //                        -102.0, 35.0,0]),
								//	material : Cesium.Color.fromCssColorString(this.lineCodeToCSSColour(a.lineCode))
								//}
							});
						}
					}
					//existing agent with changed (dirty) attributes e.g. position, colour, size
					else
					{
						//console.log("update position: "+a.name);
						var entity = a.__cesiumEntity;
						entity.position = new Cesium.Cartesian3(a.position.x, a.position.y, a.position.z);
						//todo: update the rotation matrix as well, and at some point you might want to do the colour, size and shape?
						a.isDirty=false;
					}
				} //end of dirty bit test
			}
		}
		
		//if any agents were killed off this cycle, then we need to go through all their entities and remove them
		//NOTE: stations don't ever get killed, so we can ignore them and only look for tubes
		for (var i=0; i<this._deadAgents.length; i++)
		{
			//NOTE: _deadAgents contains the actual agent object killed off this step, not just the name
			var a = this._deadAgents[i];
			this._cesiumTubeDataSource.entities.removeById(a.name); //returns true on success
			console.log("Kill agent ",a.name);
		}
		
		
		//for all links
		//TODO: I think the only way of doing this might be to make the whole graph class dirty and recreate it rather than
		//individual links - links don't change that often
		//NOTE: I'm using the graph class to determine the colour of the link - you could colour them individually if you wanted
		for (var c in this._graphs) { //graph class c
			//console.log('ModelTrackernet::cesiumUpdate graph class='+c);
			var lineColour = this.lineColours[c.charAt(5)]; //the class is line_B, line_C etc
			var G = this._graphs[c];
			//We're using _cesiumLinksPolylines on each graph class as a holder for the network polylines for that class.
			//In other words, if the links get changed, then the whole graph is re-created. This can be changed quite easily if it's
			//a performance problem.
			if (G.isDirty)
			{
				console.log("cesiumUpdate: Graph redraw: ",G);
				if (!G.hasOwnProperty('__cesiumLinksPolylines'))
					G._cesiumLinksPolylines = new Cesium.PolylineCollection();
			
				if (G._cesiumLinksPolylines.length>0)
					G._cesiumLinksPolylines.removeAll(); //remove all from existing collection and rebuild
				
				//rebuild polylines from graph edges
				for (var i=0; i<G._edges.length; i++) {
					var e = G._edges[i];
					var l = MapTube.ABM.Link(e); //turn a graph edge into an ABM link
					//Cesium specific
					//var fromAgent = e._userData._fromAgent; //this is how you do the direct edge manipulation
					//var toAgent = e._userData._toAgent;
					var fromAgent = l.fromAgent; //this is how you use the ABM Links class as a helper
					var toAgent = l.toAgent;
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
				G.isDirty=false;
			}
		}
		
	}
	//End of Cesium visualisation hooks
	 
	 
	//properties
	this.viewer = null; //need to set this as a link to the Cesium instance
	this.handler = null; //Cesium handler object - needed for events and picking
	 
	 
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
		//from GeoGL
		var success = false;
		var agent_d = this.getAgent(nextStation); //destination node station
		if (agent_d) {
			if (timeToStation<=0) {
				//Agent is currently "At Platform", so we don't have a to node - set to=from and a dummy velocity plus direction
				//and let the animate code figure out the next station. We need to do this, otherwise tubes are going to sit in
				//the same location until the next data frame
				var fromNode = agent_d;
				agent.fromNode=fromNode;
				agent.toNode=fromNode; //yes, really fromNode
				agent.v=5; //put in a fake velocity - 5ms-1 should do it - all we need to do is to trigger the arrived at station code in the animate loop
				agent.direction=direction;
				agent.lineCode=lineCode;
//			agent->SetColour(LineCodeToVectorColour(LineCode)); //NO! Colour only set on hatch
				var P = fromNode.getXYZ();
				agent.setXYZ(P.x,P.y,P.z); //position agent on its toNode
				success=true;
			}
			else {
				//console.log("agent_d=",agent_d);
				var links = agent_d.inLinks('line_'+lineCode); //get links for specific line network graph i.e. line_B
				//console.log("links=",links);
				for (var i=0; i<links.length; i++)
				{
					var l = MapTube.ABM.Link(links[i]); //we have to wrap a graph edge in a Link helper
					//console.log("TESTING: ",agent.name,nextStation,direction,l.get('direction'),agent);
					if ((links.length==1)||(l.get('direction')==direction)) //NOTE!: links.length==1 is a trap for when the direction is wrong from the TfL realtime data
					{
						//TODO: maybe log whenever this spots a wrong direction?
						agent.fromNode=l.fromAgent;
						agent.toNode=l.toAgent;
						agent.direction=direction;
						agent.lineCode=lineCode;
						//console.log("agent=",agent);
//					agent->SetColour(LineCodeToVectorColour(LineCode)); //NO! Colour only set on hatch
						//interpolate position based on runlink and time to station
						var dist = l.toAgent.distance(l.fromAgent);
						//NOTE: dist/TimeToStation is wrong for the velocity - this is for the full link distance, but we're using the time to station to position based on velocity (runlink and distance)
						//float velocity = dist/(float)TimeToStation; //calculate velocity needed to get to the next node when it says we should
						var runlink = l.get('runlink');
						var velocity = dist/runlink;
						agent.v=velocity; //this is the timetabled speed for this runlink
						if (timeToStation>=runlink) {
							//cerr<<"Error: TimeToStation greater than runlink! "<<agent->Name<<endl;
							//in the annoying case when the time to station is greater than the time it's supposed to take to get there, position at the fromNode
							var Pfrom = l.fromAgent.getXYZ();
							agent.setXYZ(Pfrom.x,Pfrom.y,Pfrom.z);
						}
						else {
							var Pfrom = l.fromAgent.getXYZ();
							var Pto = l.toAgent.getXYZ();
							var delta = Pto.subtract(Pfrom); //delta=Pto-Pfrom
							var scale = timeToStation/runlink;
							//console.log('positionAgent: ',Pfrom,Pto,delta,scale,timeToStation,runlink);
							agent.setXYZ(Pto.x-scale*delta.x,Pto.y-scale*delta.y,Pto.z-scale*delta.z); //linear interpolation X seconds back from target node based on runlink
						}
						agent.face(l.toAgent); //put the face last as we need the position
						success=true;
						break;
					}
				}
				if (!success) console.log("ERROR: no direction: ",agent.name,direction,lineCode,nextStation,links);
			}
			//if !Success, then do it again, but relax the direction? Would cover situation where agent has got to the end of the line and turned around
			//you could always do this yourself though
		}
		return success;
	};
	//
 }
 ModelTrackernet.prototype._debugPrintNetwork = function() {
	console.log('ModelTrackernet._debugPrintNetwork');
	for (var c in this._graphs) {
		console.log('Network: ',c);
		var G = this._graphs[c];
		//console.log('G: ',G);
		for (var i=0; i<G._edges.length; i++) {
			var e = G._edges[i];
			var lnk = MapTube.ABM.Link(e);
			console.log('LINK: ',lnk.get('direction'),lnk.fromAgent.name,lnk.toAgent.name);
		}
	}
	console.log('end of _debugPrintNetwork');
 }
 ModelTrackernet.prototype.setup = function () {
	console.log('ModelTrackernet::setup');
	//initialisation here
	this.cesiumSetup(); //Cesium visualisation initialisation
	
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
		console.log("stations loaded")
	}.bind(this));
	
	//now we have the station nodes, make the relevant links between them to build the network
	MapTube.data.core.acquireJSON('tube-network.json',function(json) {
		//console.log(json);
		//"B" : { "0" : [ { "o": "ELE", "d": "LAM", "r": 120 },
		for (lineCode in json) {
			var lineData = json[lineCode];
			for (var dir = 0; dir<2; dir++)
			{
				var links = lineData[dir];
				for (var i=0; i<links.length; i++) {
					var lnk = links[i];
					var e = this.createLink('line_'+lineCode,lnk.o,lnk.d);
					e._userData.runlink = lnk.r;
					e._userData.direction = dir;
					//console.log('CreateLink: ',lineCode,lnk.o,lnk.d);
				}
			}
		}
		//console.log("network loaded");
		//this._debugPrintNetwork();
	}.bind(this));
	
	
	
	//obtain latest data from API
	//TODO: this needs to be removed in favour of the code in step and fetchNewData
	/*MapTube.data.TfL.underground.positions(function(data,filetime) {
		//console.log(data);
		console.log("trackernet filetime: ",filetime);
		this.currentDataDT = filetime;
		var now = new Date();
		var deltaT = (now-filetime)/1000.0; //this is how much time (secs) has elapsed since the data from the API - this gets subtracted from every tube's time to station
		//console.log('deltaT=',deltaT,now,filetime);
		
		for (var i=0; i<data.length; i++)
		{
			//read data from http request result
			var lineCode = data[i].linecode;
			var tripnumber = data[i].tripnumber;
			var setnumber = data[i].setnumber;
			if (lineCode.length==0) continue; //traps blank final line on the csv resulting in data[i] with no data in it
			//var lat=MapTube.data.safeParseFloat(data[i],'lat');
			//var lon=MapTube.data.safeParseFloat(data[i],'lon');
			//if (isNaN(lat)||isNaN(lon)) continue;
			var direction = parseInt(data[i].platformdirectioncode);
			var destCode = data[i].destinationcode; //numeric
			var nextStation = data[i].stationcode;
			var timeToStation = parseFloat(data[i]['timetostation(secs)']);
			var agentName = lineCode+'_'+setnumber+'_'+tripnumber;
			
			//create the agent and set his properties from the data line
			//create agent of class "tube" which is used by the visualisation
			var tubeAgent = this.createAgents(1,'tube')[0]; //TODO: make this more elegant for cases when you only want one created
			tubeAgent.name=agentName;
			tubeAgent.lineCode=lineCode;
			//TODO: need some more properties here...
			//var pos = Cesium.Cartesian3.fromDegrees(lon, lat);
			//tubeAgent.setXYZ(pos.x,pos.y,pos.z);
			var success = this.positionAgent(tubeAgent,lineCode,timeToStation-deltaT,nextStation,direction);
			if (!success) {
				console.log("position agent failed: ",data[i],tubeAgent);
				tubeAgent.isVisible=false;
			}
		}
	}.bind(this));*/

 }
 ModelTrackernet.prototype.fetchNewData = function() {
	//TODO:
	MapTube.data.TfL.underground.positions(function(data,filetime) {
		console.log("ModelTrackernet.prototype.fetchNewData: trackernet filetime: ",filetime);
		if (filetime<=this.currentDataDT)
			return false; //guard case, no new data available yet

		this.currentDataDT = filetime;
		var now = new Date();
		var deltaT = (now-filetime)/1000.0; //this is how much time (secs) has elapsed since the data from the API - this gets subtracted from every tube's time to station
		
		var liveAgents = {}; //map to store names of agents updated here
		for (var i=0; i<data.length; i++)
		{
			//read data from http request result
			var lineCode = data[i].linecode;
			var tripnumber = data[i].tripnumber;
			var setnumber = data[i].setnumber;
			if (lineCode.length==0) continue; //traps blank final line on the csv resulting in data[i] with no data in it
			//var lat=MapTube.data.safeParseFloat(data[i],'lat');
			//var lon=MapTube.data.safeParseFloat(data[i],'lon');
			//if (isNaN(lat)||isNaN(lon)) continue;
			var direction = parseInt(data[i].platformdirectioncode);
			var destCode = data[i].destinationcode; //numeric
			var nextStation = data[i].stationcode;
			var timeToStation = parseFloat(data[i]['timetostation(secs)']);
			var agentName = lineCode+'_'+setnumber+'_'+tripnumber;
			liveAgents[agentName]=true;
			
			//create the agent and set his properties from the data line
			//create agent of class "tube" which is used by the visualisation
			//var tubeAgent = this.createAgents(1,'tube')[0]; //TODO: make this more elegant for cases when you only want one created
			//UPDATE CODE
			//see if agent already exists - if yes, then update his data, otherwise create a new agent
			var tubeAgent = this.getAgent(agentName);
			if (!tubeAgent) { //create a new agent - name and line code don't change, so only need to set them here
				tubeAgent = this.createAgents(1,'tube')[0];
				tubeAgent.name=agentName;
				tubeAgent.lineCode=lineCode;
			}
			//nextStation, direction and other movement related properties get set in positionAgent
			var success = this.positionAgent(tubeAgent,lineCode,timeToStation-deltaT,nextStation,direction);
			if (!success) {
				console.log("position agent failed: ",data[i],tubeAgent);
				tubeAgent.isVisible=false;
			}
		}
		//now we have to go through the list of agents again and remove any that haven't appeared in this set of data
		for (var i=0; i<this._agents['tube'].length; i++)
		{
			var a = this._agents['tube'][i];
			if (!liveAgents.hasOwnProperty[a.agentName])
				this.destroyAgent(a);
		}
	}.bind(this));
 }
 ModelTrackernet.prototype.step = function(ticks) {
	//TODO: logic for getting new data and moving agents around here
	//TODO: this should be the only position update function - remove what is in the setup in favour of this code
	//method: check if last data time was more than 3 minutes ago - if it was, then acquire new data and update positions
	//otherwise, just keep moving them along by their velocities
	//ticks in seconds
	//console.log('ModelTrackernet.step '+(new Date()));
	//check for availability of new data
	var now = new Date();
	var deltaT = (now-this.currentDataDT)/1000.0;
	if (deltaT>180.0)
	{
		//new data is available, so we need to do an update
		//NOTE: GeoGL had retry intervals here
		this.fetchNewData();
	}
	else
	{
		//console.log("normal animate")
		//normal animate - everybody moves forwards
		for (var i=0; i<this._agents['tube'].length; i++)
		{
			var a=this._agents['tube'][i];
			var toNode = a.toNode;
			if (!toNode) continue; //HACK! guard case for it going wrong - why?????
			if (a.aabbDistanceTest(toNode,a.v)) //testing distance to station (using quick method)
			{
				//need new toNode based on current direction
				//we're going to get all the outlinks of the current agent's direction and then see if there's a choice
				var dir = a.direction;
				var lc = a.lineCode;
				var edges = toNode.outLinks('line_'+lc);
				var possibles = [];
				for (var e=0; e<edges.length; e++) {
					var link = MapTube.ABM.Link(edges[e]);
					//props on link: runlink, direction
					var link_dir = link.get('direction');
					if (link_dir==dir) possibles.push(link);
				}
				//now, pick one of the possibles at random
				//TODO: once you get the route choice learning working CHANGE THIS!
				if (possibles.length>0) {
					var rnd=0;
					//TODO: check whether this formula is equal for every possible
					if (possibles.length>1) rnd = Math.round(Math.random()*(possibles.length-1));
					a.fromNode=a.toNode;
					a.toNode=possibles[rnd].toAgent;
					a.v=a.distance(a.toNode)/possibles[rnd].get('runlink'); //this is the average time for the link from the graph
					a.face(a.toNode);
				}
				//NOTE: if there are no possible choices (end of line?), then the train stays where he is until the next data update
			}
			else
			{
				//normal continue along current link to next toNode
				a.forward(a.v);
				//console.log("velocity="+a.v);
			}
			
			if (isNaN(a.position.x)||isNaN(a.position.y)||isNaN(a.position.z)) { //TODO: why not just make it invisible?
				a.position.x=3978133; a.position.y=-15712; a.position.z=4968747; //HACK!!!
			}
		}
	}
	console.log("agent count: "+this._agents['tube'].length);
	this.cesiumUpdate();
 }
// ModelTrackernet.prototype.updateScene = function() {
//	 //TODO: visualisation update here i.e. link to globe
// }