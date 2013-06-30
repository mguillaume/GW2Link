
console.log("Initializing local plugin");

function updateLocalPlayer() {
    updatePlayer(playerData.pName);
}

function registerUpdatePlayers() {
    setInterval(updatePlayers, 1000);
}

function updatePlayers() {
    for (var i=0; i < playersData.length; i++) {
        if (payersData[i].pName != playerData.pName) {
            updatePlayer(payersData[i].pName);
        }
    }
}

