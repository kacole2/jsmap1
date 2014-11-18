/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
       // app.receivedEvent('deviceready');
            navigator.geolocation.getCurrentPosition(app.onSuccess, app.onError);
    },

    onSuccess: function(position){
        var longitude = position.coords.longitude;
        var latitude = position.coords.latitude;
        var latLong = new google.maps.LatLng(latitude, longitude);

        var mapOptions = {
            center: latLong,
            zoom: 13,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true
        };

        var map = new google.maps.Map(document.getElementById("map"), mapOptions);

        var myLocationMarkerImage = {
            url: 'img/blue_dot.png',
            anchor: new google.maps.Point(16, 0)
        };

        var myLocationMarker = new google.maps.Marker({
              position: latLong,
              map: map,
              title: 'my location',
              icon: myLocationMarkerImage
          });

       //PlacesAPI
        var liquorSearchParams = {
            location: latLong,
            rankBy: google.maps.places.RankBy.DISTANCE,
            types: ['liquor_store'],
        };

        var allPlaces = [];

        var service = new google.maps.places.PlacesService(map);
            service.nearbySearch(liquorSearchParams, callback); 

        function callback(results, status) {
            //console.log("******* results: %j", results);
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            async.each(results, addPlaceToArray, function(err) {
                // this gets executed when all places have been added to allPlaces
                
                placeHtmlOutput();
            });
          }
        }

        function addPlaceToArray(place, done) {
            var placeIdRequest = {
              placeId: place.place_id
            };
 
            var placeDetailCallback = function(placeDetail, status) {
                if (status == "OK") {
                    var destinationPoint = new google.maps.LatLng(placeDetail.geometry.location.k, placeDetail.geometry.location.B);
                    var theDistance = google.maps.geometry.spherical.computeDistanceBetween(destinationPoint, latLong);

                    allPlaces.push({id: placeDetail.id, placeid: placeDetail.place_id, name: placeDetail.name, geometry: placeDetail.geometry.location,  
                        latitude: placeDetail.geometry.location.k, longitude: placeDetail.geometry.location.B, 
                        address: placeDetail.vicinity, phone: placeDetail.formatted_phone_number, website: placeDetail.website, 
                        hours: placeDetail.opening_hours, user_ratings_total: placeDetail.user_ratings_total, rating: placeDetail.rating,
                        google_url: placeDetail.url, price_level: placeDetail.price_level, distance: theDistance});
                } else {
                    console.log("Got error when getting place details for place %s:", place.id, status);
                }
                done(); //if an error occurred here, you can pass it to done
            };
 
            service.getDetails(placeIdRequest, placeDetailCallback);
        };

        function placeHtmlOutput() {
            function compare(a,b) {
              if (a.distance < b.distance)
                 return -1;
              if (a.distance > b.distance)
                return 1;
              return 0;
            }
 
            allPlaces.sort(compare);
            console.log(allPlaces);

            for (var i = 0; i < allPlaces.length; i++) {

                var html = '<div data-role="collapsible" data-iconpos="none" id="custom-collapsible" class="mySet">';
                    html += '<h3>' + allPlaces[i].name + '<span style="float: right;">' + (allPlaces[i].distance * 0.000621371192).toFixed(2) + 'mi </span></h3>';

                    if(device && device.platform == "Android"){
                        html += '<a href="geo:' + allPlaces[i].latitude + ',' + allPlaces[i].longitude + '">';
                    }else if(device && device.platform == "iOS"){
                        html += '<a href="comgooglemaps://?q=' + allPlaces[i].name + '">';
                    }else{
                        console.error("Unknown platform");
                    }
                    html += '<img src="img/takemethere.png" class="takeMeThere"></a>';

                    html += '<a href="tel:' + allPlaces[i].phone + '">' + allPlaces[i].phone + '</a>';
                    
                    if (typeof allPlaces[i].hours === 'undefined'){
                        //do nothing
                    } else {
                        html += '<span style="float: right;">';
                        if (allPlaces[i].hours.open_now == true){
                            html += '<strong>Open Now</strong>';
                        } else {
                            html += 'Closed';
                        }
                        html += '</span>';
                    }
                    
                    html += '<br>';
                    html += allPlaces[i].address;
 
                    if (typeof allPlaces[i].website === 'undefined'){
                        //do nothing html += '';
                    } else {
                        html += '<br><a href="' + allPlaces[i].website + '">' + allPlaces[i].website.replace('http://www.', '').replace('http://', '').replace('/', '') + '</a>';
                    }

                    html += '<br>';
                    html += '<br>';
                    if (typeof allPlaces[i].rating === 'undefined'){
                        // do nothing html += '';
                    } else {
                        html += '<strong>Rating: ' + allPlaces[i].rating + '</strong>';
                    }

                    if (typeof allPlaces[i].user_ratings_total === 'undefined'){
                        //do nothing html += '';
                    } else {
                        html += '<span style="float: right;"><a href="' + allPlaces[i].google_url + '">' + allPlaces[i].user_ratings_total;
                        if (allPlaces[i].user_ratings_total > 1){
                            html += ' Reviews';
                        } else {
                            html += ' Review';
                        }
                        html += '</a></span>';
                    }

                    html += '<br>';
                    html += '<br>';
 
                    html += '</div>';

                $("#storeList").append(html).collapsibleset( "refresh" );
                createMarker(allPlaces[i]);
            }
            listToggle();
        };

        var defaultStorePin = {
            url: 'img/store_bottle_pin.png',
            size: new google.maps.Size(17, 44),
            origin: new google.maps.Point(0,0),
            anchor: new google.maps.Point(8, 44)
        };

        var highlightedStorePin = {
            url: 'img/store_bottle_pin_glow.png',
            size: new google.maps.Size(23, 47),
            origin: new google.maps.Point(0,0),
            anchor: new google.maps.Point(11, 47)
        };

        var allMarkers = [];

        function createMarker(place) {
            if (!place.geometry) {
                console.log("**** Place doesn't have geometry:", place);
            } else {                
                var marker = new google.maps.Marker({
                    name: place.name,
                    map: map,
                    position: place.geometry,
                    icon: defaultStorePin
                });
 
                allMarkers.push(marker);
                markerEventHandler(place, marker);
            }
        };

        function markerEventHandler(place, marker){
            google.maps.event.addListener(marker, 'click', function() {
                for (var i = 0; i < allMarkers.length; i++) {
                    allMarkers[i].setIcon(defaultStorePin);
                }    
                $( "h3:contains(" + place.name + ")" ).click().scrollintoview();
                marker.setIcon(highlightedStorePin);
            });
        };
        
        function listToggle() {
            
            $("#storeList").children().on( "collapsibleexpand", function( event, ui ) {
                
                for (var i = 0; i < allMarkers.length; i++) {
                    allMarkers[i].setIcon(defaultStorePin);
                }

                var storeName = $(this).children(":first").html().toString().split(">")[1].split("<")[0].replace("&amp;", "&");
                var arrayLocation = $.grep(allMarkers, function(e){ return e.name == storeName; });
                arrayLocation[0].setIcon(highlightedStorePin);
                map.panTo(arrayLocation[0].position);
            });
        }

        //$( "#storeListLoading" ).delay( 2500 ).slideUp(200).hide;
        //repeat every 5 seconds
        //setTimeout(app.onSuccess, 5000);
    },

    onError: function(error){
        alert("the code is " + error.code + ". \n" + "message: " + error.message);
    },

};

$( document ).on( "pageshow", "#map-page", function() {
    app.initialize();
});
