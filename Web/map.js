var mapData = new Array();
var serverNames = new Object();
var playerData = new Object();
playerData.pName = "NoName";
playerData.server = 0;
playerData.map = 0;
playerData.pos = new Array();
playerData.pRot = 0;
playerData.cRot = 0;
playerData.lastSeen = Date.now();
var playersData = new Object();
var playerMarkers = new Object();

var hasBeenLinked = false;
var mapInitialized = false;
var jsonFails = 0;
var currentMap = 0;
var currentServer = 0;
//var gameToMapRatio = 1.65; 
var gameToMapRatio = 39.37
var mapOffset = new Array();

var linkVersion = "1.1"
var linkOutdated = false;
var optionsOpen = true;
var optCenterMap = true;
var optShowWaypoint = true;
var optShowPOI = true;
var optShowVista = true;
var optShowSkill = true;
var optShowTask = true;
var optShowNames = true;
var optBroadcast = false;
var optBroadcastGroup = "None";
var optGW2LinkIP = "127.0.0.1";
//var gw2LinkIP = "192.168.1.115";
//var gw2LinkIP = "24.22.243.30";

var groupName = "all";

var map = null;

var bountiesPaths;

var playerIcon = L.Icon.extend({
    options: {
        iconUrl: 'images/marker-icon.png',
        iconSize:     [58, 25],
        iconAnchor:   [29, 12]
    }
});

var waypointIcon = L.Icon.extend({
    options: {
        iconUrl: 'images/icon-waypoint.png',
        iconSize:     [32, 32],
        iconAnchor:   [16, 16]
    }
});

var poiIcon = L.Icon.extend({
    options: {
        iconUrl: 'images/icon-poi.png',
        iconSize:     [18, 18],
        iconAnchor:   [9, 9]
    }
});

var vistaIcon = L.Icon.extend({
    options: {
        iconUrl: 'images/icon-vista.png',
        iconSize:     [32, 32],
        iconAnchor:   [16, 16]
    }
});

var skillIcon = L.Icon.extend({
    options: {
        iconUrl: 'images/icon-skill.png',
        iconSize:     [32, 32],
        iconAnchor:   [16, 16]
    }
});

var taskIcon = L.Icon.extend({
    options: {
        iconUrl: 'images/icon-task.png',
        iconSize:     [32, 32],
        iconAnchor:   [16, 16]
    }
});

function initServerNames() {
    $.getJSON("https://api.guildwars2.com/v1/world_names.json", function(data) {
        $.each(data, function(i, world) {
            serverNames[world.id] = world.name;
        });
    });
}

// Create the leaflet map
function initMap() {
    "use strict";
    
    var southWest, northEast;
    
    map = L.map("map-container", {
        minZoom: 0,
        maxZoom: 7,
        crs: L.CRS.Simple
    }).setView([0, 0], 0);
    
    southWest = unproject([0, 32768]);
    northEast = unproject([32768, 0]);
    
    map.setMaxBounds(new L.LatLngBounds(southWest, northEast));

    L.tileLayer("https://tiles.guildwars2.com/1/1/{z}/{x}/{y}.jpg", {
        minZoom: 0,
        maxZoom: 7,
        continuousWorld: true
    }).addTo(map);

    map.on("click", onMapClick);

    $.getJSON("https://api.guildwars2.com/v1/map_floor.json?continent_id=1&floor=1", function (data) {
        var region, gameMap, i, il, poi;
        
        for (region in data.regions) {
            region = data.regions[region];
            
            for (gameMap in region.maps) {
                var mapNum = gameMap;
                gameMap = region.maps[gameMap];

                //console.log(gameMap.name);

                mapData[mapNum] = new Object();
                mapData[mapNum].mData = gameMap;
                //jQuery.extend(true, mapData[mapNum].mData, gameMap);
                mapData[mapNum].mLeft = gameMap.map_rect[0][0];
                mapData[mapNum].mTop = gameMap.map_rect[0][1];
                mapData[mapNum].mWidth = gameMap.map_rect[1][0] - gameMap.map_rect[0][0];
                mapData[mapNum].mHeight = gameMap.map_rect[1][1] - gameMap.map_rect[0][1];
                mapData[mapNum].cLeft = gameMap.continent_rect[0][0];
                mapData[mapNum].cTop = gameMap.continent_rect[0][1];
                mapData[mapNum].cWidth = gameMap.continent_rect[1][0] - gameMap.continent_rect[0][0];
                mapData[mapNum].cHeight = gameMap.continent_rect[1][1] - gameMap.continent_rect[0][1];


                //mapData[mapNum].mOffset = new Array();
                //mapData[mapNum].mOffset[0] = ((gameMap.continent_rect[1][0] - gameMap.continent_rect[0][0]) * 0.5) + gameMap.continent_rect[0][0];
                //mapData[mapNum].mOffset[1] = ((gameMap.continent_rect[1][1] - gameMap.continent_rect[0][1]) * 0.5) + gameMap.continent_rect[0][1];
                
                //for (i = 0, il = gameMap.points_of_interest.length; i < il; i++) {
                //    poi = gameMap.points_of_interest[i];
                    
                //    if (poi.type != "waypoint") {
                //        continue;
                //    }

                    //L.marker(unproject(poi.coord), {
                    //    title: poi.name
                    //}).addTo(map);
                //}
            }
        }
        mapInitialized = true;
        console.log("Map initialized");
    });

    //Guild bounty paths
    var possibleSpawn = L.icon({
            iconUrl: "images/possiblespawn.png"
    }); 
    var possibleSpawnTitle = "Spawn possible du boss"

    bountiesPaths = new L.layerGroup();

    $.getJSON('bounties.json').done(function(data) {
        var i;
        for(i = 0; i < data.points.length; i++) {
            L.marker([data.points[i][0], data.points[i][1]], {
                title: possibleSpawnTitle,
                icon: possibleSpawn
            }).addTo(bountiesPaths);
        }

        for(i = 0; i < data.paths.length; i++) {
            var pathCoordinates = new Array();
            var j;
            for(j = 0; j < data.paths[i].points.length; j++) {
                pathCoordinates.push(new L.LatLng(data.paths[i].points[j][0],data.paths[i].points[j][1]));
            }
            var path = new L.polyline(pathCoordinates, {color: data.paths[i].color, weight: 3});
            
            var pattern = [
                 {offset: '3%', repeat: 150, symbol: new L.Symbol.ArrowHead({pixelSize: 10, polygon: false, pathOptions: {color: data.paths[i].color, weight: 2}})}
            ];

            var direction = new L.polylineDecorator(path, {patterns: pattern});
            bountiesPaths.addLayer(path);
            bountiesPaths.addLayer(direction);
        }
    });
}

function waitForMapData() {
    var startTime = new Date();
    var curTime = null;
    do {
        if(mapInitialized)
            break;
        curTime = new Date();
    }
    while(curTime - startTime < 10000);

    if(!mapInitialized)
        console.log("Failed to get map data after 10 seconds");
}

// Start checking for GW2Link every .25 seconds, once the page has finished loading
$( document ).ready(function() {
    $.getScript("config.js", function() {
        $.getScript("plugins/" + plugin + ".js", function() {
            initServerNames();
            initMap();
            //waitForMapData();
            updateGW2Link();
            setInterval(updateGW2Link, update_interval);
            registerUpdatePlayers();
            setInterval(checkOptions, 500);
            setInterval(updatePlayersList, 5000);
        })
    })
});


// Get an array of the player's x/y position
function getPlayerPos(playerName) {
    var playerMap = playersData[playerName].map;
    if(map == null || mapData[playerMap] == null)
        return;
    
    playerPos = new Array();
    mapPct = new Array();

    if(mapData[playerMap].mWidth == 0 || mapData[playerMap].mHeight == 0 || mapData[playerMap].cWidth == 0 || mapData[playerMap].cHeight == 0) {
        console.log("Bad map data: " + playerMap.toString());
        return;
    }

    mapPct[0] = ((playersData[playerName].pos[0] * gameToMapRatio) - mapData[playerMap].mLeft) / mapData[playerMap].mWidth;
    mapPct[1] = ((playersData[playerName].pos[2] * gameToMapRatio) - mapData[playerMap].mTop) / mapData[playerMap].mHeight;

    playerPos[0] = mapData[playerMap].cLeft + (mapData[playerMap].cWidth * mapPct[0])
    playerPos[1] = (mapData[playerMap].cTop + mapData[playerMap].cHeight) - (mapData[playerMap].cHeight * mapPct[1])

    return playerPos;
}

function getMapCenter() {
    mapCenter = new Array();

    mapCenter[0] = -mapData[currentMap].mLeft / mapData[currentMap].mWidth;
    mapCenter[1] = -mapData[currentMap].mTop / mapData[currentMap].mHeight;

    mapCenter[0] = mapData[currentMap].cLeft + (mapData[currentMap].cWidth * mapCenter[0])
    mapCenter[0] = mapData[currentMap].cTop + (mapData[currentMap].cHeight * mapCenter[1])

    return mapCenter;
}


function unproject(coord) {
    return map.unproject(coord, map.getMaxZoom());
}

function onMapClick(e) {
    console.log("You clicked the map at " + map.project(e.latlng));
}

// Update the players marker's location and rotation
function updatePlayer(playerName) {
    var playerMap = playersData[playerName].map;
    if(map == null || !mapData[playerMap])
        return;

    playerPos = getPlayerPos(playerName)

    if(typeof(playerMarkers[playerName]) == "undefined" ) {
        playerMarkers[playerName] = L.marker(unproject([playerPos[0], playerPos[1]]), { icon: new playerIcon(), title: playerName });
        playerMarkers[playerName].bindPopup(playerName);
        playerMarkers[playerName].addTo(map);
        if (optShowNames) {
            playerMarkers[playerName].openPopup();
        } else {
            playerMarkers[playerName].closePopup();
        }
    }
    playerMarkers[playerName].setLatLng(unproject([playerPos[0], playerPos[1]]));
    playerMarkers[playerName]._icon.style[L.DomUtil.TRANSFORM] += ' rotate(-' + playersData[playerName].cRot + 'deg)';

    if(optCenterMap && (playerName == playerData.pName))
        map.panTo(unproject([playerPos[0], playerPos[1]]));
}


function removeMarkers(mapNum, markerType) {
    if(map == null || mapData[mapNum] == null)
        return;

    var marker;
    if(markerType == "waypoint" || markerType == "all") {
        for (marker in mapData[currentMap].mWaypoints) {
            map.removeLayer(mapData[currentMap].mWaypoints[marker]);
        }
        mapData[currentMap].mWaypoints = null;
    }
    if(markerType == "vista" || markerType == "all") {
        for (marker in mapData[currentMap].mVistas) {
            map.removeLayer(mapData[currentMap].mVistas[marker]);
        }
        mapData[currentMap].mVistas = null;
    }
    if(markerType == "poi" || markerType == "all") {
        for (marker in mapData[currentMap].mPOIs) {
            map.removeLayer(mapData[currentMap].mPOIs[marker]);
        }
        mapData[currentMap].mPOIs = null;
    }
    if(markerType == "skill" || markerType == "all") {
        for (marker in mapData[currentMap].mSkills) {
            map.removeLayer(mapData[currentMap].mSkills[marker]);
        }
        mapData[currentMap].mSkills = null;
    }
    if(markerType == "task" || markerType == "all") {
        for (marker in mapData[currentMap].mTasks) {
            map.removeLayer(mapData[currentMap].mTasks[marker]);
        }
        mapData[currentMap].mTasks = null;
    }
}

function addMarkers(markerType) {
    if(map == null || mapData[currentMap] == null)
        return;

    mData = mapData[currentMap].mData;
    var marker;

    if(markerType == "waypoint") {
        console.log("Adding Waypoints");
        mapData[currentMap].mWaypoints = new Array();
        for (i = 0, il = mData.points_of_interest.length; i < il; i++) {
            if(mData.points_of_interest[i].type == "waypoint") {
                marker = new L.Marker(unproject(mData.points_of_interest[i].coord), { icon: new waypointIcon(), title: mData.points_of_interest[i].name });
                mapData[currentMap].mWaypoints.push(marker);
                map.addLayer(marker);
            }
        }

    }
    else if(markerType == "vista") {
        console.log("Adding Vistas");
        mapData[currentMap].mVistas = new Array();
        for (i = 0, il = mData.points_of_interest.length; i < il; i++) {
            if(mData.points_of_interest[i].type == "vista") {
                marker = new L.Marker(unproject(mData.points_of_interest[i].coord), { icon: new vistaIcon(), title: "Vista" });
                mapData[currentMap].mVistas.push(marker);
                map.addLayer(marker);
            }
        }
    }
    else if(markerType == "poi") {
        console.log("Adding POIs");
        mapData[currentMap].mPOIs = new Array();
        for (i = 0, il = mData.points_of_interest.length; i < il; i++) {
            if(mData.points_of_interest[i].type == "landmark") {
                marker = new L.Marker(unproject(mData.points_of_interest[i].coord), { icon: new poiIcon(), title: mData.points_of_interest[i].name });
                mapData[currentMap].mPOIs.push(marker);
                map.addLayer(marker);
            }
        }
    }
    else if(markerType == "skill") {
        console.log("Adding Skills");
        mapData[currentMap].mSkills = new Array();
        for (i = 0, il = mData.skill_challenges.length; i < il; i++) {
            marker = new L.Marker(unproject(mData.skill_challenges[i].coord), { icon: new skillIcon(), title: "Skill Challenge" });
            mapData[currentMap].mSkills.push(marker)
            map.addLayer(marker);
        }
    }
    else if(markerType == "task") {
        console.log("Adding Tasks");
        mapData[currentMap].mTasks = new Array();
        for (i = 0, il = mData.tasks.length; i < il; i++) {
            marker = new L.Marker(unproject(mData.tasks[i].coord), { icon: new taskIcon(), title: "(" + mData.tasks[i].level + ") " + mData.tasks[i].objective });
            mapData[currentMap].mTasks.push(marker)
            map.addLayer(marker);
        }
    }

}


function selectMap(mapNum) {
    if(mapData[mapNum] == null)
        return;

    console.log("Switch to map: " + mapNum + ", " + mapData[mapNum].mData.name);

    removeMarkers(currentMap, "all");
    currentMap = mapNum;

    if(optShowWaypoint)
        addMarkers("waypoint");
    if(optShowVista)
        addMarkers("vista");
    if(optShowPOI)
        addMarkers("poi");
    if(optShowSkill)
        addMarkers("skill");
    if(optShowTask)
        addMarkers("task");
}

function selectServer(serverNum) {
    currentServer = serverNum;
}

// Update the status in the top-bar
function updateLinkStatus(bLinked) {
    if(bLinked) {
        hasBeenLinked = true;
        $( "#top-download" ).css('display', 'none');
        $( "#link-status" ).css('display', 'inline');
        $( "#link-status-b" ).html("Connected");
        $( "#link-status-b" ).css('color', '#cceccc');
    }
    else if(hasBeenLinked) {
        $( "#link-status-b" ).html("Disconnected");
        $( "#link-status-b" ).css('color', '#eccccc');
    }
}

function updateGW2Link() {
    var jsonSuccess = false;

    // Request the JSON file from GW2Link
    var gw2json = $.getJSON('http://' + optGW2LinkIP + ':8428/gw2.json', function(data) {
        jsonSuccess = true;
        jsonFails = 0;

        // Update the player data
        playerData.pName = data.name;
        playerData.server = data.server;
        playerData.map = data.map;
        playerData.pos[0] = data.pos[0];
        playerData.pos[1] = data.pos[1];
        playerData.pos[2] = data.pos[2];
        playerData.pRot = data.prot; 
        playerData.cRot = data.crot; 

        if(!linkOutdated && (!data.version || data.version != linkVersion)) {
            $("#versionwarning").css('display', 'inherit');
            linkOutdated = true;
        }
        else if(linkOutdated && data.version == linkVersion) {
            $("#versionwarning").css('display', 'none');
            linkOutdated = false;
        }

        // Change the map if we have moved to another zone
        if(playerData.map != currentMap) {
            selectMap(playerData.map);
        }

        // Update!
        if (data.status.substring(0, 6) == "Linked") {
            playerData.lastSeen = Date.now();
            playersData[playerData.pName] = playerData;
            updateLocalPlayer();
        }
        updateLinkStatus(true);
    });

    // if the JSON request fails 3 times in a row, consider GW2Link disconnected
    if(!jsonSuccess) {
        jsonFails += 1;
        if(jsonFails >= 3)
            updateLinkStatus(false) ;
    }
}

function checkOptions() {
    var opt = $('#form-gw2linkip').prop('value')
    if(opt != optGW2LinkIP) {
        if(opt == "127.0.0.1" || opt.search("^(192.168.)[0-9]{1,3}(.)[0-9]{1,3}$") != -1)
            optGW2LinkIP = opt;
    }
        
}

$("#options-link").click(function() {
    if(optionsOpen) {
        $("#options-interior").hide();
        optionsOpen = false;
    }
    else {
        $("#options-interior").show();
        optionsOpen = true;
    }
});

$('#checkbox-centermap').change(function() {
    optCenterMap = $('#checkbox-centermap').prop('checked');
});

$('#checkbox-showwaypoint').change(function() {
     optShowWaypoint = $('#checkbox-showwaypoint').prop('checked');
    if(optShowWaypoint)
        addMarkers("waypoint")
    else
        removeMarkers(currentMap, "waypoint")
});

$('#checkbox-showpoi').change(function() {
     optShowPOI = $('#checkbox-showpoi').prop('checked');
    if(optShowPOI)
        addMarkers("poi")
    else
        removeMarkers(currentMap, "poi")
});

$('#checkbox-showvista').change(function() {
    optShowVista = $('#checkbox-showvista').prop('checked');
    if(optShowVista)
        addMarkers("vista")
    else
       removeMarkers(currentMap, "vista")
});

$('#checkbox-showskill').change(function() {
    optShowSkill = $('#checkbox-showskill').prop('checked');
    if(optShowSkill)
        addMarkers("skill")
    else
        removeMarkers(currentMap, "skill")
});

$('#checkbox-showtask').change(function() {
    optShowTask = $('#checkbox-showtask').prop('checked');
    if(optShowTask)
        addMarkers("task")
    else
        removeMarkers(currentMap, "task")
});

$('#checkbox-shownames').change(function() {
    optShowNames = $('#checkbox-shownames').prop('checked');
    for (var playerName in playerMarkers) {
        if (optShowNames) {
            playerMarkers[playerName].openPopup();
        } else {
            playerMarkers[playerName].closePopup();
        }
    }
});

$('#form-gw2linkip').change(function() {
        checkOptions();
});

$("input#checkbox-showbounties").change(function() {
    if($(this).is(':checked'))
        addGuildBounties();
    else
        removeGuildBounties();
});

$("button#send-groupName").click(function() {
    var groupTag = $("input#form-groupName").val();
    if(groupTag != "") {
        groupName = groupTag;

        $("input#form-groupName").val("");
        $("span#submit-groupName-form").hide();
        $("span#choosen-groupName").html(groupName);
    }
});

$("span#choosen-groupName").dblclick(function() {
    groupName = "all";
    $("span#choosen-groupName").html("");
    $("span#submit-groupName-form").show();
});

function updatePlayersList() {
    var now = Date.now();
    for (var playerName in playersData) {
        // Check for local character switch
        if ((playersData[playerName] == playerData) && (playerName != playerData.pName)) {
            removePlayer(playerName);
            return;
        }
        // Check for disconnected players
        var age = (now - playersData[playerName].lastSeen)/1000;
        if (age > 60) {
            removePlayer(playerName);
            return;
        } else {
            baseOpacity = 1;
            if (playersData[playerName].server != playerData.server) {
                baseOpacity = 0.5;
            }
            if (age > 10) {
                playerMarkers[playerName].setOpacity(((60-age)*baseOpacity)/60);
            } else {
                playerMarkers[playerName].setOpacity(baseOpacity);
            }
        }
    }
}

function removePlayer(playerName) {
    map.removeLayer(playerMarkers[playerName]);
    delete playerMarkers[playerName];
    delete playersData[playerName];
}

function addGuildBounties() {
    map.addLayer(bountiesPaths);
}

function removeGuildBounties() {
    map.removeLayer(bountiesPaths);
}
