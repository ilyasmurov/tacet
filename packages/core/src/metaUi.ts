// Semantics of the interface glyphs. This is where the wrong pick actually
// happens, so `avoid` is filled in wherever there is something to confuse.

import type { IconMeta } from "./metaTypes.js";

export const UI_META: Record<string, IconMeta> = {
  // ── navigation and sections ──
  "home": {
    use: "Main screen or root of the app.",
    avoid: "For a physical building or an organization use `building`.",
    synonyms: ["home", "main", "start", "dashboard", "главная", "домой", "начало"],
    related: ["building", "layout-grid"],
  },
  "inbox": {
    use: "Incoming items that still need triage.",
    avoid: "For email as a message use `mail`; inbox is a place, mail is a letter.",
    synonyms: ["inbox", "incoming", "triage", "входящие", "инбокс"],
    related: ["mail", "bell"],
  },
  "search": {
    use: "Search field or the action of searching.",
    synonyms: ["search", "find", "lookup", "magnifier", "поиск", "найти", "лупа"],
    related: ["filter"],
  },
  "filter": {
    use: "Narrowing a list by conditions.",
    avoid: "For grouping into levels use `layers`; filtering hides rows, grouping rearranges them.",
    synonyms: ["filter", "narrow", "conditions", "фильтр", "отбор"],
    related: ["search", "layers"],
  },
  "menu": {
    use: "Main navigation toggle, the burger.",
    avoid: "For a context menu on an element use `more-h` or `more-v`.",
    synonyms: ["menu", "burger", "hamburger", "nav", "меню", "бургер"],
    related: ["more-h", "more-v"],
  },
  "layout-grid": {
    use: "Grid view or a section overview.",
    synonyms: ["grid", "tiles", "layout", "overview", "сетка", "плитки", "обзор"],
    related: ["columns", "layers", "table"],
  },
  "grid": {
    use: "Catalogue of services or sections as tiles.",
    avoid: "For switching a list into grid view use `layout-grid`.",
    synonyms: ["catalogue", "services", "tiles", "каталог", "услуги", "плитка"],
    related: ["layout-grid", "columns"],
  },
  "columns": {
    use: "Board or column layout, kanban-style.",
    synonyms: ["columns", "board", "kanban", "колонки", "доска", "канбан"],
    related: ["folder-kanban", "layout-grid", "table"],
  },
  "table": {
    use: "Tabular data.",
    synonyms: ["table", "rows", "spreadsheet", "таблица", "строки"],
    related: ["layout-grid", "file-spreadsheet"],
  },
  "layers": {
    use: "Stacked or grouped entities, levels of a structure.",
    synonyms: ["layers", "stack", "groups", "levels", "слои", "стопка", "группы"],
    related: ["list-tree", "layout-grid"],
  },
  "list-tree": {
    use: "Hierarchy with nesting: subtasks, a tree of pages.",
    avoid: "For a flat list use `list-bulleted`.",
    synonyms: ["tree", "hierarchy", "nested", "subtasks", "дерево", "иерархия", "вложенность"],
    related: ["folder-tree", "layers", "list-bulleted"],
  },
  "list-checks": {
    use: "Checklist where items get ticked off.",
    avoid: "For an editable to-do inside a document use `list-todo`.",
    synonyms: ["checklist", "acceptance", "criteria", "чеклист", "критерии", "список задач"],
    related: ["list-todo", "check-circle"],
  },
  "collapse": {
    use: "Folding a section or a long block.",
    synonyms: ["collapse", "fold", "shrink", "свернуть", "схлопнуть", "сложить"],
    related: ["chevrons-up-down", "chevron-down"],
  },
  "workflow": {
    use: "Process made of steps, an automation pipeline.",
    avoid: "For version-control branching use `git-branch`.",
    synonyms: ["workflow", "pipeline", "automation", "process", "процесс", "автоматизация", "воркфлоу"],
    related: ["git-branch", "activity"],
  },

  // ── actions on an object ──
  "trash": {
    use: "Permanent deletion, the item is gone.",
    avoid: "If the item is only moved out of sight and can come back, that is `archive`. If access is being denied rather than data removed, use `ban`.",
    synonyms: ["delete", "remove", "bin", "trash", "удалить", "корзина", "мусор"],
    related: ["archive", "ban", "x"],
  },
  "archive": {
    use: "Moving out of the active list while keeping the data.",
    avoid: "Do not use for deletion — that is `trash`.",
    synonyms: ["archive", "store", "hide", "later", "архив", "убрать", "отложить"],
    related: ["trash", "box", "folder-input"],
  },
  "ban": {
    use: "Forbidding an action or blocking access.",
    avoid: "Not for deleting data (`trash`) and not for closing a window (`x`).",
    synonyms: ["ban", "block", "forbid", "denied", "запрет", "блокировка", "нельзя"],
    related: ["lock", "slash", "trash"],
  },
  "slash": {
    use: "Crossing something out: disabled, muted, not applicable.",
    avoid: "For an explicit prohibition use `ban`.",
    synonyms: ["disabled", "muted", "none", "off", "выключено", "перечёркнуто", "нет"],
    related: ["ban", "minus"],
  },
  "edit": {
    use: "Editing content: text, a field, a document.",
    avoid: "For editing a person's profile use `user-pen`; for settings use `settings`.",
    synonyms: ["edit", "pencil", "write", "rename", "правка", "редактировать", "карандаш"],
    related: ["user-pen", "highlighter", "clear-format"],
  },
  "copy": {
    use: "Copying to clipboard or duplicating an entity.",
    synonyms: ["copy", "duplicate", "clipboard", "копировать", "дубликат", "буфер"],
    related: ["paperclip", "file-add"],
  },
  "send": {
    use: "Sending a written message.",
    avoid: "For replying to a specific message use `reply`; for sharing a link use `link` or `external`.",
    synonyms: ["send", "submit", "message", "отправить", "послать"],
    related: ["reply", "mail", "megaphone"],
  },
  "reply": {
    use: "Replying to a specific message or comment.",
    synonyms: ["reply", "respond", "answer", "ответить", "ответ"],
    related: ["send", "message-square", "mention"],
  },
  "share": {
    use: "Sharing with others, passing an object onward.",
    avoid: "For copying a link use `link`; for a repost inside a feed use `repost`.",
    synonyms: ["share", "distribute", "send to", "поделиться", "расшарить"],
    related: ["link", "repost", "external"],
  },
  "repost": {
    use: "Republishing someone else's entry in your own feed.",
    synonyms: ["repost", "reshare", "boost", "репост", "поделиться записью"],
    related: ["share", "refresh"],
  },
  "download": {
    use: "Getting a file from the service onto the device.",
    avoid: "Direction matters: the arrow points at the receiver. Uploading to the service is `upload`.",
    synonyms: ["download", "save file", "export", "скачать", "загрузить себе", "выгрузка"],
    related: ["upload", "desktop-download", "file-up"],
  },
  "upload": {
    use: "Sending a file from the device into the service.",
    avoid: "The opposite of `download` — check the direction before using.",
    synonyms: ["upload", "import", "attach file", "загрузить", "залить", "импорт"],
    related: ["download", "file-add", "paperclip"],
  },
  "desktop-download": {
    use: "Downloading a desktop application.",
    avoid: "For a regular file use `download`.",
    synonyms: ["desktop app", "install", "client", "десктоп", "приложение", "установить"],
    related: ["download", "monitor", "app-window"],
  },
  "refresh": {
    use: "Reloading data or retrying.",
    avoid: "For a spinner during loading use `loading`.",
    synonyms: ["refresh", "reload", "retry", "sync", "обновить", "перезагрузить", "синхронизация"],
    related: ["loading", "rotate", "history"],
  },
  "rotate": {
    use: "Rotating an object or returning it to the starting position.",
    avoid: "For reloading data use `refresh`.",
    synonyms: ["rotate", "turn", "reset", "повернуть", "вращать", "сброс"],
    related: ["refresh", "history"],
  },
  "link": {
    use: "A link or a connection between entities.",
    avoid: "For opening in a new tab use `external`; for breaking the connection use `unlink`.",
    synonyms: ["link", "url", "connect", "relation", "ссылка", "связь", "привязать"],
    related: ["external", "unlink", "link-add", "task-link"],
  },
  "link-add": {
    use: "Inserting a link into text.",
    synonyms: ["insert link", "hyperlink", "anchor", "вставить ссылку", "гиперссылка"],
    related: ["link", "unlink", "external"],
  },
  "unlink": {
    use: "Breaking a link or a relation.",
    synonyms: ["unlink", "detach", "disconnect", "отвязать", "разорвать", "убрать связь"],
    related: ["link", "link-add"],
  },
  "external": {
    use: "Opening in a new tab or leaving for another site.",
    avoid: "Not a plain link — this one specifically means leaving the current context.",
    synonyms: ["external", "new tab", "open", "outside", "внешняя", "новая вкладка", "наружу"],
    related: ["link", "arrow-right"],
  },
  "task-link": {
    use: "Relation between tasks: blocks, duplicates, depends on.",
    avoid: "For an ordinary URL use `link`.",
    synonyms: ["task relation", "blocks", "depends", "связь задач", "зависимость", "блокирует"],
    related: ["link", "list-tree"],
  },
  "plus": {
    use: "Creating a new entity.",
    avoid: "For adding to an existing collection prefer a specific glyph: `folder-plus`, `user-plus`, `file-add`.",
    synonyms: ["add", "new", "create", "plus", "добавить", "создать", "плюс"],
    related: ["circle-plus", "file-add", "folder-plus", "user-plus"],
  },
  "circle-plus": {
    use: "Prominent create action: an empty state, a primary button.",
    avoid: "Inside a dense toolbar plain `plus` reads better.",
    synonyms: ["add", "create", "new item", "добавить", "создать", "плюс в круге"],
    related: ["plus", "file-add"],
  },
  "minus": {
    use: "Removing one item from a set or decreasing a value.",
    avoid: "For deleting an entity use `trash`; for a partial state in a checkbox this is the right glyph.",
    synonyms: ["minus", "remove", "decrease", "indeterminate", "минус", "убрать", "уменьшить"],
    related: ["plus", "slash", "square"],
  },

  // ── confirmation and state ──
  "check": {
    use: "A bare checkmark inside another control: a checkbox, a menu item, a chip.",
    avoid: "For the result of an operation — «done, succeeded» — use `check-circle`: it reads as a status, not as a mark.",
    synonyms: ["check", "tick", "mark", "галка", "птичка", "отметка"],
    related: ["check-circle", "check-check", "status-done"],
  },
  "check-circle": {
    use: "Successful outcome of an operation or a completed state.",
    avoid: "Inside a checkbox this is too loud — there use `check`.",
    synonyms: ["success", "done", "completed", "ok", "успех", "готово", "выполнено"],
    related: ["check", "status-done", "check-circle-active"],
  },
  "check-circle-active": {
    use: "The same success, filled: the state is on.",
    avoid: "For the neutral state use `check-circle`.",
    synonyms: ["done filled", "confirmed", "active", "подтверждено", "включено", "залитая галка"],
    related: ["check-circle", "status-done"],
  },
  "check-check": {
    use: "Double mark: delivered and read, everything is processed.",
    synonyms: ["read", "delivered", "all done", "прочитано", "доставлено", "все"],
    related: ["check", "check-circle"],
  },
  "x": {
    use: "Closing a window, a chip, a panel.",
    avoid: "For a failed operation use `circle-x`; for deleting an entity use `trash`.",
    synonyms: ["close", "dismiss", "cancel", "закрыть", "крестик", "отменить"],
    related: ["circle-x", "x-circle", "trash", "ban"],
  },
  "circle-x": {
    use: "Error or a failed operation.",
    avoid: "For closing a window use plain `x`.",
    synonyms: ["error", "failed", "rejected", "ошибка", "неудача", "отклонено"],
    related: ["x", "alert", "octagon-x", "status-canceled"],
  },
  "x-circle": {
    use: "Same as `circle-x`, kept for compatibility with sets that name it this way.",
    avoid: "In new code prefer `circle-x` — it is the primary name here.",
    synonyms: ["error", "cancel", "ошибка", "отмена"],
    related: ["circle-x"],
  },
  "octagon-x": {
    use: "Hard stop: the operation is forbidden or fatally broken.",
    avoid: "For an ordinary error use `circle-x` — the octagon is louder.",
    synonyms: ["stop", "fatal", "blocked", "стоп", "критично", "запрещено"],
    related: ["circle-x", "ban", "alert"],
  },
  "alert": {
    use: "A warning: something demands attention but has not broken yet.",
    avoid: "For an error that already happened use `circle-x`; for neutral information use `info`.",
    synonyms: ["warning", "attention", "caution", "предупреждение", "внимание", "осторожно"],
    related: ["info", "circle-x", "flag"],
  },
  "info": {
    use: "Neutral clarification or a hint.",
    avoid: "For a question that needs an answer use `help-circle`.",
    synonyms: ["info", "note", "details", "информация", "справка", "подсказка"],
    related: ["help-circle", "alert", "sticky-note"],
  },
  "help-circle": {
    use: "Help, documentation, an unclear place.",
    synonyms: ["help", "question", "support", "faq", "помощь", "вопрос", "поддержка"],
    related: ["info", "lightbulb"],
  },
  "loading": {
    use: "Process in progress, the result is not ready yet.",
    avoid: "For a manual reload button use `refresh`.",
    synonyms: ["loading", "spinner", "progress", "wait", "загрузка", "ожидание", "спиннер"],
    related: ["refresh", "hourglass", "timer"],
  },
  "hourglass": {
    use: "Waiting for something outside your control: a queue, an approval.",
    avoid: "For an active process use `loading`; for a countdown use `timer`.",
    synonyms: ["waiting", "pending", "queue", "ожидание", "очередь", "песочные часы"],
    related: ["loading", "timer", "clock"],
  },
  "timer": {
    use: "Countdown or time tracking.",
    avoid: "For a point in time use `clock`; for waiting in a queue use `hourglass`.",
    synonyms: ["timer", "countdown", "stopwatch", "таймер", "секундомер", "отсчёт"],
    related: ["clock", "hourglass"],
  },
  "clock": {
    use: "Time as a value: a deadline, a schedule, a timestamp.",
    avoid: "For a running countdown use `timer`.",
    synonyms: ["time", "schedule", "deadline", "время", "часы", "срок"],
    related: ["calendar-clock", "timer", "history"],
  },
  "history": {
    use: "History of changes, a previous version, an undo.",
    synonyms: ["history", "log", "revert", "past", "история", "изменения", "откат"],
    related: ["clock", "rotate", "activity"],
  },

  // ── task statuses ──
  "status-backlog": {
    use: "Task exists but nobody committed to it yet.",
    avoid: "If the task is planned for work use `status-todo`.",
    synonyms: ["backlog", "someday", "unplanned", "бэклог", "когда-нибудь", "не в плане"],
    related: ["status-todo", "circle"],
  },
  "status-todo": {
    use: "Planned and waiting to be started.",
    avoid: "For an unplanned pile use `status-backlog`.",
    synonyms: ["todo", "planned", "next", "к работе", "запланировано", "в очереди"],
    related: ["status-backlog", "status-progress"],
  },
  "status-progress": {
    use: "Somebody is working on it right now.",
    synonyms: ["in progress", "doing", "wip", "в работе", "делается", "начато"],
    related: ["status-todo", "status-done", "loading"],
  },
  "status-done": {
    use: "Task finished as a status in a workflow.",
    avoid: "For a one-off success message use `check-circle`: status glyphs belong to a lifecycle.",
    synonyms: ["done", "finished", "closed", "готово", "завершено", "сделано"],
    related: ["check-circle", "status-progress"],
  },
  "status-canceled": {
    use: "Task dropped: it will not be done.",
    avoid: "For an error use `circle-x`; cancelling is a decision, not a failure.",
    synonyms: ["canceled", "dropped", "won't do", "отменено", "не будем", "закрыто без работы"],
    related: ["circle-x", "ban", "status-done"],
  },
  "circle": {
    use: "Empty state marker: nothing selected, no status.",
    avoid: "For a specific lifecycle state prefer a `status-*` glyph.",
    synonyms: ["empty", "none", "unset", "circle", "пусто", "не задано", "круг"],
    related: ["circle-dot", "dot", "status-backlog"],
  },
  "circle-dot": {
    use: "Chosen option in a radio group, current position.",
    synonyms: ["radio", "selected", "current", "выбрано", "радио", "текущее"],
    related: ["circle", "dot", "target"],
  },
  "dot": {
    use: "Tiny marker: unread, a change, presence.",
    avoid: "Never as a separator between text fragments.",
    synonyms: ["dot", "unread", "badge", "точка", "непрочитано", "индикатор"],
    related: ["circle-dot", "circle"],
  },

  // ── priorities ──
  "priority-low": {
    use: "Low priority. Colour is baked into the glyph.",
    avoid: "Do not recolour with currentColor — the priority scale must stay recognisable.",
    synonyms: ["low priority", "minor", "низкий приоритет", "неважно"],
    related: ["priority-medium", "priority-high", "priority-urgent"],
  },
  "priority-medium": {
    use: "Normal priority, the default level.",
    synonyms: ["medium priority", "normal", "средний приоритет", "обычный"],
    related: ["priority-low", "priority-high"],
  },
  "priority-high": {
    use: "High priority, take it before the others.",
    synonyms: ["high priority", "important", "высокий приоритет", "важно"],
    related: ["priority-medium", "priority-urgent"],
  },
  "priority-urgent": {
    use: "Urgent: drop everything else.",
    avoid: "For a warning about a problem use `alert` — urgency is about order of work.",
    synonyms: ["urgent", "critical", "asap", "срочно", "критично", "горит"],
    related: ["priority-high", "alert", "zap"],
  },

  // ── files and folders ──
  "file": {
    use: "A file of unknown or generic type.",
    avoid: "When the type is known take a specific glyph: `file-image`, `file-video`, `file-spreadsheet`.",
    synonyms: ["file", "document", "файл", "документ"],
    related: ["file-add", "file-up", "attachment"],
  },
  "file-add": {
    use: "Creating or attaching a new file.",
    synonyms: ["new file", "attach", "add document", "новый файл", "приложить", "добавить документ"],
    related: ["file", "upload", "paperclip"],
  },
  "file-up": {
    use: "Sending a file outward: export, upload of a specific document.",
    avoid: "For a general upload button use `upload`.",
    synonyms: ["export file", "send document", "выгрузить файл", "экспорт документа"],
    related: ["upload", "download", "file"],
  },
  "file-image": {
    use: "Image file.",
    avoid: "For inserting a picture into text use `image`; for a camera use `camera`.",
    synonyms: ["image file", "picture", "photo", "картинка", "изображение", "фото"],
    related: ["image", "camera", "file"],
  },
  "file-video": {
    use: "Video file.",
    avoid: "For a call or a camera stream use `video`.",
    synonyms: ["video file", "movie", "clip", "видеофайл", "ролик", "видео"],
    related: ["video", "play", "file"],
  },
  "file-audio": {
    use: "Audio file.",
    synonyms: ["audio file", "sound", "recording", "аудиофайл", "звук", "запись"],
    related: ["music", "waveform", "headphones"],
  },
  "file-archive": {
    use: "Archive: zip, tar and friends.",
    avoid: "For archiving an entity in the product use `archive` — this one is a file format.",
    synonyms: ["zip", "archive file", "compressed", "архив", "зип", "сжатый файл"],
    related: ["archive", "file", "box"],
  },
  "file-spreadsheet": {
    use: "Spreadsheet as a file.",
    avoid: "For a table inside the interface use `table`.",
    synonyms: ["spreadsheet", "excel", "csv", "таблица файлом", "эксель"],
    related: ["table", "file"],
  },
  "presentation": {
    use: "Slides, a talk, a demo.",
    synonyms: ["slides", "deck", "presentation", "презентация", "слайды", "доклад"],
    related: ["file", "monitor"],
  },
  "attachment": {
    use: "Attached file on an entity.",
    avoid: "For the action of attaching use `paperclip`; this glyph is about the attachment itself.",
    synonyms: ["attachment", "attached", "вложение", "приложенный файл"],
    related: ["paperclip", "file", "file-add"],
  },
  "paperclip": {
    use: "Action of attaching a file.",
    synonyms: ["attach", "clip", "add file", "прикрепить", "скрепка", "приложить"],
    related: ["attachment", "file-add", "upload"],
  },
  "folder-open": {
    use: "Open folder, current location.",
    avoid: "For a kanban project use `folder-kanban`.",
    synonyms: ["folder", "open folder", "directory", "папка", "открытая папка", "каталог"],
    related: ["folder-plus", "folder-tree", "folder-input"],
  },
  "folder-plus": {
    use: "Creating a folder.",
    synonyms: ["new folder", "create folder", "новая папка", "создать папку"],
    related: ["folder-open", "plus"],
  },
  "folder-input": {
    use: "Moving something into a folder.",
    avoid: "For plain archiving use `archive`.",
    synonyms: ["move to folder", "file into", "переместить в папку", "положить"],
    related: ["folder-open", "archive", "box"],
  },
  "folder-tree": {
    use: "Folder structure with nesting.",
    synonyms: ["folder tree", "structure", "дерево папок", "структура"],
    related: ["list-tree", "folder-open", "layers"],
  },
  "folder-kanban": {
    use: "Project as a place where work lives.",
    avoid: "For a plain directory use `folder-open`.",
    synonyms: ["project", "workspace", "проект", "рабочая область"],
    related: ["columns", "folder-open"],
  },
  "box": {
    use: "Package, storage, a bundle of things.",
    avoid: "For archiving an entity use `archive`; for a released version use `rocket`.",
    synonyms: ["package", "storage", "bundle", "коробка", "хранилище", "пакет"],
    related: ["archive", "database", "folder-input"],
  },

  // ── text editor ──
  "bold": {
    use: "Bold weight for the selected text.",
    synonyms: ["bold", "strong", "жирный", "полужирный"],
    related: ["italic", "underline", "highlighter"],
  },
  "italic": {
    use: "Italic style for the selected text.",
    synonyms: ["italic", "emphasis", "курсив", "наклонный"],
    related: ["bold", "underline"],
  },
  "underline": {
    use: "Underline for the selected text.",
    avoid: "On the web underline usually means a link — check that the text is not clickable.",
    synonyms: ["underline", "подчёркнутый", "подчеркнуть"],
    related: ["bold", "italic", "strikethrough"],
  },
  "strikethrough": {
    use: "Struck-through text: outdated, no longer valid.",
    synonyms: ["strikethrough", "crossed out", "зачёркнутый", "перечеркнуть"],
    related: ["underline", "clear-format"],
  },
  "highlighter": {
    use: "Highlighting a fragment with colour.",
    avoid: "For editing text use `edit`.",
    synonyms: ["highlight", "marker", "выделить", "маркер", "подсветить"],
    related: ["edit", "bold"],
  },
  "clear-format": {
    use: "Stripping formatting back to plain text.",
    synonyms: ["clear formatting", "plain text", "очистить формат", "убрать стили"],
    related: ["bold", "strikethrough", "edit"],
  },
  "list-bulleted": {
    use: "Unordered list.",
    avoid: "For a numbered one use `list-numbered`; for a checklist use `list-todo`.",
    synonyms: ["bullet list", "unordered", "маркированный список", "список"],
    related: ["list-numbered", "list-todo", "list-tree"],
  },
  "list-numbered": {
    use: "Ordered list where the order matters.",
    synonyms: ["numbered list", "ordered", "нумерованный список", "по порядку"],
    related: ["list-bulleted", "list-todo"],
  },
  "list-todo": {
    use: "Checklist inside a document, items can be ticked.",
    avoid: "For acceptance criteria on a task use `list-checks`.",
    synonyms: ["todo list", "checkboxes", "список задач", "чекбоксы", "пункты"],
    related: ["list-checks", "list-bulleted", "check"],
  },
  "quote": {
    use: "Quotation block.",
    synonyms: ["quote", "blockquote", "citation", "цитата", "цитирование"],
    related: ["code-block", "divider"],
  },
  "code-inline": {
    use: "Code inside a line of text.",
    avoid: "For a multi-line block use `code-block`.",
    synonyms: ["inline code", "monospace", "код в строке", "моноширинный"],
    related: ["code-block", "code"],
  },
  "code-block": {
    use: "Multi-line code block.",
    synonyms: ["code block", "snippet", "блок кода", "сниппет"],
    related: ["code-inline", "code"],
  },
  "code": {
    use: "Code in general: a repository, a technical section, a developer.",
    avoid: "For code inside a document use `code-inline` or `code-block`.",
    synonyms: ["code", "development", "engineering", "код", "разработка", "программирование"],
    related: ["code-block", "git-branch", "bug"],
  },
  "heading-1": {
    use: "Top-level heading.",
    synonyms: ["h1", "title", "heading", "заголовок", "первый уровень"],
    related: ["heading-2", "heading-3"],
  },
  "heading-2": {
    use: "Second-level heading.",
    synonyms: ["h2", "subtitle", "подзаголовок", "второй уровень"],
    related: ["heading-1", "heading-3"],
  },
  "heading-3": {
    use: "Third-level heading.",
    synonyms: ["h3", "small heading", "третий уровень", "мелкий заголовок"],
    related: ["heading-1", "heading-2"],
  },
  "divider": {
    use: "Horizontal rule between blocks.",
    avoid: "Do not use as decoration between inline items.",
    synonyms: ["divider", "separator", "hr", "разделитель", "линия"],
    related: ["minus", "quote"],
  },
  "indent": {
    use: "Increasing indentation, nesting deeper.",
    synonyms: ["indent", "nest", "отступ", "вложить"],
    related: ["outdent", "list-tree"],
  },
  "outdent": {
    use: "Decreasing indentation.",
    synonyms: ["outdent", "unnest", "убрать отступ", "поднять уровень"],
    related: ["indent"],
  },
  "align-left": {
    use: "Left alignment.",
    synonyms: ["align left", "по левому краю", "влево"],
    related: ["align-center", "align-right", "align-justify"],
  },
  "align-center": {
    use: "Centre alignment.",
    synonyms: ["align center", "по центру", "центрировать"],
    related: ["align-left", "align-right"],
  },
  "align-right": {
    use: "Right alignment.",
    synonyms: ["align right", "по правому краю", "вправо"],
    related: ["align-left", "align-center"],
  },
  "align-justify": {
    use: "Justified alignment.",
    synonyms: ["justify", "по ширине", "выключка"],
    related: ["align-left", "align-center"],
  },
  "subscript": {
    use: "Subscript character.",
    synonyms: ["subscript", "нижний индекс", "подстрочный"],
    related: ["superscript"],
  },
  "superscript": {
    use: "Superscript character.",
    synonyms: ["superscript", "верхний индекс", "надстрочный"],
    related: ["subscript"],
  },
  "emoji-insert": {
    use: "Emoji picker.",
    avoid: "For a reaction already placed use `smile`.",
    synonyms: ["emoji", "smiley", "reaction", "эмодзи", "смайлик", "реакция"],
    related: ["smile", "image"],
  },
  "image": {
    use: "Inserting a picture into content.",
    avoid: "For an image file in a list use `file-image`.",
    synonyms: ["image", "picture", "insert photo", "картинка", "вставить изображение"],
    related: ["file-image", "camera", "palette"],
  },

  // ── visibility and access ──
  "eye": {
    use: "Showing something or a view counter.",
    synonyms: ["show", "visible", "preview", "views", "показать", "видно", "просмотры"],
    related: ["eye-off", "monitor"],
  },
  "eye-off": {
    use: "Hiding from view.",
    avoid: "Not the same as deleting or forbidding — the data stays, it is only out of sight.",
    synonyms: ["hide", "hidden", "invisible", "скрыть", "спрятать", "невидимо"],
    related: ["eye", "ban"],
  },
  "lock": {
    use: "Restricted access or a private object.",
    avoid: "For a forbidden action use `ban`; for a secret value use `key`.",
    synonyms: ["lock", "private", "secure", "closed", "замок", "приватно", "закрыто"],
    related: ["key", "shield", "ban"],
  },
  "key": {
    use: "A token, a password, an access credential.",
    synonyms: ["key", "token", "password", "credentials", "ключ", "токен", "пароль"],
    related: ["lock", "shield", "plug"],
  },
  "shield": {
    use: "Protection, security, a safety policy.",
    synonyms: ["security", "protection", "safety", "защита", "безопасность", "щит"],
    related: ["lock", "key", "ban"],
  },
  "verified": {
    use: "Verified account or confirmed authenticity.",
    avoid: "For a completed task use `check-circle`.",
    synonyms: ["verified", "trusted", "official", "проверено", "подтверждён", "официальный"],
    related: ["check-circle", "shield", "crown"],
  },
  "log-in": {
    use: "Signing in.",
    avoid: "Direction is easy to mix up: `log-in` goes inside, `log-out` goes away.",
    synonyms: ["login", "sign in", "enter", "войти", "вход", "авторизация"],
    related: ["log-out", "user"],
  },
  "log-out": {
    use: "Signing out.",
    avoid: "The opposite of `log-in` — check the arrow direction.",
    synonyms: ["logout", "sign out", "exit", "выйти", "выход"],
    related: ["log-in", "user"],
  },
};
