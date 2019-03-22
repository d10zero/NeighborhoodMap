/**
* @description Place Object
* @constructor
* @param {string} title - The title of the Place
* @param {Array} location - The latitude,longitude of the Place
*/
function Place(title, location) {
    var self = this;
    self.title = ko.observable(title);
    self.location = ko.observable(location);
}

/**
* @description The five data points used throughout the webpage.
*/
var l = [
  {title: 'Buckingham Fountain', location: [41.875794, -87.618948]}, 
  {title: 'Willis Tower', location: [41.878961, -87.635815]},
  {title: 'Thompson Center', location: [41.885127, -87.63169]},
  {title: 'Chicago Board of Trade Building', location: [41.87776,-87.632248 ]},
  {title: 'Cloud Gate', location: [41.8825, -87.623342]}
];

/**
* @description The ViewModel for the webpage
* Includes creating all knockout observables,
* observableArrays, and computed arrays.
*/
var viewModel = function() {
  	var self = this;

  	//Creates the Knockout observable array with all the Places
  	this.placesList = ko.observableArray([]);
  	l.forEach(function(item) {
  		self.placesList.push(new Place(item.title, item.location));
  	});

  	// Keeps track of the selected location
  	this.currentLocation = ko.observable( this.placesList()[0]);
  	
  	// Sets the selected location and calls a method to open the marker's info window
  	this.setLocation = function(location){
  		self.currentLocation(location);
  		var p = self.placesList.indexOf(location);
  		var position = {
		  	'lat': l[p].location[0], 
		  	'lng': l[p].location[1]
		  }
  		populateInfoWindow(markers[p], position);
  	}

  	// Observable that binds with the filter input text
	this.searchFilter = ko.observable('');
	// the computed observable that filters the Places based on the filter text
	this.filteredRecords = ko.computed(function(){
		var filter = self.searchFilter();
		// if filter is empty then return all Places
		if(!filter || filter == "") {
			if(markers){
				markers.forEach(function(marker) {
					marker.setVisible(true);
				});
			}
			return self.placesList();
			
		} 
		else {
			// if filter is not empty, find all Places which title's contain 
			// the filter text
			var filtered = ko.utils.arrayFilter(self.placesList(), function(item) {
				return (item.title().toLowerCase().includes(filter.toLowerCase()));
			});
			// set all markers to hidden
			markers.forEach(function(marker) {
				marker.setVisible(false);
			});
			// Only display markers returned from the filter
			filtered.forEach(function(place) {
				markers.forEach(function(marker) {
					if(marker.title == place.title()) {
						marker.setVisible(true);
					}
				});
			});
			return filtered;
		}
	},this); 
}

// Apply knockoutJS bindings defined in the ViewModel
ko.applyBindings(new viewModel());


var map;
// Create a new blank array for all the listing markers.
var markers = [];


/**
* @description Callback funciton from the google map API async call
* Includes setting all markers on the map
*/
function initMap() {
	// Constructor creates a new map - only center and zoom are required.
	map = new google.maps.Map(document.getElementById('map'), {
	  center: {lat: 41.878114, lng: -87.629798}, 
	  zoom: 10,
	  mapTypeControl: false
	});
	// creates View Model to access all Place data needed to interact with the Markers
	var model = new viewModel();

	// The following group uses the location array to create an array 
	// of markers on initialize.
	var locations = model.placesList();
	// Loops through each Place
	for (var i = 0; i < locations.length; i++) {
		var x = locations[i].location();
	  // Get the position from the location array.
	  var position = {
	  	'lat': x[0], 
	  	'lng': x[1]
	  }
		var title = locations[i].title();
	  // Create a marker per location, and put into markers array.
	   var marker = new google.maps.Marker({
	    position: position,
	    title: title,
	    animation: google.maps.Animation.DROP,
	    id: i
	  });
      
	  // Push the marker to our array of markers.
	  markers.push(marker);
	  // Create an onclick event to open an infowindow at each marker.
	  marker.addListener('click', function() {
	    populateInfoWindow(this, position);
	  });
	}
	var bounds = new google.maps.LatLngBounds();
	// Extend the boundaries of the map for each marker and display the marker
	for (var i = 0; i < markers.length; i++) {
	  markers[i].setMap(map);
	  bounds.extend(markers[i].position);
	}
	map.fitBounds(bounds);
}


function mapFailed() {
	document.getElementById('map').innerHTML = '<h1 class="panel-heading" >Google Map Could Not Be Loaded.</h1>';
}

// My NYT (New York Times) key to make a request to the NYT API.
let nytKey = 'LdYTSYzgAcSlDzB81DLA7MAZpOPr5nMu'
// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, location) {
	var infowindow = new google.maps.InfoWindow();
	marker.setAnimation(4);
	// Check to make sure the infowindow is not already opened on this marker.
	if (infowindow.marker != marker) {
		infowindow.marker = marker;
		// create the URL to call the NYT API
		let nytURL = 'https://api.nytimes.com/svc/search/v2/articlesearch.json?q='+ marker.title + ' Chicago&sort=relevance&api-key='+ nytKey;
		
		$.getJSON( nytURL, function( data ) {
	        var item = data.response.docs[0];
	        web_url = item.web_url;
	        // set the content in the info window to show the marker title
	        // and the returned article in a hyperlink from NYT
	        infowindow.setContent('<div>' + marker.title + '</br><strong>URL: </strong><a href="' + web_url + '">Website</a></div>');
	        marker.Animation
			infowindow.open(map, marker);
			  // Make sure the marker property is cleared if the infowindow is closed.
	    }).error(function() {
	    	// if there is no data returned from the NYT API, then the marker's info
	    	// window is still set, but it will obnly display the marker title.
        	infowindow.setContent('<div>' + marker.title + '</br><p>Failed to load data from New York Times</p></div>');
			infowindow.open(map, marker);
    	});
	    
	  infowindow.addListener('closeclick', function() {
	    infowindow.marker = null;
	  });
	}
}
