// simple-todos.js
Tasks = new Mongo.Collection("tasks");

// google maps query
function googleMapsQuery(data) {
   
    // center the map
    var latitude = data.region.center.latitude;
    var longitude = data.region.center.longitude;
    var mapOptions = {
        center: { lat: latitude, lng: longitude},
        zoom: 10
    };

    // create the map
    var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);


    // create the marker, and infoWindow variables
    var marker;
    var infoWindow = new google.maps.InfoWindow(), marker, i;

    for(var i=0;i<6;i++) {

        // see latitude and longitude of the business shown
        latitude = data.businesses[i].location.coordinate.latitude;
        longitude = data.businesses[i].location.coordinate.longitude;
        
        // set marker positions
        marker = new google.maps.Marker({
            position: { lat: latitude, lng: longitude},
            map: map
        });

        // set marker click event
        google.maps.event.addListener(marker, 'click', (function(marker, i) {
            return function() {
                infoWindow.setContent('<h3>' + data.businesses[i].name + '</h3><h5>' + 
                    data.businesses[i].mobile_url + '</h5><h5>' + data.businesses[i].phone + '</h5><h5>' +
                    data.businesses[i].snippet_text + '</h5>');
                infoWindow.open(map, marker);
            }
        })(marker, i));

    }
}

// insertion of data into database
function dataInsertion(data, search, location) {



    // see type of data business object
    // alert(typeof data.businesses);

    // insert restaurant names into collection
    for(var i=0;i<6;i++) {

        // see business name
        // alert(data.businesses[i].name);

        var data_type = data.businesses[i].name + '/' + search + '/' + location;
        var text = data_type;

        Tasks.insert({
          text: text,
          createdAt: new Date() 
        });

    }

}

// yelp API call
function yelpQuery(search, location) {

	var auth = {
        //
        // Update with your auth tokens.
        //
        consumerKey : "8l1qSindhJsPtliF9NNDVA",
        consumerSecret : "WLyCP7tC1-iyZB4MyV8qoJxmDIM",
        accessToken : "bYNM_IOCWqxgBo9gtg1k6iuxImdrKEUs",
        // This example is a proof of concept, for how to use the Yelp v2 API with javascript.
        // You wouldn't actually want to expose your access token secret like this in a real application.
        accessTokenSecret : "4cfH8lhsnCoF4Zo7dTcteXIqDKU",
        serviceProvider : {
            signatureMethod : "HMAC-SHA1"
        }
    };

    // search parameters
    var terms = search;
    var near = location;
    var limit = 5;
    var sort = 2;

    var accessor = {
        consumerSecret : auth.consumerSecret,
        tokenSecret : auth.accessTokenSecret
    };
    
    parameters = [];
    parameters.push(['term', terms]);
    parameters.push(['location', near]);
    parameters.push(['limit', limit]);
    parameters.push(['sort', sort]);
    parameters.push(['callback', 'cb']);
    parameters.push(['oauth_consumer_key', auth.consumerKey]);
    parameters.push(['oauth_consumer_secret', auth.consumerSecret]);
    parameters.push(['oauth_token', auth.accessToken]);
    parameters.push(['oauth_signature_method', 'HMAC-SHA1']);

    var message = {
        'action' : 'http://api.yelp.com/v2/search',
        'method' : 'GET',
        'parameters' : parameters
    };

    // testing beginning of program
    // alert("hello");

    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);

    var parameterMap = OAuth.getParameterMap(message.parameters);
    
    // testing Oauth
    // alert(parameterMap);

    var json = $.ajax({
        'url' : message.action,
        'data' : parameterMap,
        'dataType' : 'jsonp',
        'jsonpCallback' : 'cb',
        'success' : function(data, textStats, XMLHttpRequest) {
             
            // testing data output

            /*
            alert('data insertion call');
            alert(data.total);
            alert(search);
            alert(location);
            */
            
            // data insertion call, see what's loaded in document
            // dataInsertion(data, search, location);

            // google maps markers
            google.maps.event.addDomListener(window, 'load', googleMapsQuery(data));

        }
    });

}

if (Meteor.isClient) {

    // this code only runs on the client
    Template.body.helpers({
        tasks: function () {
          return Tasks.find({});
        }
    });

   	// inside the if (Meteor.isClient) block, right after Template.body.helpers:
	Template.body.events(
	{"submit .new-task": function (event) {
	    
	    // this function is called when the new task form is submitted
	   
	    // grab cuisine and location information
	    var cuisine_type = event.target.querySelector('.cuisine_type').value;
	    var location = event.target.querySelector('.location').value;

        yelpQuery(cuisine_type,location);


	    // clear input fields
	    event.target.querySelector('.cuisine_type').value = "";
	    event.target.querySelector('.location').value = "";

	    // prevent default form submit
	    return false;
	},

     // delete buttons for task
     "click .delete": function (event) {

	 	Tasks.remove(this._id);
	 },

	});

}




