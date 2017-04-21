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
 }
 ModelTrackernet.prototype.setup = function () {
	 console.log('ModelTrackernet::setup');
	 //TODO: initialisation here
	 
	 //create a datasource for the tube entities (trains)
	 //this.tubeDataSource = new Cesium.CustomDataSource("trackernet");
	 //this.tubeDataSource.entities.add(<your entity here>)
	 //this.viewer.dataSources.add(this.tubeDataSource)
	 
	 
	 //obtain latest data from API
	 MapTube.data.TfL.underground.positions(function(data) {
		console.log(data);
		
		//for i=0 to data.length
		var tube = this.createAgents(1,'tube');
		
		var lat=MapTube.data.safeParseFloat(data[0],'lat');
		var lon=MapTube.data.safeParseFloat(data[0],'lon');
		console.log(data[0],lat,lon);
		var pos = Cesium.Cartesian3.fromDegrees(lon, lat);
		tube[0].setXYZ(pos.x,pos.y,pos.z);
		//create entity in Cesium
		//this.tubeDataSource.entities.add(
		var bluebox = this.viewer.entities.add(
		{
			name : 'blue box',
			//position: Cesium.Cartesian3.fromDegrees(lon, lat, 300000.0),
			position: Cesium.Cartesian3.fromDegrees(-114.0, 40.0, 300000.0),
			box : {
				dimensions : new Cesium.Cartesian3(400000.0, 300000.0, 500000.0),
				material : Cesium.Color.BLUE
			}
		});
	 }.bind(this));
	 
 }
 ModelTrackernet.prototype.step = function(ticks) {
	 //TODO: logic for getting new data and moving agents around here
	 //ticks in seconds
	 
 }
 ModelTrackernet.prototype.updateScene = function() {
	 //TODO: visualisation update here i.e. link to globe
 }