// Плагин для показа диалога с ссылкой при заходе игрока
const linkPlugin = {
    // URL для открытия
    targetURL: "https://example.com",
    
    // Инициализация плагина
    init: function() {
        // Регистрируем обработчик события подключения игрока
        Events.on(EventType.PlayerConnect, event => {
            this.showDialog(event.player);
        });
        
        print("LinkDialogPlugin loaded");
    },
    
    // Показать диалог игроку
    showDialog: function(player) {
        // Форматируем сообщение с ссылкой
        const message = Core.bundle.format("linkopen", this.targetURL);
        
        // Отправляем диалог конкретному игроку
        Call.onInfoMessage(player.con, message, 10, 
            () => {
                // Действие при подтверждении
                this.openURI(player, this.targetURL);
            },
            () => {
                // Действие при отказе (необязательно)
                print("Player " + player.name + " declined to open the link");
            }
        );
    },
    
    // Открыть URI (с проверкой прав доступа)
    openURI: function(player, uri) {
        // Проверяем, что это действительный URL
        if(uri && uri.startsWith("http")) {
            // Открываем ссылку на клиенте игрока
            Core.app.openURI(uri);
            print("Opened link for player: " + player.name);
        } else {
            print("Invalid URI: " + uri);
        }
    }
};

// Инициализируем плагин при загрузке
linkPlugin.init();