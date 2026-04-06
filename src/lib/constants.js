// ── STORY CONFIG ──
export const TOTAL_PAGES = 6;

// ── VALUES (no emojis — icons handled in UI) ──
export const VALS = {
  // Positive
  generosity:  { n:"Щедрость",     nEn:"Generosity",   c:"#D4845A", pos: true },
  empathy:     { n:"Сочувствие",   nEn:"Empathy",      c:"#9B7CB8", pos: true },
  courage:     { n:"Смелость",     nEn:"Courage",      c:"#E85D75", pos: true },
  curiosity:   { n:"Любопытство",  nEn:"Curiosity",    c:"#7A9E7E", pos: true },
  kindness:    { n:"Доброта",      nEn:"Kindness",     c:"#C49A5C", pos: true },
  honesty:     { n:"Честность",    nEn:"Honesty",      c:"#8BA88E", pos: true },
  patience:    { n:"Терпение",     nEn:"Patience",     c:"#6B9DAB", pos: true },
  teamwork:    { n:"Дружба",       nEn:"Teamwork",     c:"#7B8EC4", pos: true },
  // Negative
  selfishness: { n:"Жадность",     nEn:"Selfishness",  c:"#8B4C4C", pos: false },
  cowardice:   { n:"Трусость",     nEn:"Cowardice",    c:"#7B6B5C", pos: false },
  cruelty:     { n:"Жестокость",   nEn:"Cruelty",      c:"#6B3A3A", pos: false },
  greed:       { n:"Алчность",     nEn:"Greed",        c:"#8B7B3C", pos: false },
  laziness:    { n:"Лень",         nEn:"Laziness",     c:"#6B6B6B", pos: false },
  dishonesty:  { n:"Обман",        nEn:"Dishonesty",   c:"#5C4C6B", pos: false },
  aggression:  { n:"Агрессия",     nEn:"Aggression",   c:"#8B3C3C", pos: false },
  indifference:{ n:"Равнодушие",   nEn:"Indifference", c:"#5C6B7B", pos: false },
};

// ── ART STYLES ──
export const ART_STYLES = {
  book: {
    fantasy: "A scanned page from a vintage 1980s hand-painted children's book. Thick gouache and watercolor on grainy cream paper, rough visible brushstrokes, paint bleeding at edges, slightly uneven color fills, paper texture showing through thin washes. Warm muted earthy palette like ochre, burnt sienna, sage green, dusty blue. Soft imperfect hand-drawn outlines. Style of classic European picture book illustrators. Analog traditional media artwork scan, NOT digital, NOT CGI, NOT 3D, NOT vector, NOT clean lines",
    realistic: "A scanned watercolor illustration from a handmade children's picture book. Wet-on-wet watercolor technique on cold-pressed paper, visible paper grain and paint puddles, soft color bleeding between areas, pencil sketch lines visible underneath paint. Muted natural palette. Traditional analog artwork scan, NOT digital rendering"
  },
  anime: {
    fantasy: "Anime-inspired digital illustration, vibrant colors, expressive characters with large eyes. Style like Studio Ghibli or Makoto Shinkai. Cinematic lighting, magical atmosphere. Professional animation quality",
    realistic: "Anime-inspired semi-realistic illustration, similar to Makoto Shinkai. Rich real-world environment, warm natural lighting. Expressive character faces. Professional quality"
  },
  realistic: {
    fantasy: "Photorealistic fantasy illustration, cinematic lighting and composition. Detailed magical environment with realistic textures. Characters with realistic proportions and expressions. High quality digital art",
    realistic: "Photorealistic illustration, cinematic composition with depth of field. Detailed real-world environment. Natural lighting with warm tones. Characters with realistic proportions. High quality"
  }
};

// ── i18n ──
export const I18N = {
  ru: {
    interactiveStories: "Интерактивные сказки",
    skazka: "Сказка", vmeste: "Вместе",
    aiCreates: "ИИ создаёт уникальную сказку.", readTogether: "Вы читаете вместе с ребёнком.",
    yourName: "Ваше имя", email: "Email", login: "Войти",
    back: "Назад", dashboard: "Dashboard", hello: "Привет",
    children: "Дети", addChild: "Добавить", childName: "Имя ребёнка", years: "лет",
    addChildPlaceholder: "Добавьте ребёнка, чтобы начать",
    newSession: "Новая сессия", forWhom: "Для кого?", createStory: "Создать историю",
    history: "История", min: "мин", pages: "стр.",
    storyFor: "История для", whatAbout: "О чём будет история? Выберите идею или придумайте свою",
    storyIdeas: "Идеи для истории", more: "Ещё", generating: "Генерируем идеи…",
    noIdeas: "Не удалось загрузить. Нажмите «Ещё»", needKey: "Нужен API ключ для генерации идей",
    writeYourOwn: "Или напишите свою",
    premisePlaceholder: "Например: Мальчик хочет выиграть школьный чемпионат по шахматам...",
    anyGenre: "Реалистичная, фэнтези, фантастика — что угодно.",
    startStory: "Начать историю", clear: "Очистить",
    artStyle: "Стиль иллюстраций",
    styleBook: "Книжная иллюстрация", styleBookDesc: "Тёплая акварель, как в детских книгах",
    styleAnime: "Аниме", styleAnimeDesc: "Яркий стиль как Ghibli / Shinkai",
    styleRealistic: "Реалистичный", styleRealisticDesc: "Фотореалистичный стиль",
    settings: "Настройки", done: "Готово", logout: "Выйти",
    creatingStory: "Создаём сказку", continuing: "Продолжение…",
    end: "Конец", viewReport: "Смотреть отчёт",
    orCustom: "или придумайте свой вариант:", heroAction: "Что хочет сделать герой?..",
    speak: "Озвучить", stop: "Стоп", auto: "авто", sounds: "звуки", quiet: "тихо",
    sessionReport: "Отчёт сессии", journey: "Путешествие", choices: "выборов",
    choicesOf: "Выборы", fullStory: "Сказка целиком", decisionPath: "Путь выборов",
    newSessionBtn: "Новая сессия", dashboardBtn: "Дашборд",
    disclaimer: "Все истории создаются ИИ с фильтрацией контента по возрасту. Контент безопасен для детей, но рекомендуется присутствие родителя.",
    finish: "Завершить", page: "стр.", of: "из",
    parentPremise: "Предыстория от родителя", discussionQ: "Вопрос для обсуждения",
    ending: { good: "Счастливый конец", mixed: "Неоднозначный финал", sad: "Грустный конец" },
    whatNext: "Что дальше?",
    customPlaceholder: "Свой вариант...",
  },
  en: {
    interactiveStories: "Interactive Fairy Tales",
    skazka: "Story", vmeste: "Together",
    aiCreates: "AI creates a unique story.", readTogether: "Read it together with your child.",
    yourName: "Your name", email: "Email", login: "Enter",
    back: "Back", dashboard: "Dashboard", hello: "Hello",
    children: "Children", addChild: "Add", childName: "Child's name", years: "years old",
    addChildPlaceholder: "Add a child to begin",
    newSession: "New Session", forWhom: "For whom?", createStory: "Create Story",
    history: "History", min: "min", pages: "p.",
    storyFor: "Story for", whatAbout: "What will the story be about? Choose an idea or write your own",
    storyIdeas: "Story Ideas", more: "More", generating: "Generating ideas…",
    noIdeas: "Failed to load. Press «More»", needKey: "API key needed for ideas",
    writeYourOwn: "Or write your own",
    premisePlaceholder: "E.g.: A boy wants to win the school chess tournament...",
    anyGenre: "Realistic, fantasy, sci-fi — anything goes.",
    startStory: "Start Story", clear: "Clear",
    artStyle: "Illustration Style",
    styleBook: "Book Illustration", styleBookDesc: "Warm watercolor, like children's books",
    styleAnime: "Anime", styleAnimeDesc: "Bright Ghibli / Shinkai style",
    styleRealistic: "Realistic", styleRealisticDesc: "Photorealistic style",
    settings: "Settings", done: "Done", logout: "Log out",
    creatingStory: "Creating story", continuing: "Continuing…",
    end: "The End", viewReport: "View Report",
    orCustom: "or write your own action:", heroAction: "What does the hero want to do?..",
    speak: "Listen", stop: "Stop", auto: "auto", sounds: "sounds", quiet: "quiet",
    sessionReport: "Session Report", journey: "Journey of", choices: "choices",
    choicesOf: "Choices by", fullStory: "Full Story", decisionPath: "Decision Path",
    newSessionBtn: "New Session", dashboardBtn: "Dashboard",
    disclaimer: "All stories are AI-generated with age-appropriate content filtering. Content is safe for children, but parental supervision is recommended.",
    finish: "Finish", page: "p.", of: "of",
    parentPremise: "Parent's premise", discussionQ: "Discussion question",
    ending: { good: "Happy ending", mixed: "Mixed ending", sad: "Sad ending" },
    whatNext: "What next?",
    customPlaceholder: "Your own action...",
  }
};
