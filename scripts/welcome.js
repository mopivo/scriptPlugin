const url = "https://t.me/SpaceCatF";

Events.on(EventType.PlayerConnect, function(event) {
    Call.openURI(event.player.con, url);
});

print("Welcome Link Dialog plugin loaded");