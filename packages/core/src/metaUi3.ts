// The September 2026 batch: audio routes, call controls, shields, files,
// window actions, feed glyphs, headings h4–h6, devices, money and the player.
// Split off like UI_META_2 — mechanically, so no single file grows past
// comfortable.

import type { IconMeta } from "./metaTypes.js";

export const UI_META_3: Record<string, IconMeta> = {
  // ── audio routes ──
  "speaker": {
    use: "Loudspeaker: phone speaker on, hands-free audio route.",
    avoid: "For a volume level use `volume`; for headphones use `headphones`.",
    synonyms: ["speaker", "loudspeaker", "speakerphone", "hands-free", "громкая связь", "динамик", "колонка"],
    related: ["receiver", "bluetooth", "headphones", "volume"],
  },
  "receiver": {
    use: "Earpiece: audio routed to the ear, phone held to the head.",
    avoid: "For the loud route use `speaker`; for a call as an action use `phone`.",
    synonyms: ["earpiece", "receiver", "ear", "handset audio", "разговорный динамик", "в ухо", "трубка"],
    related: ["speaker", "bluetooth", "phone", "headphones"],
  },
  "bluetooth": {
    use: "Bluetooth device or audio route: a wireless headset.",
    avoid: "For wired headphones use `headphones`; for network strength use `signal`.",
    synonyms: ["bluetooth", "wireless", "headset", "pairing", "блютус", "беспроводная гарнитура", "сопряжение"],
    related: ["speaker", "receiver", "headphones", "signal"],
  },

  // ── calls and volume ──
  "phone-hang-up": {
    use: "Ending the current call: the red button.",
    avoid: "For calls disabled or unavailable use `phone-off`; for a missed one use `phone-missed`.",
    synonyms: ["hang up", "end call", "decline", "положить трубку", "завершить звонок", "отклонить"],
    related: ["phone", "phone-off", "phone-missed"],
  },
  "switch-camera": {
    use: "Switching between front and back camera in a call.",
    avoid: "For reloading data use `refresh`; for turning an image use `rotate`.",
    synonyms: ["switch camera", "flip camera", "front camera", "переключить камеру", "фронтальная", "развернуть камеру"],
    related: ["video", "camera", "refresh"],
  },
  "volume-off": {
    use: "Sound muted: the player or the call is silent.",
    avoid: "For a muted microphone use `mic-off`; for muted notifications use `bell-off`.",
    synonyms: ["mute", "muted", "sound off", "без звука", "выключить звук", "заглушить"],
    related: ["volume", "volume-low", "mic-off", "bell-off"],
  },
  "volume-low": {
    use: "Quiet: the slider is near the bottom, sound still on.",
    avoid: "For the normal level use `volume`; for silence use `volume-off`.",
    synonyms: ["low volume", "quiet", "soft", "тихо", "малая громкость", "приглушить"],
    related: ["volume", "volume-off"],
  },

  // ── shield states ──
  "shield-off": {
    use: "Protection removed: an unprotected environment, access denied.",
    avoid: "For a forbidden action use `ban`; for a locked item use `lock`.",
    synonyms: ["unprotected", "no protection", "insecure", "access denied", "защита снята", "не защищено", "нет доступа"],
    related: ["shield", "shield-alert", "ban", "lock"],
  },
  "shield-alert": {
    use: "Security warning: a blocker, a policy violation, a risk.",
    avoid: "For a generic warning use `alert`; for verified or protected use `verified`.",
    synonyms: ["security alert", "blocker", "risk", "тревога", "блокер", "угроза безопасности"],
    related: ["shield", "shield-off", "alert", "verified"],
  },

  // ── folders and files ──
  "folder": {
    use: "Plain folder: a group of documents or entities.",
    avoid: "For a project board use `folder-kanban`; for the open state use `folder-open`.",
    synonyms: ["folder", "directory", "group", "папка", "каталог", "директория"],
    related: ["folder-open", "folder-plus", "folder-kanban", "file"],
  },
  "file-code": {
    use: "Source file, a build log, a snippet as a file.",
    avoid: "For code inside text use `code`; for a code block in the editor use `code-block`.",
    synonyms: ["code file", "source", "log", "script", "файл с кодом", "исходник", "лог сборки"],
    related: ["file", "code", "code-block", "terminal"],
  },
  "file-text": {
    use: "Text document as a file: Word, Markdown, a plain note.",
    avoid: "For a document as a work use `composition`; for a spreadsheet use `file-spreadsheet`.",
    synonyms: ["text file", "document", "docx", "markdown", "текстовый файл", "документ", "ворд"],
    related: ["file", "composition", "file-spreadsheet"],
  },
  "type": {
    use: "Text editing, typography, a font setting.",
    avoid: "For heading levels use `heading-1` and siblings; for bold use `bold`.",
    synonyms: ["text", "typography", "font", "letter", "текст", "шрифт", "типографика", "буква"],
    related: ["heading-1", "bold", "composition"],
  },

  // ── windows and actions ──
  "undo": {
    use: "Undo the last action, restore a previous version.",
    avoid: "For reloading data use `refresh`; for the version log use `history`.",
    synonyms: ["undo", "revert", "restore", "отменить", "вернуть", "восстановить"],
    related: ["redo", "history", "refresh"],
  },
  "redo": {
    use: "Redo an undone action.",
    synonyms: ["redo", "repeat action", "forward", "повторить", "вернуть отменённое"],
    related: ["undo", "history"],
  },
  "maximize": {
    use: "Expanding a drawer, window or panel to full size.",
    avoid: "For going to another page use `external`; for the reverse use `minimize`.",
    synonyms: ["maximize", "expand", "fullscreen", "enlarge", "развернуть", "на весь экран", "увеличить окно"],
    related: ["minimize", "external", "app-window"],
  },
  "minimize": {
    use: "Collapsing a window or panel back to its compact size.",
    synonyms: ["minimize", "collapse", "shrink", "exit fullscreen", "свернуть", "уменьшить окно", "выйти из полноэкранного"],
    related: ["maximize", "chevrons-down-up"],
  },
  "panel-left": {
    use: "Toggle the left sidebar.",
    avoid: "For a right-hand panel use `panel-right`; for the main navigation use `menu`.",
    synonyms: ["sidebar", "left panel", "navigation panel", "боковая панель", "сайдбар", "левая панель"],
    related: ["panel-right", "menu", "columns"],
  },
  "panel-right": {
    use: "Toggle the right-hand panel: properties, comments, details.",
    synonyms: ["right panel", "inspector", "details panel", "правая панель", "инспектор", "детали"],
    related: ["panel-left", "columns"],
  },
  "chevrons-down-up": {
    use: "Collapse all: fold expanded rows or lanes.",
    avoid: "For a sort control use `chevrons-up-down`; for one block use `chevron-up`.",
    synonyms: ["collapse all", "fold", "свернуть все", "сложить", "свернуть дорожки"],
    related: ["chevrons-up-down", "chevron-up", "minimize"],
  },
  "arrow-down": {
    use: "Descending order, moving down, lowering.",
    avoid: "Do not flip `arrow-up` with CSS: the cuts land in the wrong place. For a dropdown use `chevron-down`.",
    synonyms: ["down", "descending", "decrease", "вниз", "по убыванию", "опустить"],
    related: ["arrow-up", "chevron-down", "download"],
  },
  "circle-dashed": {
    use: "Draft, planned or placeholder status: not yet real.",
    avoid: "For a plain empty status use `circle`; for a selected one use `circle-dot`.",
    synonyms: ["dashed circle", "draft", "placeholder", "pending", "пунктирный круг", "черновик", "заготовка"],
    related: ["circle", "circle-dot", "loading", "status-backlog"],
  },

  // ── sections and feed ──
  "gantt": {
    use: "Timeline view: tasks as bars on a time axis.",
    avoid: "For a board with columns use `columns`; for metrics use `bar-chart`.",
    synonyms: ["gantt", "timeline", "schedule chart", "roadmap", "гант", "таймлайн", "диаграмма ганта"],
    related: ["columns", "bar-chart", "calendar"],
  },
  "bar-chart": {
    use: "Analytics, statistics, a report with columns.",
    avoid: "For a pulse over time use `activity`; for a limit gauge use `gauge`.",
    synonyms: ["bar chart", "analytics", "statistics", "report", "столбчатая диаграмма", "аналитика", "статистика"],
    related: ["activity", "gauge", "gantt"],
  },
  "flame": {
    use: "Hot, urgent, trending: something on fire in the feed.",
    avoid: "For the tracker priority glyph use `priority-urgent`; for speed use `zap`.",
    synonyms: ["fire", "hot", "urgent", "trending", "огонь", "горит", "срочно", "в тренде"],
    related: ["priority-urgent", "zap", "star"],
  },
  "trophy": {
    use: "Achievement: sprint finished, goal reached, a winner.",
    avoid: "For a milestone ahead use `target`; for an owner badge use `crown`.",
    synonyms: ["trophy", "achievement", "winner", "award", "кубок", "достижение", "победа", "награда"],
    related: ["target", "crown", "star"],
  },
  "alarm-clock": {
    use: "Deadline, a reminder at a set time.",
    avoid: "For elapsed or remaining time use `timer`; for a plain time use `clock`.",
    synonyms: ["alarm", "deadline", "reminder", "due", "будильник", "дедлайн", "напоминание", "срок"],
    related: ["timer", "clock", "calendar", "bell"],
  },

  // ── editor headings ──
  "heading-4": {
    use: "Fourth-level heading.",
    synonyms: ["h4", "heading 4", "четвёртый уровень", "заголовок 4"],
    related: ["heading-3", "heading-5", "heading-6"],
  },
  "heading-5": {
    use: "Fifth-level heading.",
    synonyms: ["h5", "heading 5", "пятый уровень", "заголовок 5"],
    related: ["heading-4", "heading-6", "heading-1"],
  },
  "heading-6": {
    use: "Sixth-level heading, the smallest.",
    synonyms: ["h6", "heading 6", "шестой уровень", "заголовок 6", "мельчайший заголовок"],
    related: ["heading-5", "heading-4", "heading-1"],
  },

  // ── people and devices ──
  "qr-code": {
    use: "QR code: sign in from a phone, share by scanning.",
    avoid: "For a key or token use `key`; for the sign-in action itself use `log-in`.",
    synonyms: ["qr", "qr code", "scan", "кьюар", "qr-код", "сканировать", "вход по qr"],
    related: ["log-in", "key", "smartphone", "camera"],
  },
  "user-minus": {
    use: "Removing a participant from a document, room or list.",
    avoid: "For revoking access or kicking out use `user-x`; for blocking use `ban`.",
    synonyms: ["remove member", "unshare", "leave", "убрать участника", "исключить из списка", "отозвать приглашение"],
    related: ["user-x", "user-plus", "users"],
  },
  "tablet": {
    use: "Tablet as a device type in sessions and presence.",
    avoid: "For a phone use `smartphone`; for a desktop use `monitor`.",
    synonyms: ["tablet", "ipad", "pad", "планшет", "айпад"],
    related: ["smartphone", "monitor", "app-window"],
  },
  "terminal": {
    use: "Command line, a CLI or MCP client, a shell session.",
    avoid: "For a bot as a participant use `bot`; for a source file use `file-code`.",
    synonyms: ["terminal", "cli", "console", "shell", "command line", "терминал", "консоль", "командная строка"],
    related: ["code", "file-code", "bot", "monitor"],
  },
  "signal": {
    use: "Good connection: all bars lit.",
    avoid: "For a weak connection use `signal-low`; for no data use `signal-off`.",
    synonyms: ["signal", "connection", "full bars", "online", "сигнал", "связь", "хорошая связь"],
    related: ["signal-low", "signal-off", "cloud"],
  },
  "signal-off": {
    use: "No data on connection quality: measurement unavailable.",
    avoid: "For a weak but present link use `signal-low`.",
    synonyms: ["no signal", "no data", "unknown connection", "offline", "нет сигнала", "нет данных", "не измерено"],
    related: ["signal", "signal-low", "monitor-off"],
  },

  // ── money and player ──
  "credit-card": {
    use: "Card payment, a saved card, checkout.",
    avoid: "For a balance or an account use `wallet`; for a price use `dollar-sign`.",
    synonyms: ["card", "credit card", "payment", "checkout", "карта", "оплата картой", "банковская карта"],
    related: ["wallet", "dollar-sign", "ticket"],
  },
  "wallet": {
    use: "Balance, funds, payout account.",
    avoid: "For paying with a card use `credit-card`.",
    synonyms: ["wallet", "balance", "funds", "payout", "кошелёк", "баланс", "средства", "выплата"],
    related: ["credit-card", "dollar-sign", "briefcase"],
  },
  "skip-back": {
    use: "Previous track or restart the current one.",
    synonyms: ["previous", "skip back", "rewind", "предыдущий трек", "назад", "в начало"],
    related: ["skip-forward", "play", "pause"],
  },
  "skip-forward": {
    use: "Next track.",
    synonyms: ["next", "skip forward", "следующий трек", "вперёд", "пропустить"],
    related: ["skip-back", "play", "pause"],
  },
  "repeat": {
    use: "Repeat mode in the player: loop the track or the list.",
    avoid: "For sharing a post again use `repost`; for reloading use `refresh`.",
    synonyms: ["repeat", "loop", "повтор", "зациклить", "по кругу"],
    related: ["shuffle", "repost", "play"],
  },
  "shuffle": {
    use: "Shuffle mode: random order of playback.",
    avoid: "For sorting a table use `chevrons-up-down`.",
    synonyms: ["shuffle", "random", "mix", "перемешать", "случайный порядок", "вразнобой"],
    related: ["repeat", "play", "music"],
  },

  // ── base interface glyphs (TACET-25) ──
  "cog": {
    use: "Gear: settings entry point when a gear is expected, not sliders.",
    avoid: "The set's `settings` is three sliders — take it where sliders already live; for a person's account use `user-cog`; for tooling use `wrench`.",
    synonyms: ["gear", "cog", "settings", "preferences", "шестерёнка", "настройки", "параметры"],
    related: ["settings", "user-cog", "wrench"],
  },
  "printer": {
    use: "Printing, export to paper, a print preview.",
    avoid: "For saving a file use `save`; for a downloaded copy use `download`.",
    synonyms: ["print", "printer", "hard copy", "печать", "принтер", "распечатать", "на бумагу"],
    related: ["save", "download", "file-text"],
  },
  "clipboard": {
    use: "Clipboard: copy a link or an id, paste into a form.",
    avoid: "For duplicating an entity use `copy`; for a plain document use `file-text`.",
    synonyms: ["clipboard", "copy link", "paste", "буфер обмена", "скопировать ссылку", "вставить"],
    related: ["copy", "file-text", "link"],
  },
  "save": {
    use: "Saving changes, keeping a draft.",
    avoid: "For pulling a file to the device use `download`; for a paper copy use `printer`.",
    synonyms: ["save", "keep", "store", "floppy", "сохранить", "запомнить", "сохранение"],
    related: ["download", "printer", "check"],
  },
  "sort": {
    use: "Sorting a list or a feed: the order mode itself.",
    avoid: "For a sortable table header use `chevrons-up-down`; for narrowing a set use `filter`.",
    synonyms: ["sort", "order", "arrange", "sort by", "сортировка", "порядок", "упорядочить"],
    related: ["chevrons-up-down", "filter", "arrow-down"],
  },
  "move": {
    use: "Moving an object freely: drag a card, a block, a shape.",
    avoid: "For the drag handle itself use `grip`; for reordering rows use `chevrons-up-down`.",
    synonyms: ["move", "drag", "reposition", "pan", "переместить", "перетащить", "двигать"],
    related: ["grip", "chevrons-up-down", "maximize"],
  },
  "unlock": {
    use: "Access opened: a public item, an unlocked field.",
    avoid: "For the closed state use `lock`; for protection removed use `shield-off`.",
    synonyms: ["unlock", "unlocked", "open access", "разблокировать", "открыть доступ", "снять замок"],
    related: ["lock", "key", "shield-off"],
  },
  "scissors": {
    use: "Cut: move a fragment out to the clipboard, trim a piece.",
    avoid: "For copying use `copy`; for deleting use `trash`.",
    synonyms: ["cut", "scissors", "trim", "вырезать", "ножницы", "обрезать"],
    related: ["copy", "clipboard", "trash"],
  },
  "translate": {
    use: "Translating text into another language.",
    avoid: "For an interface language or a public item use `globe`; for typography use `type`.",
    synonyms: ["translate", "translation", "language pair", "перевод", "перевести", "на другой язык"],
    related: ["globe", "type", "composition"],
  },
};
