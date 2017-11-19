// Model.js
// MapTube.ABM.Model
// Richard Milton 21 April 2017
// Agent Based Modelling in javascript. Designed to run headless, so contains no visualisation code.
// This is a 3D ABM, designed to interface with a virtual globe e.g. Cesium.
// The design pattern is that the ABM runs headless and an update function makes changes to the visualisation in Cesium
// peridically, but this project contains no visualisation code, only ABM functionality.
//
// ! Using documentation.js documentation !
//
//TODO: agents can't die

//require graph.js

var MapTube = MapTube || {};
MapTube.ABM = MapTube.ABM || {};

//NOTE: we're dumping the turtle analogy and calling them agents. Hatch is changed to Create.

//vector and matrix definitions - loosely based around glm, but nowhere near as advanced
//allows easy conversion from GeoGL methods, although, obviously, javascript can't do operators
/**
* MapTube.ABM.Vector3 Class
* @param {number} x X coordinate.
* @param {number} y Y coordinate.
* @param {number} z Z coordinate.
*/
MapTube.ABM.Vector3 = function(x,y,z) {
	//properties
	this.x=x;
	this.y=y;
	this.z=z;
	
	//methods
	
	/**
	* Add the given vector to this one and return the new vector, leaving both input vectors unchanged.
	* @param {Vector3} b The vector to add to this one.
	* @returns {Vector3} this + b as a new object.
	*/
	this.add = function(b) { var v = new MapTube.ABM.Vector3(); v.x=this.x+b.x; v.y=this.y+b.y; v.z=this.z+b.z; return v; }
	
	/**
	* Subtract the given vector from this one and return the new vector, leaving both input vectors unchanged.
	* @param {Vector3} b The vector to subtract from this one.
	* @returns {Vector3} this - b as a new object.
	*/
	this.subtract = function(b) { var v = new MapTube.ABM.Vector3(); v.x=this.x-b.x; v.y=this.y-b.y; v.z=this.z-b.z; return v;}
	
}
//static functions

/**
* Normalise the input vector to be a unit vector in the same direction as the original.
* @param {Vector3} a The vector to normalise.
* @returns {Vector3} Normalised version of a as a new object.
*/
MapTube.ABM.Vector3.normalise = function(a) { //standard normalise, returns normalised vector of "a"
	var mag = Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z);
	var v = new MapTube.ABM.Vector3();
	v.x=a.x/mag; v.y=a.y/mag; v.z=a.z/mag;
	return v;
}
/**
* Dot product of a dot b.
* @param {Vector3} a First input vector.
* @param {Vector3} b Second input vector.
* @returns {number} The scalar product of a and b, or a dot b.
*/
MapTube.ABM.Vector3.dot = function(a,b) { //dot product, return a dot b as a scalar
	var dp = a.x*b.x + a.y*b.y + a.z*b.z;
	return dp;
}
/**
* Cross product of a cross b.
* @param {Vector3} a First input vector.
* @param {Vector3} b Second input vector.
* @returns {Vector} The cross product of a and b, or a cross b as a new object.
*/
MapTube.ABM.Vector3.cross = function (a,b) { //cross product of vector a x b, return new vector
	var c = new MapTube.ABM.Vector3();
	c.x = a.y*b.z - a.z*b.y;
	c.y = a.z*b.x - a.x*b.z;
	c.z = a.x*b.y - a.y*b.x;
	return c;
}


/////////////////////////////////////////////
/**
* MapTube.ABM.Agent4 Class
*/
MapTube.ABM.Matrix4 = function() {
	//properties
	this.m = [
		[1.0, 0.0, 0.0, 0.0],
		[0.0, 1.0, 0.0, 0.0],
		[0.0, 0.0, 1.0, 0.0],
		[0.0, 0.0, 0.0, 1.0]
	];
	//methods
	//TODO: add, subtract, rotate etc
	/**
	* Perform a copy of the data in m2 into this Matrix4.
	* @param {Matrix4} m2 Matrix to copy data from.
	*/
	this.copy = function(m2) {
		//deep copy another matrix
		for (var y=0; y<4; y++) for (x=0; x<4; x++) this.m[x][y]=m2.m[x][y];
	}
	/**
	* Translate the position of this Matrix4 by a vector.
	* @param {Vector3} v Translation vector.
	* @returns {Matrix4} The translated matrix as a new object, leaving the original matrix intact.
	*/
	this.translate = function(v) {
		//translate along main axes an amount defined by the v vector
		var Result = new MapTube.ABM.Matrix4();
		Result.copy(this);
		//Result[3] = m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + m[3];
		Result.m[3][0] = this.m[0][0]*v.x + this.m[1][0] * v.y + this.m[2][0] * v.z + this.m[3][0];
		Result.m[3][1] = this.m[0][1]*v.x + this.m[1][1] * v.y + this.m[2][1] * v.z + this.m[3][1];
		Result.m[3][2] = this.m[0][2]*v.x + this.m[1][2] * v.y + this.m[2][2] * v.z + this.m[3][2];
		return Result;
	}

}
//static functions
//none


///////////////////////////////////////////////


//class model
/**
* MapTube.ABM.Model class. This is used as a base class for users to build their own models on top of. Provides access to agent based modelling functionality.
*/
MapTube.ABM.Model = function() {
	console.log('MapTube.ABM.Model::constructor');
	this.stepTimeSecs = 0; //number of seconds between calls to Model.Step
	this.stepTimeMillis = 0; //stepTimeSecs*1000
	this.lastUpdateModelTime = performance.now();
	
	//properties
	this.agentCount = 0; //global count of agents so each one gets a unique index number - this is NOT the number of live agents as it never decreases
	this.createCount = 0; //count of number of agents created in the last time step
	this.destroyCount = 0; //count of number of agents destroyed in the last time step
	this._deadAgents = []; //list of the names of agents killed this cycle which will need to be removed from the visualisation
	this._agents = {}; //named with their class name, each is of class Agents
	this._graphs = {}; //network graphs relating to agent interactions (if used)
	
	/**
	* @private
	* Step scene update timing loop. Calls userModel.step function at the correct frequency.
	* @param {Date} timestamp Date corresponding to the time to update the model to. Most people will pass in Date.now() unless running an archive model.
	*/
	this.updateModel = function(timestamp) {
		//console.log('MapTube.ABM.Model.updateModel1 '+timestamp);
		window.requestAnimationFrame(this.updateModel.bind(this));
		var ticks = timestamp-this.lastUpdateModelTime;
		//console.log('MapTube.ABM.Model.updateModel2 '+timestamp+' '+ticks);
		if (ticks<this.stepTimeMillis) return; //only call the step function when the time comes around
		//reset the dead agent list and create and destroy counters
		this._deadAgents = [];
		this.createCount = 0;
		this.destroyCount = 0;
		this.step(ticks/1000.0); //call user defined step function and pass in how long since last update in seconds
		this.lastUpdateModelTime=timestamp;		
	}
	
	//methods
	//virtual methods which need to be overridden in client code where the client provides the functionality
	//this.setup = function() {
	//	this.updateScene(); //kick off the step update loop
	//	console.log('MapTube.ABM.Model::setup Override setup function');
	//}
	//this.step = function (ticks) {
	//	console.log('MapTube.ABM.Model::step Override step function');
	//	this.cesiumUpdate(); //HACK, call the update now for testing - you need this to create the entities on the globe
	//}
	//I've changed the Model.setup and Model.step functions as they don't work in Javascript the same way as NetLogo, or at least,
	//it's not worth making them work in the same way. All this class's setup is done in its constructor.
	//The user model can have a setup function, but the user must call it himself.
	//The user model contains a step function, but animation is started by the user model calling run(secs) to kick off subsequent
	//calls to userModel.step every "secs" seconds.
	//The user is responsible for updating the display with the current view of the agents in the step function as the ABM is headless.
	/**
	* Step function to be overridden in the user's own model code to provide the model functionality. 
	* @param {number} secs Elapsed time since step was last run, which the user can use for his own purposes.
	*/
	this.step = function(secs) { console.log('MapTube.ABM.Model::step Override step function'); }
	/**
	* User calls usermodel.run(2.0) to start running the model at 2 second intervals. This starts off a timer that calls the user's step() code at the required interval.
	* @param {number} stepTimeSecs The time between successive runs of the model's step() function e.g. 1.0 is once every second.
	*/
	this.run = function(stepTimeSecs)
	{
		this.stepTimeSecs=stepTimeSecs;
		this.stepTimeMillis=stepTimeSecs*1000;
		//now kick off the first animation frame update
		this.updateModel(0);
	}
	
	
	//public methods
	//TODO: agents should be part of a map, which would allow immediate access via their agent name
	
	/**
	* Create [number] agents of class [className].
	* @param {number} number The number of agents to create.
	* @param {string} className Name of the class of agent to create. Basically, class is just a label for referencing groups of agents easily.
	* @returns {array} A list of the new agents that have just been created, expecting the client code to want to set some properties on them.
	*/
	this.createAgents = function(number,className)
	{
		if (!this._agents.hasOwnProperty(className))
			this._agents[className] = []; //make new list for agents of this class if not already existing
		//now let's make some little agents...
		var newAgents = [];
		for (var i=0; i<number; i++) {
			var a = new MapTube.ABM.Agent();
			//agent gets his unique (across all classes) agent id number
			a.id = this.agentCount;
			++this.agentCount;
			a.name = 'agent_'+a.number;
			a.className = className;
			//are there any other properties to set here?
			
			this._agents[className].push(a);
			newAgents.push(a);
			++this.createCount;
		}
		return newAgents; //this is a live copy
	}
	
	/**
	* Destroy an agent by moving him from the live list to the dead list so that the visualisation can remove him on the next frame.
	* @param {MapTube.ABM.Agent} agent The agent to destroy.
	* @returns {boolean} True on success.
	*/
	this.destroyAgent = function(agent)
	{
		this._deadAgents.push(agent);
		var alist = this._agents[agent.className];
		for (var i=0; i<alist.length; i++) {
			var a = alist[i];
			if (a.name==agent.name)
			{
				this._agents[agent.className].splice(i,1);
				++this.destroyCount;
				return true;
			}
		}
		return false;
	}
	
	//methods relating to finding agents by properties
	
	/**
	* Get an agent from its name property (they're indexed in the agent map on their unique id number).
	* TODO: optimise the name search by making a link between the agent id and the name - NOTE: ids are unique across all classes.
	* @param {string} agentName The name of the agent to find.
	* @returns {MapTube.ABM.Agent} The agent with the given name if it was found, otherwise null if no agent with that name was found.
	*/
	this.getAgent = function(agentName)
	{
		//go through all the classes and all the agents in each one, return the first name match
		for (var c in this._agents) {
			var alist = this._agents[c];
			for (var id in alist) {
				var a = alist[id];
				if (a.name==agentName) return a;
			}
		}
		return null;
	}
	
	//findAgent(propName,value)?
	
	//methods relating to links and graphs
	
	/**
	* Create a link between two agents using a named network. NOTE: you can link two agents of different classes.
	* @param {string} networkName The name of the network class. Every network graph is named, so multiple (separate) networks can be referenced.
	* @param {string} agentName1 The name of the origin node in the graph, which is the starting point for the new edge.
	* @param {string} agentName2 The name of the destination node in the graph, which is the finishing point for the new edge.
	* @returns {Graph.Edge} The link it just created, between agentName1 and agentName2, which is actually an edge in a graph. Returns null on error, for example
	* agent1 or agent2 not found.
	*/
	this.createLink = function(networkName,agentName1,agentName2)
	{
		if (!this._graphs.hasOwnProperty(networkName))
			this._graphs[networkName] = new Graph(true); //make new list for agents of this class if not already existing
		var g = this._graphs[networkName];
		//now find the two agents from their names
		var a1=this.getAgent(agentName1);
		var a2=this.getAgent(agentName2);
		//assert a1!=null and a2!=null ???
		if ((a1==null)||(a2==null)) {
			console.error('MapTube.ABM.Model.createLink: FATAL - agent not found by name: ',agentName1,agentName2,a1,a2);
			return;
		}
		var e=g.connectVertices(a1.id,a2.id);
		//make link between each vertex in the graph and the agents - this allows us to query agent.outLinks or agent.inLinks
		e._userData._fromAgent=a1;
		e._userData._toAgent=a2;
		a1.graphVertex[networkName]=e._fromVertex;
		a2.graphVertex[networkName]=e._toVertex;
		
		g.isDirty=true; //flag it for redraw on next frame
		
		return e;
	}
	
	//defaults
	//void SetDefaultShape(std::string BreedName, std::string ShapeName);
	//void SetDefaultSize(std::string BreedName, float Size);
	//void SetDefaultColour(std::string BreedName, glm::vec3 Colour);

	
	//Extension Methods not in NetLogo (and maybe LoadTurtles would be better?)
	//loadAgentsCSV : function(const std::string& Filename, const int SkipLines, std::function<Agent* (std::vector<std::string>)> func) {}
	//void SetGeodeticPosition(Agent* agent, double Lat, double Lon, double Height);
}
//end of model definition


/**
  * MapTube.ABM.Agent Class
*/
MapTube.ABM.Agent = function() {
	//console.log('MapTube.ABM.Agent::constructor');
	this.isDirty=true; //flag used when a visualisation property changes and the agent needs to be redrawn
	this.position = new MapTube.ABM.Vector3(); //copy of position so agents without meshes can have position
	this.agentMatrix = new MapTube.ABM.Matrix4(); //copy of matrix so agents without meshes can have position and orientation
	
	//position
	//orientation
	//shape
	this.isVisible=true;
	this.size = 1.0;
	

	//static Agents* _pParentAgents; //parent of all Agent classes - Agents, which needs to keep a list of its children
		
	this.id = -1; //unique agent number
	this.className = ''; //class of this agent
	this.name = 'agent'; //unique key (is it unique?)
	this.graphVertex = {}; //map connecting this agent to a named network graph to link to its vertex representation in the graph structure
	//colour
	//glm::vec3 _colour; //this should be private
	
	//this.setColour = function(glm::vec3 new_colour) {}
	//glm::vec3 getColour();
	
	//this.get = function(name) {}
	//this.set = function(name,value) {}
	
	//create, destroy
	//std::vector<Agent*> Hatch(int N, std::string BreedName);
	//this.die = function() {} //To implement this, it might be better to have an isAlive flag and let the model garbage collect on a step

	//movement and orientation
	/**
	* Get the agent's current position as a vector.
	* @returns {Vector3} The position vector representing the agent's location.
	*/
	this.getXYZ = function() { return this.position; }
	/**
	* Set the agent's position to a new value.
	* Sets isDirty=true to flag to the graphics engine that a draw update is needed.
	* @param {number} x X coordinate.
	* @param {number} y Y coordinate.
	* @param {number} z Z coordinate.
	*/
	this.setXYZ = function(x,y,z) { this.isDirty=true; this.position.x=x; this.position.y=y; this.position.z=z; }
	//double xcor(void);
	//double ycor(void);
	//double zcor(void); //added this
	//random-x-cor
	//random-y-cor
	//random-z-cor
	//pxcor()
	//pycor()
	/**
	* Orient this agent's rotation matrix so that it faces another agent. In other words, successive calls to forward() will eventually
	* make this agent collide with the one passed in as the parameter (assuming the other agent doesn't move).
	* Sets isDirty=true to flag to the graphics engine that a draw update is needed.
	* @param {Agent} a The agent that we want this one to face.
	*/
	this.face = function(a) {
		//make this agent face the 'a' agent
		//from geogl
		//following assumes agent actually has a mesh that we can get the matrix from
		var P1 = this.getXYZ(); //this is me
		var P2 = a.getXYZ(); //this is who I want to look at

		//HACK!
		if (this.distance(a)<0.01) return; //error, asked to face an agent that I'm virtually on top of

		//_pAgentMesh->modelMatrix = glm::lookAt(P1,P2,glm::vec3(0,0,1)); //assumes agents exist on xy plane with up in +ve z direction
		var f = MapTube.ABM.Vector3.normalise(P2.subtract(P1)); //center - eye
		var s = MapTube.ABM.Vector3.normalise(MapTube.ABM.Vector3.cross(f, new MapTube.ABM.Vector3(0,0,1))); //(0,0,1)=up
		var u = MapTube.ABM.Vector3.cross(s, f);

		//transpose of view matrix glm::lookAt calculation and keep the position as P1
		var Result = new MapTube.ABM.Matrix4(); //initialised to unit matrix
		Result.m[0][0] = s.x;
		Result.m[0][1] = s.y;
		Result.m[0][2] = s.z;
		Result.m[1][0] = u.x;
		Result.m[1][1] = u.y;
		Result.m[1][2] = u.z;
		Result.m[2][0] =-f.x;
		Result.m[2][1] =-f.y;
		Result.m[2][2] =-f.z;
		Result.m[3][0]=P1.x;
		Result.m[3][1]=P1.y;
		Result.m[3][2]=P1.z;
		this.agentMatrix = Result;
		this.isDirty=true;
	}
	/**
	* Move this agent's position by the dx, dy, dz amounts in the XYZ axes. Equivalent to calling getXYZ(), adding on (dx,dy,dz) and
	* calling setPos().
	* Sets isDirty=true to flag to the graphics engine that a draw update is needed.
	* @param {number} dx Amount to add to the agent's x position.
	* @param {number} dy Amount to add to the agent's y position.
	* @param {number} dz Amount to add to the agent's z position.
	*/
	this.move = function (dx,dy,dz) {
		//move the specified distance along the vector (dx,dy,dz)
		//from geogl
		//new code which can handle the absence of a model matrix (i.e. no mesh)
		//set the position on the agent matrix
		//direct manipulation of position
		//console.log("forward: original position: ",this.position,this.agentMatrix);
		this.agentMatrix.m[3][0]=this.position.x;
		this.agentMatrix.m[3][1]=this.position.y;
		this.agentMatrix.m[3][2]=this.position.z;
		this.agentMatrix = this.agentMatrix.translate(new MapTube.ABM.Vector3(dx,dy,dz));
		//now get the position back
		this.position.x=this.agentMatrix.m[3][0];
		this.position.y=this.agentMatrix.m[3][1];
		this.position.z=this.agentMatrix.m[3][2];
		//console.log("forward: updated position: ",this.position,this.agentMatrix);
		this.isDirty=true;
	}
	/**
	* Move this agent forward by a given distance.
	* Sets isDirty=true to flag to the graphics engine that a draw update is needed.
	* @param {number} d Distance to move in the agent's forward direction with forwards determined by the agent's rotation matrix.
	*/
	this.forward = function(d) {
		this.move(0,0,-d);
	}
	/**
	* Move this agent backward by a given distance.
	* Sets isDirty=true to flag to the graphics engine that a draw update is needed.
	* @param {number} d Distance to move in the agent's backwards direction with backwardss determined by the agent's rotation matrix.
	*/
	this.back = function(d) {
		this.move(0,0,d);
	}
	/**
	* Move this agent left by a given distance.
	* Sets isDirty=true to flag to the graphics engine that a draw update is needed.
	* @param {number} d Distance to move in the agent's left direction with left determined by the agent's rotation matrix.
	*/
	this.left = function(d) {
		this.move(-d,0,0);
	}
	/**
	* Move this agent right by a given distance.
	* Sets isDirty=true to flag to the graphics engine that a draw update is needed.
	* @param {number} d Distance to move in the agent's right direction with right determined by the agent's rotation matrix.
	*/
	this.right = function(d) {
		this.move(d,0,0);
	}
	/**
	* Move this agent up by a given distance.
	* Sets isDirty=true to flag to the graphics engine that a draw update is needed.
	* @param {number} d Distance to move in the agent's upward direction with up determined by the agent's rotation matrix.
	*/
	this.up = function(d) {
		this.move(0,d,0);
	}
	/**
	* Move this agent down by a given distance.
	* Sets isDirty=true to flag to the graphics engine that a draw update is needed.
	* @param {number} d Distance to move in the agent's downward direction with down determined by the agent's rotation matrix.
	*/
	this.down = function(d) {
		this.move(0,-d,0);
	}
	/**
	* Move this agent to the position occupied by another agent.
	* Sets isDirty=true to flag to the graphics engine that a draw update is needed.
	* @param {Agent} a The agent whose position we are going to move to.
	*/
	this.moveTo = function(a) {
		//move to the position of another agent
		var p = a.getXYZ();
		this.setXYZ(p.x,p.y,p.z);
	}
	//end of movement and orientation
		

	//measurement, calculation
	/**
	* Passed another agent, return the cartesian straight line distance between this agent and another one.
	* @param {Agent} a The agent to find the distance to.
	* @returns The distance between 'this' and 'a'.
	*/
	this.distance = function(a) {
		var dx=this.position.x-a.position.x;
		var dy=this.position.y-a.position.y;
		var dz=this.position.z-a.position.z;
		var d2 = dx*dx+dy*dy+dz*dz;
		if (d2<=0) return 0; //guard against underflow
		return Math.sqrt(dx*dx+dy*dy+dz*dz);
	}
	
	/**
	* Test whether this agent is within an axis aligned bounding box centred on another agent. Quick test for agent closeness.
	* @param {Agent} a The other agent forming the centre point of the bounding cube.
	* @param {number} d The half span bounding cube distance e.g. if you pass in 1.0 then it tests for x>=a.x-1.0 && x<=a.x+1.0 (so cube of side 2.0, but 1.0 from agent).
	* @returns True if this agent is within the bounding cube.
	*/
	this.aabbDistanceTest = function(a,d) {
		var p = a.getXYZ();
		return ((Math.abs(this.position.x-p.x)<=d) && (Math.abs(this.position.y-p.y)<=d) && (Math.abs(this.position.z-p.z)<=d));
	}
	
	//links - NOTE: links don't exist, it just returns the in or out edges from the graph vertex linked to the agent.
	/**
	* Passed a name identifying a graph network, return a list of links going into this agent, or the empty list if none.
	* NOTE: the agent must be a Link type.
	* @param {string} networkName The name of the network to find the links for. This name is the one used to create the network originally.
	* @returns {array} A list of all the links entering this node (agent), or empty list if none.
	*/
	this.inLinks = function(networkName) {
		if (this.graphVertex)
			if (this.graphVertex[networkName])
				return this.graphVertex[networkName]._inEdges;
		return [];
	}
	/**
	* Passed a name identifying a graph network, return a list of links coming out of this agent, or the empty list if none.
	* NOTE: the agent must be a Link type.
	* @param {string} networkName The name of the network to find the links for. This name is the one used to create the network originally.
	* @returns {array} A list of all the links exiting this node (agent), or empty list if none.
	*/
	this.outLinks = function(networkName) {
		if (this.graphVertex)
			if (this.graphVertex[networkName])
				return this.graphVertex[networkName]._outEdges;
		return [];
	}

} //end of agent class



/**
* MapTube.ABM.Agents class. Holds all agents of a single class. Multiple Agents objects are held by the Model to store each class type independently.
*/
MapTube.ABM.Agents = function() {
	console.log('MapTube.ABM.Agents::constructor');
	this.numAgents = 0; //counter for how many agents of this class are in the model
	this.birth = 0; //number of agents created in the last animation frame
	this.death = 0; //number of agents destroyed in the last animation frame
	this._agents = []; //list of all agents
	
	//Agent methods
	//this.create = function () {}; //you can only create one of this class type from here - use model class otherwise
	//this.die = function (a) {};
	//TODO:
	//std::vector<ABM::Agent*> With(std::string VariableName,std::string Value); //quick version for just one variable name
	//TODO: you could pass a function to WITH as the selector (visitor pattern)
	//std::vector<ABM::Agent*> Ask(std::string BreedName); //For(breedname) ? i.e. for d in drivers
}

/**
* This is a helper class which is extracted based on a Graph.Edge linking two agents together.
* @param {Edge} e The edge in the Graph object used to wrap the ABM link helper class around.
* @returns {MapTube.ABM.Link} A view of an edge which is from the Agent point of view i.e. hide the underlying graph.
*/
MapTube.ABM.Link = function(e) {
	return /** @lends MapTube.ABM.Link */ {
		//properties
		e : e,
		label : e._label,
		weight : e._weight,
		fromAgent : e._userData._fromAgent,
		toAgent : e._userData._toAgent,
		//methods
		/**
		* Getter function to extract an ABM Link property value from the _userData object tagged to the graph edge.
		* @param {string} propName Name of the property to query.
		* @returns {object} The property requested as an object i.e. type could be any javascript object like string or number.
		*/
		get : function(propName) { return this.e._userData[propName]; },
		/**
		* Setter method to set an ABM Link property value on the _userData object tagged to the graph edge.
		* @param {string} propName Name of the property to set.
		* @param {object} value The value of the object being created or set.
		*/
		set : function(propName,value) { this.e._userData.propName=value; }
	}
}

//class agent time

/**
* MapTube.ABM.AgentTime class. Used to provide date handling functions for the ABM. Currently unused.
*/
MapTube.ABM.AgentTime = function() {
/*	time_t _DT; //year, month, day, hour, min, second
	float _fraction; //fractions of a second

	AgentTime(void);
	~AgentTime(void);

	static AgentTime FromString(const std::string& Text);
	static AgentTime FromString2(const std::string& Text);
	static std::string ToString(const AgentTime& ATime);
	static std::string ToString(const time_t t);
	static std::string ToStringYYYYMMDD_hhmmss(const AgentTime& ATime);
	static std::string ToFilePath(const AgentTime& ATime);

	void GetTimeOfDay(int& Hour, int& Minute, int& Second);
	void GetYearMonthDay(int& Year, int& Month, int& Day);
	int GetDayOfWeek();

	void Add(const float Seconds);
	static float DifferenceSeconds(const AgentTime& T1, const AgentTime& T2);

	AgentTime& operator=(const AgentTime& other);
	void operator+(const float Seconds);
	//void operator+(const double Seconds); ?
	AgentTime& operator+=(const float Seconds);
	bool operator>=(const AgentTime& other);
	bool operator>=(const time_t& other);
*/
}

//class agent utils
//MapTube.ABM.AgentUtils = {
//	static void LinearInterpolate(Agent* A, float Amount, /*const*/ Agent* From, /*const*/ Agent* To);
//}