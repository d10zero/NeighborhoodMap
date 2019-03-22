function Place(title, location) {
    var self = this;
    self.title = ko.observable(title);
    self.location = ko.observable(location);
}

var l = [
  {title: 'Buckingham Fountain', location: [41.875794, -87.618948]}, 
  {title: 'Willis Tower', location: [41.878961, -87.635815]},
  {title: 'Thompson Center', location: [41.885127, -87.63169]},
  {title: 'Chicago Board of Trade Building', location: [41.87776,-87.632248 ]}, // CHANGE THIS TO SOMETHING BETTER KNOWN THAT I CAN LOOK UP ON WIKI
  {title: 'Cloud Gate', location: [41.8825, -87.623342]}
];

var viewModel = function() {
  	var self = this;
  	this.placesList = ko.observableArray([]);
  	l.forEach(function(item) {
  		self.placesList.push(new Place(item.title, item.location));
  	});
  	this.currentLocation = ko.observable( this.placesList()[0]);
  	this.setLocation = function(location){
  		self.currentLocation(location);
  		var p = self.placesList.indexOf(location);
  		var position = {
		  	'lat': l[p].location[0], 
		  	'lng': l[p].location[1]
		  }
  		populateInfoWindow(markers[p], position);
  	}
  	self.getPlaces = function() {
		return l;
	}

	this.currentPlacesList = ko.observableArray([]);


	this.searchFilter = ko.observable('');
	this.filteredRecords = ko.computed(function(){
		var filter = self.searchFilter();
		if(!filter || filter == "") {
			if(markers){
				markers.forEach(function(marker) {
					marker.setVisible(true);
				});
			}
			return self.placesList();
			
		}
		else {
			var filtered = ko.utils.arrayFilter(self.placesList(), function(item) {
				return (item.title().toLowerCase().includes(filter.toLowerCase()));
			});

			markers.forEach(function(marker) {
				marker.setVisible(false);
			});

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

ko.applyBindings(new viewModel());


var map;
// Create a new blank array for all the listing markers.
var markers = [];

function initMap() {
	// Constructor creates a new map - only center and zoom are required.
	map = new google.maps.Map(document.getElementById('map'), {
	  center: {lat: 41.878114, lng: -87.629798}, 
	  zoom: 10,
	  mapTypeControl: false
	});
	var model = new viewModel();

	// The following group uses the location array to create an array of markers on initialize.
	var locations = model.getPlaces();
	for (var i = 0; i < locations.length; i++) {
		var x = locations[i].location;
	  // Get the position from the location array.
	  var position = {
	  	'lat': x[0], 
	  	'lng': x[1]
	  }
	  var title = locations[i].title;
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

let nytKey = 'LdYTSYzgAcSlDzB81DLA7MAZpOPr5nMu'
// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
//let nytURL = 'https://api.nytimes.com/svc/search/v2/articlesearch.json?q='+city+'&sort=newest&api-key='+ nytKey;
function populateInfoWindow(marker, location) {
	var infowindow = new google.maps.InfoWindow();
	// Check to make sure the infowindow is not already opened on this marker.
	if (infowindow.marker != marker) {
		infowindow.marker = marker;
		var web_url = '';
		let nytURL = 'https://api.nytimes.com/svc/search/v2/articlesearch.json?q='+ marker.title + ' Chicago&sort=relevance&api-key='+ nytKey;
		
		$.getJSON( nytURL, function( data ) {
	        var item = data.response.docs[0];
	        web_url = item.web_url;
	        infowindow.setContent('<div>' + marker.title + '</br><strong>URL: </strong><a href="' + web_url + '">Website</a></div>');

			infowindow.open(map, marker);
			  // Make sure the marker property is cleared if the infowindow is closed.
	    }).error(function() {
        	infowindow.setContent('<div>' + marker.title + '</div>');
			infowindow.open(map, marker);
    	});

	  infowindow.addListener('closeclick', function() {
	    infowindow.marker = null;
	  });
	}
}
