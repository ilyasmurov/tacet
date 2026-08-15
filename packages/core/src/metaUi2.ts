// Продолжение семантики интерфейса: люди, звонки, инфраструктура, стрелки
// и всё, что не поместилось в первую часть. Разделение чисто механическое —
// иначе один файл разрастается до неудобного.

import type { IconMeta } from "./metaTypes.js";

export const UI_META_2: Record<string, IconMeta> = {
  // ── люди ──
  "user": {
    use: "One person, a profile.",
    avoid: "For several people use `users`; for a team as an entity use `team`.",
    synonyms: ["user", "profile", "person", "account", "пользователь", "профиль", "человек"],
    related: ["users", "team", "user-pen"],
  },
  "users": {
    use: "Several people, participants, an audience.",
    avoid: "For a team as a working unit use `team`.",
    synonyms: ["users", "people", "members", "participants", "люди", "участники", "пользователи"],
    related: ["user", "team", "user-plus"],
  },
  "team": {
    use: "Team as a working unit you can assign work to.",
    avoid: "For an arbitrary crowd use `users`.",
    synonyms: ["team", "squad", "group", "команда", "группа", "отдел"],
    related: ["users", "building", "crown"],
  },
  "user-plus": {
    use: "Inviting or adding a person.",
    synonyms: ["invite", "add user", "join", "пригласить", "добавить участника"],
    related: ["user-x", "users", "mail"],
  },
  "user-x": {
    use: "Removing a person or revoking access.",
    avoid: "For blocking an action use `ban`.",
    synonyms: ["remove user", "kick", "revoke", "удалить участника", "исключить"],
    related: ["user-plus", "ban", "trash"],
  },
  "user-check": {
    use: "Person confirmed: assigned, approved, present.",
    synonyms: ["assigned", "approved user", "confirmed", "назначен", "подтверждён", "исполнитель"],
    related: ["user", "check-circle", "verified"],
  },
  "user-pen": {
    use: "Editing a profile.",
    avoid: "For editing content use `edit`; for account settings use `user-cog`.",
    synonyms: ["edit profile", "rename user", "править профиль", "изменить пользователя"],
    related: ["edit", "user-cog", "user"],
  },
  "user-cog": {
    use: "Account settings and permissions of a person.",
    avoid: "For app-wide settings use `settings`.",
    synonyms: ["user settings", "permissions", "roles", "настройки пользователя", "права", "роли"],
    related: ["settings", "user-pen", "shield"],
  },
  "crown": {
    use: "Owner, admin, a paid plan.",
    avoid: "For a verified account use `verified`.",
    synonyms: ["owner", "admin", "premium", "владелец", "администратор", "премиум"],
    related: ["verified", "shield", "team"],
  },
  "building": {
    use: "Organization, company, office.",
    avoid: "For the app home screen use `home`.",
    synonyms: ["company", "organization", "office", "компания", "организация", "офис"],
    related: ["home", "team", "globe"],
  },
  "smile": {
    use: "Reaction or mood already placed.",
    avoid: "For opening the emoji picker use `emoji-insert`.",
    synonyms: ["reaction", "mood", "emoji", "реакция", "настроение", "смайл"],
    related: ["emoji-insert", "heart"],
  },
  "hand": {
    use: "Raised hand: asking to speak in a call.",
    synonyms: ["raise hand", "ask to speak", "рука", "поднять руку", "хочу сказать"],
    related: ["mic", "message-square"],
  },

  // ── уведомления, метки, избранное ──
  "bell": {
    use: "Notifications.",
    avoid: "For muted notifications use `bell-off`; for an incoming pile use `inbox`.",
    synonyms: ["notifications", "alerts", "уведомления", "оповещения", "колокольчик"],
    related: ["bell-off", "bell-active", "inbox"],
  },
  "bell-off": {
    use: "Notifications muted.",
    synonyms: ["muted", "silenced", "do not disturb", "отключены", "не беспокоить", "тишина"],
    related: ["bell", "volume", "eye-off"],
  },
  "bell-active": {
    use: "There is something new: filled bell.",
    avoid: "For the neutral state use `bell`.",
    synonyms: ["new notification", "unread", "есть новое", "непрочитанные"],
    related: ["bell", "dot"],
  },
  "flag": {
    use: "Marking something as important or reporting it.",
    avoid: "For a warning use `alert`; for a milestone use `target`.",
    synonyms: ["flag", "report", "mark", "флаг", "пометить", "жалоба"],
    related: ["alert", "pin", "tag"],
  },
  "tag": {
    use: "Label or category on an entity.",
    avoid: "For a filter use `filter`; for a version tag use `rocket` or `git-commit`.",
    synonyms: ["tag", "label", "category", "тег", "метка", "категория"],
    related: ["filter", "flag", "hash"],
  },
  "hash": {
    use: "Channel, hashtag, a number sign.",
    synonyms: ["hashtag", "channel", "number", "хештег", "канал", "номер"],
    related: ["tag", "message-square"],
  },
  "pin": {
    use: "Pinning to the top.",
    avoid: "For a place on a map use `map-pin`.",
    synonyms: ["pin", "stick", "keep on top", "закрепить", "прикрепить"],
    related: ["pin-off", "map-pin", "star"],
  },
  "pin-off": {
    use: "Unpinning.",
    synonyms: ["unpin", "release", "открепить", "снять закрепление"],
    related: ["pin"],
  },
  "map-pin": {
    use: "Place on a map, an address, a venue.",
    avoid: "Not for pinning to the top — that is `pin`.",
    synonyms: ["location", "place", "address", "venue", "место", "адрес", "точка на карте"],
    related: ["pin", "globe", "train"],
  },
  "star": {
    use: "Rating or adding to favourites.",
    avoid: "For a personal bookmark use `bookmark`; for a like use `heart`.",
    synonyms: ["star", "favourite", "rating", "звезда", "избранное", "рейтинг"],
    related: ["star-active", "bookmark", "heart"],
  },
  "star-active": {
    use: "Already in favourites: filled star.",
    synonyms: ["starred", "in favourites", "в избранном", "отмечено звездой"],
    related: ["star", "bookmark-active"],
  },
  "bookmark": {
    use: "Saving for yourself, to read later.",
    avoid: "For public appreciation use `heart`; for a rating use `star`.",
    synonyms: ["bookmark", "save", "read later", "закладка", "сохранить", "потом"],
    related: ["bookmark-active", "star", "archive"],
  },
  "bookmark-active": {
    use: "Already saved: filled bookmark.",
    synonyms: ["saved", "bookmarked", "сохранено", "в закладках"],
    related: ["bookmark", "star-active"],
  },
  "heart": {
    use: "Like, appreciation, sympathy.",
    avoid: "For saving to yourself use `bookmark`.",
    synonyms: ["like", "love", "favourite", "лайк", "нравится", "сердце"],
    related: ["heart-active", "star", "smile"],
  },
  "heart-active": {
    use: "Already liked: filled heart.",
    synonyms: ["liked", "loved", "лайкнуто", "уже нравится"],
    related: ["heart"],
  },

  // ── календарь и время ──
  "calendar": {
    use: "Date, schedule, a calendar view.",
    avoid: "For a moment in time use `clock`; for a meeting with a time use `calendar-clock`.",
    synonyms: ["calendar", "date", "schedule", "календарь", "дата", "расписание"],
    related: ["calendar-clock", "clock", "ticket"],
  },
  "calendar-clock": {
    use: "Event at a specific time: a meeting, a slot.",
    synonyms: ["meeting", "event", "appointment", "встреча", "событие", "слот"],
    related: ["calendar", "clock", "video"],
  },

  // ── звонки и медиа-контроль ──
  "phone": {
    use: "Voice call.",
    avoid: "For a device use `smartphone`; for a video call use `video`.",
    synonyms: ["call", "phone", "voice", "звонок", "телефон", "позвонить"],
    related: ["phone-off", "video", "smartphone"],
  },
  "phone-off": {
    use: "Ending a call or calls disabled.",
    synonyms: ["hang up", "end call", "положить трубку", "завершить звонок"],
    related: ["phone", "phone-missed"],
  },
  "phone-missed": {
    use: "Missed call.",
    synonyms: ["missed call", "unanswered", "пропущенный", "не ответили"],
    related: ["phone", "phone-incoming"],
  },
  "phone-incoming": {
    use: "Incoming call.",
    synonyms: ["incoming call", "входящий звонок", "входящий"],
    related: ["phone-outgoing", "phone", "phone-missed"],
  },
  "phone-outgoing": {
    use: "Outgoing call.",
    synonyms: ["outgoing call", "исходящий звонок", "исходящий"],
    related: ["phone-incoming", "phone"],
  },
  "mic": {
    use: "Microphone on, the person can be heard.",
    avoid: "For vocals as a role use `vocals`.",
    synonyms: ["microphone", "unmuted", "микрофон", "включён звук", "говорить"],
    related: ["mic-off", "vocals", "volume"],
  },
  "mic-off": {
    use: "Microphone muted.",
    synonyms: ["muted", "mic off", "выключен микрофон", "без звука"],
    related: ["mic", "bell-off"],
  },
  "video": {
    use: "Camera on in a call, video mode.",
    avoid: "For a video file use `file-video`; for a broadcast use `livestream`.",
    synonyms: ["camera on", "video call", "видео", "камера включена", "видеозвонок"],
    related: ["video-off", "camera", "livestream"],
  },
  "video-off": {
    use: "Camera off.",
    synonyms: ["camera off", "no video", "камера выключена", "без видео"],
    related: ["video", "monitor-off"],
  },
  "screen-share": {
    use: "Sharing your screen.",
    synonyms: ["share screen", "presentation mode", "демонстрация экрана", "показать экран"],
    related: ["screen-share-off", "monitor", "presentation"],
  },
  "screen-share-off": {
    use: "Screen sharing stopped.",
    synonyms: ["stop sharing", "прекратить демонстрацию", "остановить показ"],
    related: ["screen-share"],
  },
  "monitor-off": {
    use: "Display off or the participant's video is unavailable.",
    avoid: "For your own camera off use `video-off`.",
    synonyms: ["display off", "no signal", "экран выключен", "нет изображения"],
    related: ["monitor", "video-off"],
  },
  "captions": {
    use: "Subtitles, live transcription.",
    synonyms: ["captions", "subtitles", "transcript", "субтитры", "расшифровка", "титры"],
    related: ["waveform", "message-square"],
  },
  "signal-low": {
    use: "Weak connection, quality problems.",
    synonyms: ["weak signal", "poor connection", "слабый сигнал", "плохая связь"],
    related: ["activity", "cloud"],
  },
  "volume": {
    use: "Sound volume.",
    avoid: "For muting a microphone use `mic-off`; for notifications use `bell-off`.",
    synonyms: ["volume", "sound", "audio", "громкость", "звук"],
    related: ["mic", "headphones", "bell-off"],
  },
  "headphones": {
    use: "Listening, headphones, monitoring.",
    synonyms: ["headphones", "listen", "monitoring", "наушники", "прослушивание"],
    related: ["volume", "music", "sound-engineer"],
  },
  "play": {
    use: "Starting playback.",
    avoid: "For a filled state in a player use `play-active`.",
    synonyms: ["play", "start", "воспроизвести", "играть", "запуск"],
    related: ["pause", "play-active", "disc"],
  },
  "pause": {
    use: "Pausing playback.",
    synonyms: ["pause", "stop for now", "пауза", "приостановить"],
    related: ["play", "play-active"],
  },
  "play-active": {
    use: "Playback is on: filled triangle.",
    synonyms: ["playing", "now playing", "играет", "воспроизводится"],
    related: ["play", "pause"],
  },
  "disc": {
    use: "Record, release, album.",
    avoid: "For a hard drive use `hard-drive`.",
    synonyms: ["record", "album", "vinyl", "пластинка", "альбом", "релиз"],
    related: ["music", "turntables", "distribution"],
  },
  "music": {
    use: "Music in general: a track, a playlist, a section.",
    avoid: "For a single note as a symbol use `note`; for an audio file use `file-audio`.",
    synonyms: ["music", "track", "playlist", "музыка", "трек", "плейлист"],
    related: ["note", "disc", "file-audio"],
  },
  "note": {
    use: "Musical note as a mark or a small badge.",
    avoid: "For a text note use `sticky-note`.",
    synonyms: ["note", "musical note", "нота", "значок ноты"],
    related: ["music", "sticky-note"],
  },
  "camera": {
    use: "Taking a photo, camera as an action.",
    avoid: "For an image file use `file-image`; for a photographer as a service use `photographer`.",
    synonyms: ["camera", "take photo", "snapshot", "камера", "снять фото", "снимок"],
    related: ["image", "file-image", "photographer"],
  },
  "waveform": {
    use: "Audio signal, a recording, transcription.",
    synonyms: ["waveform", "audio", "signal", "звуковая волна", "аудио", "запись"],
    related: ["captions", "file-audio", "activity"],
  },

  // ── сообщения ──
  "message-square": {
    use: "One message or a comment.",
    avoid: "For a whole conversation use `messages-square`.",
    synonyms: ["message", "comment", "chat", "сообщение", "комментарий", "чат"],
    related: ["messages-square", "comment", "reply"],
  },
  "messages-square": {
    use: "Conversation, thread, correspondence.",
    synonyms: ["conversation", "thread", "discussion", "переписка", "тред", "обсуждение"],
    related: ["message-square", "comment"],
  },
  "comment": {
    use: "Comment on an entity, a discussion in a feed.",
    avoid: "For a private message use `message-square`.",
    synonyms: ["comment", "discussion", "feedback", "комментарий", "обсуждение", "отзыв"],
    related: ["message-square", "mention", "reply"],
  },
  "mention": {
    use: "Mention of a person.",
    synonyms: ["mention", "at", "tag someone", "упоминание", "собака", "обратиться"],
    related: ["comment", "user", "reply"],
  },
  "mail": {
    use: "Email as a letter.",
    avoid: "For the incoming section use `inbox`.",
    synonyms: ["email", "letter", "почта", "письмо", "имейл"],
    related: ["inbox", "send", "megaphone"],
  },
  "megaphone": {
    use: "Announcement to everyone, a broadcast, promotion.",
    avoid: "For a personal message use `send`.",
    synonyms: ["announcement", "broadcast", "shout", "объявление", "анонс", "рупор"],
    related: ["promotion", "mail", "bell"],
  },
  "post": {
    use: "Post in a feed.",
    synonyms: ["post", "entry", "feed item", "пост", "запись", "публикация"],
    related: ["comment", "repost", "sticky-note"],
  },
  "sticky-note": {
    use: "Short text note.",
    avoid: "For a musical note use `note`.",
    synonyms: ["note", "memo", "reminder", "заметка", "записка", "напоминание"],
    related: ["note", "info", "post"],
  },

  // ── инфраструктура ──
  "server": {
    use: "Server, a host, an environment.",
    avoid: "For a database use `database`; for an event host use `hosting`.",
    synonyms: ["server", "host", "environment", "сервер", "хост", "окружение"],
    related: ["database", "cloud", "cpu"],
  },
  "database": {
    use: "Database.",
    avoid: "For a dump or export use `db-dump`.",
    synonyms: ["database", "db", "storage", "база данных", "бд", "хранилище"],
    related: ["db-dump", "server", "hard-drive"],
  },
  "db-dump": {
    use: "Database dump or backup.",
    synonyms: ["dump", "backup", "snapshot", "дамп", "бэкап", "резервная копия"],
    related: ["database", "download", "archive"],
  },
  "cloud": {
    use: "Cloud service, remote storage.",
    synonyms: ["cloud", "remote", "saas", "облако", "удалённо"],
    related: ["server", "database", "globe"],
  },
  "cpu": {
    use: "Processor, computing load.",
    synonyms: ["cpu", "processor", "compute", "процессор", "вычисления", "нагрузка"],
    related: ["memory", "gauge", "server"],
  },
  "memory": {
    use: "Memory, RAM.",
    synonyms: ["memory", "ram", "память", "оперативка"],
    related: ["cpu", "hard-drive", "gauge"],
  },
  "hard-drive": {
    use: "Disk, physical storage.",
    avoid: "For a record use `disc`.",
    synonyms: ["disk", "drive", "storage", "диск", "накопитель", "хранилище"],
    related: ["database", "memory", "box"],
  },
  "plug": {
    use: "Integration, connector, a plugin.",
    synonyms: ["integration", "connector", "plugin", "интеграция", "коннектор", "плагин"],
    related: ["key", "workflow", "cloud"],
  },
  "activity": {
    use: "Activity over time, a graph, a pulse.",
    avoid: "For a gauge with a limit use `gauge`.",
    synonyms: ["activity", "metrics", "graph", "pulse", "активность", "метрики", "график"],
    related: ["gauge", "history", "waveform"],
  },
  "gauge": {
    use: "Measurement against a limit: load, quota, speed.",
    synonyms: ["gauge", "load", "quota", "speed", "нагрузка", "квота", "спидометр"],
    related: ["activity", "cpu", "memory"],
  },
  "monitor": {
    use: "Desktop screen, a workstation.",
    synonyms: ["desktop", "screen", "display", "монитор", "экран", "десктоп"],
    related: ["smartphone", "app-window", "monitor-off"],
  },
  "smartphone": {
    use: "Phone as a device, the mobile app.",
    avoid: "For a call use `phone`.",
    synonyms: ["mobile", "phone device", "app", "смартфон", "мобильный", "телефон устройство"],
    related: ["monitor", "app-window", "phone"],
  },
  "app-window": {
    use: "Application window, a desktop app.",
    synonyms: ["window", "desktop app", "окно", "приложение"],
    related: ["monitor", "desktop-download", "presentation"],
  },

  // ── разработка ──
  "git-branch": {
    use: "Branch in version control.",
    avoid: "For a business process use `workflow`.",
    synonyms: ["branch", "git", "ветка", "гит"],
    related: ["git-merge", "git-commit", "git-pull-request"],
  },
  "git-commit": {
    use: "Commit, a point in history.",
    synonyms: ["commit", "revision", "коммит", "ревизия"],
    related: ["git-branch", "history"],
  },
  "git-merge": {
    use: "Merging branches.",
    avoid: "For an open review use `git-pull-request`.",
    synonyms: ["merge", "merged", "мерж", "слияние", "влить"],
    related: ["git-pull-request", "git-branch"],
  },
  "git-pull-request": {
    use: "Open pull request, code under review.",
    avoid: "For a closed one use `git-pull-request-closed`; for a merged one use `git-merge`.",
    synonyms: ["pull request", "pr", "review", "пулреквест", "пр", "ревью"],
    related: ["git-pull-request-closed", "git-merge", "code"],
  },
  "git-pull-request-closed": {
    use: "Pull request closed without merging.",
    synonyms: ["closed pr", "rejected", "закрытый пр", "отклонён"],
    related: ["git-pull-request", "circle-x"],
  },
  "bug": {
    use: "Bug, a defect.",
    avoid: "For a warning use `alert`; for a failed operation use `circle-x`.",
    synonyms: ["bug", "defect", "issue", "баг", "дефект", "ошибка в коде"],
    related: ["flask", "alert", "code"],
  },
  "flask": {
    use: "Experiment, a test, a beta feature.",
    synonyms: ["experiment", "test", "beta", "lab", "эксперимент", "тест", "бета"],
    related: ["bug", "sparkles", "target"],
  },
  "wrench": {
    use: "Maintenance, tooling, a fix.",
    avoid: "For app settings use `settings`.",
    synonyms: ["tools", "maintenance", "fix", "инструменты", "починка", "обслуживание"],
    related: ["settings", "plug", "bug"],
  },
  "settings": {
    use: "Settings of the app or a section.",
    avoid: "For a person's account settings use `user-cog`; for tooling use `wrench`.",
    synonyms: ["settings", "preferences", "config", "настройки", "параметры", "конфигурация"],
    related: ["user-cog", "wrench", "grip"],
  },
  "target": {
    use: "Goal, a milestone, precise aim.",
    synonyms: ["goal", "target", "milestone", "цель", "веха", "прицел"],
    related: ["flag", "rocket", "gauge"],
  },
  "rocket": {
    use: "Release, launch, shipping.",
    avoid: "For a plane trip use `plane`.",
    synonyms: ["release", "launch", "ship", "deploy", "релиз", "запуск", "выкатка"],
    related: ["target", "distribution", "zap"],
  },
  "zap": {
    use: "Speed, an instant action, automation.",
    avoid: "For urgency of a task use `priority-urgent`.",
    synonyms: ["fast", "instant", "power", "automation", "быстро", "мгновенно", "молния"],
    related: ["bolt", "rocket", "workflow"],
  },
  "bolt": {
    use: "Jam session, a spontaneous get-together.",
    avoid: "For speed or automation use `zap` — this one belongs to the music context.",
    synonyms: ["jam", "session", "spontaneous", "джем", "сходка", "импровизация"],
    related: ["zap", "calendar-clock", "vocals"],
  },
  "lightbulb": {
    use: "Idea, a hint, a suggestion.",
    avoid: "For reference information use `info`.",
    synonyms: ["idea", "hint", "suggestion", "идея", "подсказка", "предложение"],
    related: ["info", "sparkles", "flask"],
  },
  "sparkles": {
    use: "AI feature, magic, an automatic improvement.",
    synonyms: ["ai", "magic", "auto", "enhance", "ии", "магия", "автоматически"],
    related: ["bot", "ai-extract", "lightbulb"],
  },
  "bot": {
    use: "Bot, an agent, an automatic participant.",
    avoid: "For an AI action on content use `sparkles`.",
    synonyms: ["bot", "agent", "assistant", "бот", "агент", "ассистент"],
    related: ["sparkles", "ai-extract", "user"],
  },
  "ai-extract": {
    use: "Extracting structure from raw content by AI.",
    synonyms: ["extract", "parse", "ai analysis", "извлечение", "разбор", "анализ"],
    related: ["sparkles", "bot", "captions"],
  },
  "composition": {
    use: "Document, a text as a work.",
    avoid: "For a file use `file`; for a note use `sticky-note`.",
    synonyms: ["document", "text", "writing", "документ", "текст", "сочинение"],
    related: ["file", "sticky-note", "heading-1"],
  },
  "palette": {
    use: "Colours, theming, appearance.",
    avoid: "For cover art as a service use `artwork-design`.",
    synonyms: ["palette", "colors", "theme", "палитра", "цвета", "оформление"],
    related: ["sun", "moon", "artwork-design"],
  },
  "sun": {
    use: "Light theme, daytime.",
    synonyms: ["light theme", "day", "светлая тема", "день"],
    related: ["moon", "palette"],
  },
  "moon": {
    use: "Dark theme, night.",
    synonyms: ["dark theme", "night", "тёмная тема", "ночь"],
    related: ["sun", "palette"],
  },
  "globe": {
    use: "Language, region, public availability.",
    synonyms: ["language", "region", "world", "public", "язык", "регион", "мир"],
    related: ["building", "cloud", "map-pin"],
  },

  // ── стрелки и управление ──
  "chevron-right": {
    use: "Moving forward or expanding a collapsed item.",
    avoid: "For navigating between entities use `arrow-right`: chevrons are for interface mechanics.",
    synonyms: ["next", "expand", "forward", "вперёд", "раскрыть", "шеврон"],
    related: ["chevron-left", "arrow-right", "chevron-down"],
  },
  "chevron-left": {
    use: "Going back or collapsing.",
    synonyms: ["previous", "back", "collapse", "назад", "свернуть"],
    related: ["chevron-right", "arrow-left"],
  },
  "chevron-down": {
    use: "Opening a dropdown or expanding a block.",
    synonyms: ["dropdown", "expand", "open", "раскрыть", "выпадающий", "вниз"],
    related: ["chevron-up", "chevrons-up-down", "collapse"],
  },
  "chevron-up": {
    use: "Collapsing a block, scrolling to the top.",
    synonyms: ["collapse", "up", "close", "свернуть", "вверх"],
    related: ["chevron-down", "collapse"],
  },
  "chevrons-up-down": {
    use: "Sorting control or a select that opens both ways.",
    synonyms: ["sort", "select", "expandable", "сортировка", "селект", "оба направления"],
    related: ["chevron-down", "chevron-up", "grip"],
  },
  "arrow-left": {
    use: "Going back to the previous screen.",
    avoid: "For collapsing an element use `chevron-left`.",
    synonyms: ["back", "return", "назад", "вернуться", "стрелка влево"],
    related: ["arrow-right", "chevron-left"],
  },
  "arrow-right": {
    use: "Moving forward, a transition, a consequence.",
    synonyms: ["forward", "next", "go to", "вперёд", "перейти", "стрелка вправо"],
    related: ["arrow-left", "external", "chevron-right"],
  },
  "arrow-up": {
    use: "Growth, moving up, raising priority.",
    synonyms: ["up", "increase", "growth", "вверх", "рост", "поднять"],
    related: ["arrow-right", "chevron-up", "activity"],
  },
  "more-h": {
    use: "Extra actions, horizontal ellipsis.",
    avoid: "For the main navigation use `menu`.",
    synonyms: ["more", "actions", "ellipsis", "ещё", "действия", "многоточие"],
    related: ["more-v", "menu", "grip"],
  },
  "more-v": {
    use: "Extra actions in a narrow row, vertical ellipsis.",
    synonyms: ["more", "kebab menu", "ещё", "вертикальное многоточие"],
    related: ["more-h", "menu"],
  },
  "grip": {
    use: "Drag handle for reordering.",
    avoid: "For settings use `settings`.",
    synonyms: ["drag", "reorder", "handle", "перетащить", "ручка", "порядок"],
    related: ["more-v", "chevrons-up-down"],
  },
  "zoom-in": {
    use: "Zooming in.",
    synonyms: ["zoom in", "enlarge", "приблизить", "увеличить"],
    related: ["zoom-out", "search"],
  },
  "zoom-out": {
    use: "Zooming out.",
    synonyms: ["zoom out", "shrink", "отдалить", "уменьшить"],
    related: ["zoom-in", "search"],
  },
  "square": {
    use: "Empty checkbox or a placeholder shape.",
    avoid: "For a partial state use `minus`; for a checked one use `check`.",
    synonyms: ["checkbox", "empty", "placeholder", "чекбокс", "пусто", "квадрат"],
    related: ["check", "minus", "circle"],
  },

  // ── прочее ──
  "ticket": {
    use: "Ticket to an event, an entry pass.",
    avoid: "For a support ticket in this set use `message-square`.",
    synonyms: ["ticket", "pass", "entry", "билет", "проход", "вход на событие"],
    related: ["calendar", "booking", "map-pin"],
  },
  "cap": {
    use: "Education, a course, learning.",
    avoid: "For a music teacher as a role use `music-teacher`.",
    synonyms: ["education", "course", "learning", "обучение", "курс", "выпускник"],
    related: ["music-teacher", "lightbulb"],
  },
  "briefcase": {
    use: "Work, a job, business.",
    synonyms: ["work", "job", "business", "работа", "бизнес", "портфель"],
    related: ["building", "dollar-sign"],
  },
  "dollar-sign": {
    use: "Money: price, payout, budget.",
    synonyms: ["money", "price", "payment", "деньги", "цена", "оплата"],
    related: ["briefcase", "legal-consulting", "ticket"],
  },
  "plane": {
    use: "Flight, a trip, a tour.",
    avoid: "For a launch or a release use `rocket`.",
    synonyms: ["flight", "travel", "tour", "самолёт", "перелёт", "поездка"],
    related: ["train", "palmtree", "transport-logistics"],
  },
  "train": {
    use: "Train, ground travel.",
    synonyms: ["train", "rail", "поезд", "железная дорога"],
    related: ["plane", "transport-logistics", "map-pin"],
  },
  "palmtree": {
    use: "Holiday, time off, absence.",
    synonyms: ["vacation", "holiday", "away", "отпуск", "отдых", "недоступен"],
    related: ["plane", "calendar", "cake"],
  },
  "cake": {
    use: "Birthday, anniversary, a celebration.",
    synonyms: ["birthday", "anniversary", "celebration", "день рождения", "праздник", "торт"],
    related: ["palmtree", "calendar", "catering"],
  },
  "pill": {
    use: "Sick leave, medication, health.",
    synonyms: ["sick", "medicine", "health", "больничный", "лекарство", "здоровье"],
    related: ["thermometer", "palmtree"],
  },
  "thermometer": {
    use: "Illness, temperature, a health metric.",
    synonyms: ["temperature", "fever", "sick", "температура", "болезнь", "градусник"],
    related: ["pill", "gauge"],
  },
};
