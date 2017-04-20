/**
* Model.js
* MapTube.ABM.Model
*
*/

var MapTube = MapTube || {};
var MapTube.ABM = MapTube.ABM || {};

//TODO: Need matrix and vector
//dvec3 and mat4



//class model
MapTube.ABM.Model = function() {
	this._agents = {}, //named with their class name, each is of class Agents
	
	this.setup = function() { console.log('Override setup function'); }
	this.step = function (ticks) { console.log('Override setp function'); }
	this.updateScene = function() {}
	this.createAgents = function(number,className) {}
	
	//defaults
	//void SetDefaultShape(std::string BreedName, std::string ShapeName);
	//void SetDefaultSize(std::string BreedName, float Size);
	//void SetDefaultColour(std::string BreedName, glm::vec3 Colour);

	
	//Extension Methods not in NetLogo (and maybe LoadTurtles would be better?)
	//loadAgentsCSV : function(const std::string& Filename, const int SkipLines, std::function<Agent* (std::vector<std::string>)> func) {}
	//void SetGeodeticPosition(Agent* agent, double Lat, double Lon, double Height);
}
//end of model definition

//class agent

MapTube.ABM.Agent = function() {
	//this.
	glm::dvec3 position; //copy of position so agents without meshes can have position
	glm::mat4 agentMatrix; //copy of matrix so agents without meshes can have position and orientation
	
	//position
	//orientation
	//shape
	this.size = 0.0f;
	

	//static Agents* _pParentAgents; //parent of all Agent classes - Agents, which needs to keep a list of its children
		
	this.number = -1; //unique agent number
	//std::string _BreedName;
	this.name = 'agent'; //unique key (is it unique?)
	//colour
	//glm::vec3 _colour; //this should be private
	
	//this.setColour = function(glm::vec3 new_colour) {}
	//glm::vec3 getColour();
	
	this.get = function(name) {}
	this.set = function(name,value) {}
	
	//create, destroy
	//std::vector<Agent*> Hatch(int N, std::string BreedName);
	this.die = function() {}

	//movement and orientation
	glm::dvec3 getXYZ();
	//double xcor(void);
	//double ycor(void);
	//double zcor(void); //added this
	//random-x-cor
	//random-y-cor
	//random-z-cor
	//pxcor()
	//pycor()
	//void Face(Agent& A);
	//void Forward(float d);
	//void Back(float d);
	//void Left(float d);
	//void Right(float d);
	//void Up(float d); //added this
	//void Down(float d); //added this
	//void SetXYZ(const double X, const double Y, const double Z); //should be setxy
	//void MoveTo(Agent& A);
		

	//measurement, calculation
	this.distance = function(a) {} //passed another agent, return the distance between them

} //end of agent class



//class agents - all of same class
MapTube.ABM.Agents = {
	this.numAgents = 0; //counter for how many agents are in the model
	this.birth = 0; //number of agents created in the last animation frame
	this.death = 0; //number of agents destroyed in the last animation frame
	//classNames : [],
	this._agents = []; //list of all agents
	
	//Agent methods
	//sprout?
	this.hatch = function (className) {};
	this.die = function (a) {};
	//TODO:
	//std::vector<ABM::Agent*> With(std::string VariableName,std::string Value); //quick version for just one variable name
	//TODO: you could pass a function to WITH as the selector (visitor pattern)
	//std::vector<ABM::Agent*> Ask(std::string BreedName); //For(breedname) ? i.e. for d in drivers
}

//class agent time

MapTube.ABM.AgentTime = {
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