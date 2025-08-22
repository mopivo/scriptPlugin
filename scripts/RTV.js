// Конфигурация
var config = {
    voteRatio: 0.5,
    cooldownMs: 12000,
    voteTimeoutMs: 60000,
};

// Состояние
var state = {
    delays: new Set(),
    rtvVotes: new Set(),
    mapChangeInProgress: false,
    voteTimer: null,
};

// Утилиты
function setTimeout(callback, delay) {
    var timer = new java.util.Timer();
    timer.schedule(new java.util.TimerTask({ run: callback }), delay);
    return timer;
}

function CommandsMethodRunner(method) {
    return new Packages.arc.util.CommandHandler.CommandRunner({ accept: method });
}

// Основная логика
function getRequiredVotes() {
    return Math.ceil(config.voteRatio * Groups.player.size());
}

function resetVoting() {
    if (state.voteTimer) {
        state.voteTimer.cancel();
        state.voteTimer = null;
    }
    state.rtvVotes.clear();
}

function startVoteTimeout() {
    if (state.voteTimer) {
        state.voteTimer.cancel();
    }

    state.voteTimer = setTimeout(function () {
        if (state.rtvVotes.size > 0) {
            Call.sendMessage(
                "[yellow]Голосование за смену карты отменено[gray]! [yellow]Недостаточно голосов в течение минуты."
            );
            resetVoting();
        }
    }, config.voteTimeoutMs);
}

function broadcastVoteStatus(player, currentVotes, requiredVotes) {
    if (requiredVotes === 1) {
        Call.sendMessage("[white]" + player.name + " [yellow]Меняет карту[gray]!");
    } else {
        var message = [
            "[white]" + player.name + " [yellow]Хочет сменить карту[gray]!",
            "[gray]Текущее количество голосов: [yellow]" + currentVotes,
            "[gray]Необходимо голосов: [yellow]" + requiredVotes,
            "[gray]Используйте /rtv для смены карты!"
        ].join("\n");
        Call.sendMessage(message);
    }
}

function changeMap() {
    if (state.mapChangeInProgress) return;

    state.mapChangeInProgress = true;
    resetVoting();

    Call.sendMessage("[green]Достаточно голосов, меняю карту!");
    Events.fire(new GameOverEvent(Team.crux));
}

function checkVotesAndChange() {
    var currentVotes = state.rtvVotes.size;
    var requiredVotes = getRequiredVotes();

    if (currentVotes >= requiredVotes) {
        changeMap();
    }
}

// Обработчик команды
function rtvCommand(args, player) {
    var playerID = player.uuid();

    if (state.delays.has(playerID)) {
        player.sendMessage(
            "[red]Куда так спешишь[gray]?[red] Подожди секунду, друг[gray]!"
        );
        return;
    }

    state.delays.add(playerID);
    setTimeout(function () {
        state.delays.delete(playerID);
    }, config.cooldownMs);

    if (state.rtvVotes.has(playerID)) {
        player.sendMessage("[red]Вы уже голосовали за смену карты[gray]!");
        return;
    }

    if (state.rtvVotes.size === 0) {
        startVoteTimeout();
    }

    state.rtvVotes.add(playerID);
    broadcastVoteStatus(player, state.rtvVotes.size, getRequiredVotes());
    checkVotesAndChange();
}

// Обработчики событий
function HandleServerLoad(event) {
    Vars.netServer.clientCommands.register(
        "rtv",
        "",
        "Проголосовать за смену карты",
        CommandsMethodRunner(rtvCommand)
    );
}

function HandlePlayerLeave(event) {
    var playerID = event.player.uuid();

    if (state.rtvVotes.has(playerID)) {
        state.rtvVotes.delete(playerID);

        var message = [
            "[white]" + event.player.name + " [red]Покинул сервер[gray]!",
            "[gray]Голосование за смену карты:",
            "[gray]Текущее количество голосов: [yellow]" + state.rtvVotes.size,
            "[gray]Необходимо голосов: [yellow]" + getRequiredVotes()
        ].join("\n");
        Call.sendMessage(message);

        if (state.rtvVotes.size === 0) {
            resetVoting();
        } else {
            checkVotesAndChange();
        }
    }
}

function HandleGameOver(event) {
    resetVoting();
    state.mapChangeInProgress = false;
}

// Регистрация событий
Events.on(ServerLoadEvent, HandleServerLoad);
Events.on(PlayerLeave, HandlePlayerLeave);
Events.on(GameOverEvent, HandleGameOver);
