var baseUrl = 'http://localhost/';

var obj;
function load() {
	$.get(baseUrl + 'resume.json',
		function(data) {
			obj = data;
			displayBio();
			displayProjects();
			displayWork();
			displayEducation();
			
			initializeMap();
		}
	);
}

function displayBio() {
	if (!obj.bio) return;
	var bio = obj.bio;

	var formattedName = HTMLheaderName.replace('%data%', encodeDanger(bio.name));
	var formattedRole = HTMLheaderRole.replace('%data%', encodeDanger(bio.role));
	var formattedPic  = HTMLbioPic.replace('%data%', encodeDanger(bio.imgUrl));
	var formattedMsg  = HTMLwelcomeMsg.replace('%data%', encodeDanger(bio.message));


	var header = $('#header');
	header.prepend(formattedRole);
	header.prepend(formattedName);
	header.append(formattedPic);
	header.append(formattedMsg);

	var skillsArr = bio.skills;
	var contObj = bio.contacts;
	if (contObj) {
		var contStr = HTMLmobile.replace('%data%', encodeDanger(contObj.mobile)) +
			HTMLemail.replace(/%data%/g, encodeDanger(contObj.email)) +
			HTMLtwitter.replace('%data%', encodeDanger(contObj.twitter)) +
			HTMLgithub.replace(/%data%/g, encodeDanger(contObj.github)) +
			HTMLlocation.replace('%data%', encodeDanger(contObj.location));
		$('#topContacts').append(contStr);
		$('#footerContacts').append(contStr);
	}

	if (skillsArr && skillsArr.length) {
		header.append(HTMLskillsStart);
		skillsArr.forEach(x => {
			var formattedSkill = HTMLskills.replace('%data%', encodeDanger(x));
			$('#skills').append(formattedSkill);
		});
	}
}

function displayWork() {
	if (!obj.work) return;
	var work = obj.work;
	if (!work.length) return;
	$('#workExperience').append(HTMLworkStart);
	work.forEach(x => {
		var formattedStr = HTMLworkEmployer.replace('%data%', encodeDanger(x.employer)).replace('%url%', encodeDanger(x.url)) +
			HTMLworkTitle.replace('%data%', encodeDanger(x.title)) +
			HTMLworkDates.replace('%data%', encodeDanger(x.dates)) +
			HTMLworkLocation.replace('%data%', encodeDanger(x.location)) +
			HTMLworkDescription.replace('%data%', encodeDanger(x.description));
		$('.work-entry:last').append(formattedStr);
	});
}

function displayProjects() {
	if (!obj.projects) return;
	var proj = obj.projects;
	if (!proj.length) return;
	$('#projects').append(HTMLprojectStart);
	proj.forEach(x => {
		var formattedStr = HTMLprojectTitle.replace('%data%', encodeDanger(x.title)).replace('%url%', encodeDanger(x.url)) +
			HTMLprojectDates.replace('%data%', encodeDanger(x.dates)) +
			HTMLprojectDescription.replace('%data%', encodeDanger(x.description));
		x.images.forEach(y => formattedStr += HTMLprojectImage.replace('%data%', encodeDanger(y)));
		$('.project-entry:last').append(formattedStr);
	});
}

function displayEducation() {
	if (!obj.education) return;
	var education = obj.education;
	$('#education').append(HTMLschoolStart);
	education.schools.forEach(x => {
		var schStr = HTMLschoolName.replace('%data%', encodeDanger(x.name)).replace('%url%', encodeDanger(x.url)) +
			HTMLschoolDegree.replace('%data%', encodeDanger(x.degree)) +
			HTMLschoolDates.replace('%data%', encodeDanger(x.dates)) +
			HTMLschoolLocation.replace('%data%', encodeDanger(x.location));
		x.majors.forEach(y => schStr += HTMLschoolMajor.replace('%data%', encodeDanger(y)));
		$('.education-entry:last').append(schStr);
	});
	if (education.cources.length) {
		$('#education').append(HTMLonlineClasses);
		education.cources.forEach(x => {
			var courceStr = HTMLonlineTitle.replace('%data%', encodeDanger(x.title)).replace('%url%', encodeDanger(x.url)) +
				HTMLonlineSchool.replace('%data%', encodeDanger(x.school)) +
				HTMLonlineDates.replace('%data%', encodeDanger(x.dates)) +
				HTMLonlineURL.replace(/%data%/g, encodeDanger(x.url));
			$('#education').append('<div class="education-entry"></div>');
			$('.education-entry:last').append(courceStr);
		});
	}
}

var map;

function initializeMap() {

  var locations;

  var mapOptions = {
    disableDefaultUI: true
  };

  map = new google.maps.Map(document.querySelector('#map'), mapOptions);

  function locationFinder() {

    var locations = [];

    if (obj) {
    	if (obj.bio && obj.bio.contacts) {
	    	locations.push(obj.bio.contacts.location);
		}
		if (obj.education && obj.education.schools) {
	    	obj.education.schools.forEach(x => locations.includes(x.location) ? '' : locations.push(x.location));
		}
		if (obj.work) {
	    	obj.work.forEach(x => locations.includes(x.location) ? '' : locations.push(x.location));
		}
	}
    //console.log('locs - ' + locations.length);
    return locations;
  }

  function createMapMarker(placeData) {

    var lat = placeData.geometry.location.lat();  // latitude from the place service
    var lon = placeData.geometry.location.lng();  // longitude from the place service
    var name = placeData.formatted_address;   // name of the place from the place service
    var bounds = window.mapBounds;            // current boundaries of the map window

    // marker is an object with additional data about the pin for a single location
    var marker = new google.maps.Marker({
      map: map,
      position: placeData.geometry.location,
      title: name
    });

    // infoWindows are the little helper windows that open when you click a pin on a map.
    var infoWindow = new google.maps.InfoWindow({
      content: name
    });

    google.maps.event.addListener(marker, 'click', function() {
      infoWindow.open(map, marker);
    });

    // bounds.extend() takes in a map location object
    bounds.extend(new google.maps.LatLng(lat, lon));
    // fit the map to the new marker
    map.fitBounds(bounds);
    // center the map
    map.setCenter(bounds.getCenter());
  }

  /*
  callback(results, status) makes sure the search returned results for a location.
  If so, it creates a new map marker for that location.
  */
  function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      createMapMarker(results[0]);
    }
  }

  /*
  pinPoster(locations) takes in the array of locations created by locationFinder()
  and fires off Google place searches for each location
  */
  function pinPoster(locations) {

    var service = new google.maps.places.PlacesService(map);

    locations.forEach(function(place){
      var request = {
        query: place
      };

      service.textSearch(request, callback);
    });
  }

  // Sets the boundaries of the map based on pin locations
  window.mapBounds = new google.maps.LatLngBounds();

  // locations is an array of location strings returned from locationFinder()
  locations = locationFinder();

  // pinPoster(locations) creates pins on the map for each location in
  // the locations array
  pinPoster(locations);
}

window.addEventListener('load', load);

window.addEventListener('resize', function(e) {
  map.fitBounds(mapBounds);
});

function encodeDanger(s) {
	return s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inName(str) {
	var arr = str.trim().split(" ");
	arr[0] = arr[0].slice(0,1).toUpperCase() + arr[0].slice(1).toLowerCase();
	arr[1] = arr[1].toUpperCase();
	return arr.join(" ");
}

$('#main').append(internationalizeButton);
$('#mapDiv').append(googleMap);
