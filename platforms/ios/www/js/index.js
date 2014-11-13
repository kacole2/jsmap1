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
            types: ['liquor_store']
        };

        var service = new google.maps.places.PlacesService(map);
            service.nearbySearch(liquorSearchParams, callback);

        var allStores = [];

        function callback(results, status) {
          if (status == google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
              //createMarker(results[i]);
              addPlaceToArray(results[i]);
            }
          }
        }

        function addPlaceToArray(place) {
            var placeIdRequest = {
              placeId: place.place_id
            };
            service.getDetails(placeIdRequest, placeDetailCallback);
        };

        function placeDetailCallback(placeDetail, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                var destinationPoint = new google.maps.LatLng(placeDetail.geometry.location.k, placeDetail.geometry.location.B);
                var theDistance = google.maps.geometry.spherical.computeDistanceBetween(destinationPoint, latLong);

                allStores.push(placeDetail);
                console.log(allStores);

                var html = '<dt><a href="#">' + placeDetail.name + '</span><span class="storeDistance">' + (theDistance * 0.000621371192).toFixed(2) + 'mi </span></a></dt>';
                    html += '<dd><div class="leftSide">'
                    html += '<span style="float: left;"><a href="tel:' + placeDetail.formatted_phone_number + '">' + placeDetail.formatted_phone_number + '</a></span>';
                    
                    if (typeof placeDetail.opening_hours === 'undefined'){  
                        html += '';
                    } else {
                        if (placeDetail.opening_hours.open_now == true){
                        html += '<span style="float: right;"><strong>Open Now</strong></span>';
                        } else {
                            html += '<span style="float: right;>Closed</span>';
                        }
                    }

                    html += '<br>';
                    html += placeDetail.vicinity;
                    html += '<br>';

                    if (typeof placeDetail.website === 'undefined'){
                        html += '';
                    } else {
                        html += '<a href="' + placeDetail.website + '">' + placeDetail.website + '</a>';
                    }

                    html += '</div>';

                    if(device.platform == "Android"){
                        html += '<div class="rightSide"><a href="geo:' + placeDetail.geometry.location.k + ',' + placeDetail.geometry.location.B + '"><img src="img/takemethere.png" class="takeMeThere"></a></div>';
                    }else if(device.platform == "iOS"){
                        html += '<div class="rightSide"><a href="comgooglemaps://?q=' + placeDetail.name + '"><img src="img/takemethere.png" class="takeMeThere"></a></div>';
                    }else{
                        console.error("Unknown platform");
                    }

                    html += '</dd>';
                    
                $("#storeList").append(html);
                createMarker(placeDetail);
            }
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

            var marker = new google.maps.Marker({
                name: place.name,
                map: map,
                position: place.geometry.location,
                icon: defaultStorePin
            });

            allMarkers.push(marker);
            markerEventHandler(place, marker);
        };

        function markerEventHandler(place, marker){
            google.maps.event.addListener(marker, 'click', function() {
                for (var i = 0; i < allMarkers.length; i++) {
                    allMarkers[i].setIcon(defaultStorePin);
                }    
                $( "a:contains(" + place.name + ")" ).click().scrollintoview();
                marker.setIcon(highlightedStorePin);
            });
        };

        //BEGINNING OF ACCORDION
        (function($){
          $.fn.accordion = function() {
            var el = this;
            var ddHeight;
            ddHeight = new Array();
            
            el.addClass('enhance');
            
            el.find('dd').each(function(i) {
              var dd = $(this);
              ddHeight[i] = dd.height();
              dd.addClass('closed');
            });
            
            var hash = location.hash;
            var hasHash = el.find('dt a[href="'+hash+'"]');
            
            if (hasHash.length) {
              var toExpand = hasHash.parent().next('dd');
              var i = toExpand.index('dd');
              
              toExpand
                .attr('id', 'active')
                .css('height', ddHeight[i]+'px')
                .removeClass('closed');
            }
            
            el.find('dt a').bind('click', function(e) {
              e.preventDefault();
                
                //Make the map pin highlight on click
                for (var i = 0; i < allMarkers.length; i++) {
                    allMarkers[i].setIcon(defaultStorePin);
                }
                var storeName = $(this).html().toString().split('<')[0];
                var arrayLocation = $.grep(allMarkers, function(e){ return e.name == storeName; })
                arrayLocation[0].setIcon(highlightedStorePin);

              var toExpand = $(this).parent().next('dd');
              var i = toExpand.index('dd');
              
              if (toExpand.attr('id') == 'active') {
                toExpand
                  .removeAttr('id')
                  .removeAttr('style')
                  .addClass('closed');
                  
                location.hash = '';
              } else {
                var active = toExpand.parent().find('#active');

                if (active) {
                  active
                    .removeAttr('id')
                    .removeAttr('style')
                    .addClass('closed');
                }

                toExpand
                  .attr('id', 'active')
                  .css('height', ddHeight[i]+'px')
                  .removeClass('closed');
                  
                location.hash = $(this).attr('href');
              }
            });
          }
        })(jQuery);
        //END OF ACCORDION FEATURE

        setTimeout(function(){
            $('#storeList').accordion();
        },2400);

        $( "#storeListLoading" ).delay( 2500 ).slideUp(200).hide;
        //repeat every 5 seconds
        //setTimeout(app.onSuccess, 5000);
    },
    
    onError: function(error){
        alert("the code is " + error.code + ". \n" + "message: " + error.message);
    },

};

app.initialize();