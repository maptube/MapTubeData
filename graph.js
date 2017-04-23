/*
 * graph.js Lightweight network graph library
 * Richard Milton, 22 April 2017
 * Copy of GeoGL graph.cpp
 */

//implementation
function Edge(options) {
	//properties
	this._isDirected=false;
	this._fromVertex=null;
	this._toVertex=null;
	this._label='';
	this._weight=0.0;
	this._userData={};

	/// <summary>
	/// Edge constructor
	/// </summary>
	/// <param name="IsDirected">Whether this edge is directed or undirected</param>
	/// <param name="FromVertex">The vertex that this edge is connecting from</param>
	/// <param name="ToVertex">The vertex that this edge is connecting to</param>
	/// <param name="Label">A label for the edge</param>
	/// <param name="Weight">A weight for the edge</param>
	
	if (options) {
		if (options.hasOwnProperty('isDirected')) this._isDirected=options.isDirected;
		if (options.hasOwnProperty('fromVertex')) this._fromVertex=options.fromVertex;
		if (options.hasOwnProperty('toVertex')) this._toVertex=options.toVertex;
		if (options.hasOwnProperty('label')) this._label=options.label;
		if (options.hasOwnProperty('weight')) this._weight=options.weight;
	}
	
	//methods... none
};


function Vertex(options) {
	//properties
	this._outEdges = []; //are we calling them edges, arcs or links?
	this._inEdges = [];
	this._vertexId=-1; //unique vertex id number e.g. 0,1,2,3...
	this._name=''; //add a name for a vertex e.g. tube station code
	this._isVisited = false; //used in flattening to mark a vertex as visited
	this._userData = {}; //allow user to tag vertex with his own data

	if (options) {
		if (options.hasOwnProperty('vertexId')) this._vertexId=options.vertexId;
		if (options.hasOwnProperty('name')) this._name=options.name;
	}
	
	//methods... none
};

function Graph(isDirected) {
	//properties
	this._isDirected=isDirected; //this is set in the constructor
	this._vertexIdCounter=0;
	this._vertices={}; //the key is the VertexId
	this._edges=[]; //master list of all graph edges
	
	//methods...
}


/// <summary>
/// Add a new vertex to the graph and return it. This vertex has a unique id number, but no edges yet,
/// so these will have to be added. If id null, then assigned by code, otherwise the user can specify
/// his own id code.
/// </summary>
/// <returns>The new vertex</returns>
Graph.prototype.addVertex = function (id)
{
	if (!id)
	{
		id = this._vertexIdCounter++;
	}
	//if (_Vertices.ContainsKey(Id)) throw duplicate id exception
	var V = new Vertex({'id':id});
	this._vertices[id]=V;
	return V;
}
	
	/// <summary>
	/// Delete a vertex and any edges connected to it using the integer Vertex Id.
	/// Assumes that "VertexId" actually exists.
	/// TODO: I have no idea whether this actually works, or whether it leaks memory - UNTESTED!
	/// </summary>
	/// <param name="VertexId">The unique id of the vertex to delete</param>
/*	void DeleteVertex(int VertexId)
	{
		Vertex* V = _Vertices[VertexId];
		//delete all edges coming into this vertex
		for (std::list<Edge*>::iterator itE = V->_InEdges.begin(); itE!=V->_InEdges.end(); ++itE)
		{
			Edge *E = *itE;
			//make a new list of out edges for this vertex, but without the vertex we are in the process of removing
			//List<Edge<T>> NewOutEdges = new List<Edge<T>>();
			std::list<Edge*> NewOutEdges;
			for (std::list<Edge*>::iterator itOutE = (E->_FromVertex)->_OutEdges.begin(); itOutE!=(E->_FromVertex)->_OutEdges.end(); ++itOutE) 
			//foreach (Edge<T> OutE in E.FromVertex.OutEdges)
			{
				Edge *OutE=*itOutE;
				//if (OutE.ToVertex.VertexId != VertexId) NewOutEdges.Add(OutE);
				if ((*OutE->_ToVertex)._VertexId !=VertexId) NewOutEdges.push_back(OutE);
			}
			//E.FromVertex.OutEdges.Clear();
			//(E->_FromVertex->_OutEdges).clear();
			//E.FromVertex.OutEdges.InsertRange(0, NewOutEdges);
			//(E->_FromVertex->_OutEdges).insert(NewOutEdges);
			E->_FromVertex->_OutEdges=NewOutEdges;
		}
		
		//delete all edges going out of this vertex
		//foreach (Edge<T> E in V.OutEdges)
		for (std::list<Edge*>::iterator itE = V->_OutEdges.begin(); itE!=V->_OutEdges.end(); ++itE)
		{
			Edge *E = *itE;
			//make a new list of in edges for this vertex, but without the vertex we are in the process of removing
			//List<Edge<T>> NewInEdges = new List<Edge<T>>();
			std::list<Edge*> NewInEdges;
			for (std::list<Edge*>::iterator itInE = (E->_FromVertex)->_InEdges.begin(); itInE!=(E->_FromVertex)->_InEdges.end(); ++itInE)
			//foreach (Edge<T> InE in E.FromVertex.InEdges)
			{
				Edge *InE=*itInE;
				//if (InE.FromVertex.VertexId != VertexId) NewInEdges.Add(InE);
				if ((*InE->_FromVertex)._VertexId != VertexId) NewInEdges.push_back(InE);
			}
			//E.FromVertex.InEdges.Clear();
			//(E->_FromVertex->_InEdges).clear();
			//E.FromVertex.InEdges.InsertRange(0, NewInEdges);
			//(E->_FromVertex)->_InEdges->Insert(NewInEdges);
			E->_FromVertex->_InEdges=NewInEdges;
		}
		
		//delete copies from the main edge list either going in or out of this vertex
		//List<Edge<T>> NewEdges = new List<Edge<T>>();
		std::list<Edge*> NewEdges;
		//foreach (Edge<T> E in _Edges)
		for (std::list<Edge*>::iterator itE = _Edges.begin(); itE!=_Edges.end(); ++itE)
		{
			//if ((E.FromVertex.VertexId != VertexId) && (E.ToVertex.VertexId != VertexId))
			//	NewEdges.Add(E);
			Edge *E = *itE;
			if (((E->_FromVertex)->_VertexId!=VertexId)&&((E->_ToVertex)->_VertexId!=VertexId))
				NewEdges.push_back(E);
		}
		_Edges = NewEdges;
		
		//delete the vertex itself
		//_Vertices.Remove(VertexId);
		_Vertices.erase(VertexId);
	}
*/
	
/// <summary>
/// Connect two vertices together with an edge. Handles directed or undirected correctly.
/// </summary>
/// <param name="Vertex1">id number or actual vertex. From Vertex</param>
/// <param name="Vertex2">To Vertex</param>
/// label and weight...
/// <returns>The edge just created</returns>
Graph.prototype.connectVertices = function(vertex1, vertex2, label, weight)
{
	var vertexObjectA=vertex1;
	var vertexObjectB=vertex2;
	if ((typeof(vertex1)==='number')&&((typeof(vertex2)==='number'))) {
		//vertex1 and 2 passed in are vertex ids, so get the actual vertex objects
		vertexObjectA = this._vertices[vertex1];
		vertexObjectB = this._vertices[vertex2];
	}
	//else assume we're dealing with two real vertex objects
	
	//if vertices don't exist, then we need to create new ones
	if (vertexObjectA==null) {
		vertexObjectA = this.addVertex(vertex1)
	}
	if (vertexObjectB==null) {
		vertexObjectB = this.addVertex(vertex2);
	}
	
	//TODO: probably need to check that A and B exist?
	//I'm creating a directed edge here, so it's up to the user if he wants to create the
	//opposite link as well
	
	//Create a directed or undirected edge based on the graph type
	var e = new Edge({isDirected: this._isDirected, fromVertex: vertexObjectA, toVertex: vertexObjectB, label: label, weight: weight});
	this._edges.push(e); //make sure you add it to the graph's master edge list
	//now add the in and out links to the two nodes so we can traverse it
	vertexObjectA._outEdges.push(e);
	vertexObjectB._inEdges.push(e);
	//in the undirected case, the edge is marked as undirected and added as both an in and out
	//edge to both the A and B vertices. In graph traversal, this case must be checked for, as
	//the FromVertex and ToVertex can be traversed in either direction.
	if (!this._isDirected)
	{
		vertexObjectA._inEdges.push(e);
		vertexObjectB._outEdges.push(e);
	}
	return e;
}
	

	/*
	* Flatten a graph into a list of vertices with contiguous segments connected as a path and a NULL meaning break path
	* and start a new one.
	* In other words, build a list of lines which we can use to draw the graph from.
	* TODO: you could add something to find the root of the tree, as this algorithm tends to start in the middle and work out, resulting
	* in a line that's broken into two parts. (see Knuth, finding root of tree in part 1).
	*/
/*	std::vector<Vertex*> Flatten()
	{
		std::vector<Vertex*> Result;

		//see Knuth... almost certainly
		//set all vertices to not visited
		int numverts = _Vertices.size();
		int numedges = _Edges.size();
		for (std::unordered_map<int,Vertex*>::iterator vIT=_Vertices.begin(); vIT!=_Vertices.end(); ++vIT) {
			vIT->second->_IsVisited=false;
		}

		//for all vertices not visited, FollowLinks until a dead end, setting isvisited as you go
		//This is only any use for disconnected parts of the network - FollowLinks must be recursive
		//Result.push_back(std::vector<Vertex*>());
		for (std::unordered_map<int,Vertex*>::iterator vIT=_Vertices.begin(); vIT!=_Vertices.end(); ++vIT) {
			Vertex* V = vIT->second;
			if (!V->_IsVisited) {
				FollowLinks(V,Result);
			}
		}

		return Result;
	}
*/

	/**
	* For the recursive Flatten
	* Recursive depth first polyline follower to turn a minimum spanning tree into a list of polylines.
	* Follow links that haven't already been visited until you hit a dead end.
	*/
/*	void FollowLinks(Vertex* V,std::vector<Vertex*>& paths)
	{
		/ *Vstart->_IsVisited=true; //mark this node as visited once
		//std::vector<Vertex*> path=paths.at(paths.size()-1); //current path being built

		//follow all the unvisited outlinks from Vstart on the current path to make a continuous depth first chain
		for (std::list<Edge*>::iterator eIT = Vstart->_OutEdges.begin(); eIT!=Vstart->_OutEdges.end(); ++eIT) {
			Vertex* V=(*eIT)->_ToVertex;
			if (!V->_IsVisited) {
				paths.push_back(Vstart); //push the start node
				FollowLinks(V,paths); //follow this link to the end of the chain
				//break the chain at this point and start a new path
				//std::vector<Vertex*> newpath;
				//path=newpath;
				//paths.push_back(newpath);
				paths.push_back(NULL);
			}
		}* /

		if ((V->_IsVisited)||(V->_OutEdges.size()==0)) {
			//guard case, we've hit a dead end if we come to an already visited node, or one with no out links
			//NOTE: this is not the only terminal node case
			V->_IsVisited=true;
			paths.push_back(V);
			paths.push_back(NULL);
			return; //probably not necessary as there is only one block
		}
		else {
			V->_IsVisited=true;
			for (std::list<Edge*>::iterator eIT = V->_OutEdges.begin(); eIT!=V->_OutEdges.end(); ++eIT) {
				paths.push_back(V);
				FollowLinks((*eIT)->_ToVertex,paths);
			}
		}

	}
*/
	///////////////////////

	/*
	 * This is a copy of the Flatten functionality in Graph, but with an added complication of only following links belonging to
	 * the given BreedName. This is a version of flatten that is Link aware. It is necessary because the vertices (Agents) which the links
	 * connect are shared between all breed graphs, resulting in incorrect links otherwise.
	 *
	 * Flatten a graph into a list of vertices with contiguous segments connected as a path and a NULL meaning break path
	 * and start a new one.
	 * In other words, build a list of lines which we can use to draw the graph from.
	 * TODO: you could add something to find the root of the tree, as this algorithm tends to start in the middle and work out, resulting
	 * in a line that's broken into two parts. (see Knuth, finding root of tree in part 1).
	 */
/*	std::vector<Vertex*> Flatten(std::string Label)
	{
		std::vector<Vertex*> Result;

		//see Knuth... almost certainly
		//set all vertices to not visited
		int numverts = _Vertices.size();
		int numedges = _Edges.size();
		for (std::unordered_map<int,Vertex*>::iterator vIT=_Vertices.begin(); vIT!=_Vertices.end(); ++vIT) {
			vIT->second->_IsVisited=false;
		}

		//for all vertices not visited, FollowLinks until a dead end, setting isvisited as you go
		//This is only any use for disconnected parts of the network - FollowLinks must be recursive
		//Result.push_back(std::vector<Vertex*>());
		for (std::unordered_map<int,Vertex*>::iterator vIT=_Vertices.begin(); vIT!=_Vertices.end(); ++vIT) {
			Vertex* V = vIT->second;
			if (!V->_IsVisited) {
				FollowLinks(V,Label,Result);
			}
		}

		return Result;
	}
*/
	/*
	 * For the recursive Flatten, following a label name
	 * Recursive depth first polyline follower to turn a minimum spanning tree into a list of polylines.
	 * Follow links that haven't already been visited until you hit a dead end.
	 */
/*	void FollowLinks(Vertex* V,std::string Label,std::vector<Vertex*>& paths)
	{
		if ((V->_IsVisited)||(V->_OutEdges.size()==0)) {
			//guard case, we've hit a dead end if we come to an already visited node, or one with no out links
			//NOTE: this is not the only terminal node case
			V->_IsVisited=true;
			paths.push_back(V);
			paths.push_back(NULL);
			return; //probably not necessary as there is only one block
		}
		else {
			V->_IsVisited=true;
			for (std::list<Edge*>::iterator eIT = V->_OutEdges.begin(); eIT!=V->_OutEdges.end(); ++eIT) {
				//testing edge label here so we only follow a specific labelled edge (e.g. ABM Link Breeds)
				if ((*eIT)->_Label==Label) {
					paths.push_back(V);
					FollowLinks((*eIT)->_ToVertex,Label,paths);
				}
			}
		}

	}
	////////////////////////////////////////////////////////////
*/

