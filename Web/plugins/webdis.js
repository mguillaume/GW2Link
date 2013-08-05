
console.log("Initializing webdis plugin");

function getGroup() {
    update_group = groupName;
    if (groupName == 'all') {
        update_group = playerData.server;
    }
    return update_group;
}

function updateLocalPlayer() {
    updatePlayer(playerData.pName);
    $.get(webdis_url + "/PUBLISH/" + webdis_channel + "." + getGroup() + "/" + JSON.stringify(playerData));
}

function registerUpdatePlayers() {

    var previous_response_length = 0
    xhr = new XMLHttpRequest()
    xhr.open("GET", webdis_url + "/SUBSCRIBE/" + webdis_channel + "." + getGroup(), true);
    xhr.onreadystatechange = checkData;
    //xhr.send(null);

    function checkData() {
        if(xhr.readyState == 3)  {
            response = xhr.responseText;
            chunk = response.slice(previous_response_length);
            previous_response_length = response.length;
            try {
                data = $.parseJSON($.parseJSON(chunk)["SUBSCRIBE"][2]);
                if (data.pName == playerData.pName) {
                    return;
                }
                playersData[data.pName] = data;
                updatePlayer(data.pName);
            } catch(e) {}
        }
    };

}

