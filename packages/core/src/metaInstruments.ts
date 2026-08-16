// Instruments and musical roles. The short form: what matters here is that the
// glyph is found by its name in either language, and mixing up a saxophone with
// a trumpet takes effort — so `avoid` appears only where confusion is real.

import type { IconMeta } from "./metaTypes.js";

export const INSTRUMENT_META: Record<string, IconMeta> = {
  "vocals": {
    use: "Vocals, singing, a lead singer.",
    avoid: "For a microphone as a device use `mic`.",
    synonyms: ["vocals", "singer", "voice", "вокал", "певец", "голос"],
    related: ["mic", "backing-vocals", "mc-rap"],
  },
  "backing-vocals": {
    use: "Backing vocals.",
    synonyms: ["backing vocals", "chorus", "бэк-вокал", "подпевка"],
    related: ["vocals"],
  },
  "guitar-electric": {
    use: "Electric guitar.",
    synonyms: ["electric guitar", "guitar", "электрогитара", "гитара"],
    related: ["guitar-acoustic", "guitar-bass"],
  },
  "guitar-acoustic": {
    use: "Acoustic guitar.",
    synonyms: ["acoustic guitar", "guitar", "акустическая гитара", "акустика"],
    related: ["guitar-electric", "ukulele"],
  },
  "guitar-bass": {
    use: "Bass guitar.",
    avoid: "For an upright bass use `double-bass`.",
    synonyms: ["bass guitar", "bass", "бас-гитара", "бас"],
    related: ["guitar-electric", "double-bass"],
  },
  "drums": {
    use: "Drum kit, a drummer.",
    avoid: "For hand percussion use `percussion`, `djembe`, `cajon`.",
    synonyms: ["drums", "drum kit", "drummer", "ударные", "барабаны", "драммер"],
    related: ["percussion", "cajon", "timpani"],
  },
  "piano": {
    use: "Piano, grand piano.",
    avoid: "For a stage keyboard use `keyboards`, for a synth use `synthesizer`.",
    synonyms: ["piano", "grand piano", "фортепиано", "пианино", "рояль"],
    related: ["keyboards", "synthesizer"],
  },
  "keyboards": {
    use: "Stage keyboards.",
    synonyms: ["keyboards", "keys", "клавишные", "клавиши"],
    related: ["piano", "synthesizer"],
  },
  "synthesizer": {
    use: "Synthesizer.",
    synonyms: ["synthesizer", "synth", "синтезатор", "синт"],
    related: ["keyboards", "sampler"],
  },
  "violin": {
    use: "Violin.",
    avoid: "The viola looks similar — check that you need `viola`.",
    synonyms: ["violin", "fiddle", "скрипка"],
    related: ["viola", "cello"],
  },
  "viola": {
    use: "Viola.",
    avoid: "Easy to mix up with `violin`.",
    synonyms: ["viola", "альт"],
    related: ["violin", "cello"],
  },
  "cello": {
    use: "Cello.",
    synonyms: ["cello", "виолончель"],
    related: ["violin", "double-bass"],
  },
  "double-bass": {
    use: "Upright double bass.",
    avoid: "For the electric one use `guitar-bass`.",
    synonyms: ["double bass", "upright bass", "контрабас"],
    related: ["cello", "guitar-bass"],
  },
  "harp": {
    use: "Harp.",
    synonyms: ["harp", "арфа"],
    related: ["gusli", "piano"],
  },
  "flute": {
    use: "Flute.",
    avoid: "For the small one use `piccolo`, for a recorder use `recorder`.",
    synonyms: ["flute", "флейта"],
    related: ["piccolo", "recorder", "clarinet"],
  },
  "piccolo": {
    use: "Piccolo flute.",
    synonyms: ["piccolo", "пикколо", "малая флейта"],
    related: ["flute"],
  },
  "recorder": {
    use: "Recorder, the wooden one.",
    avoid: "Not audio recording — for that use `file-audio` or `mic`.",
    synonyms: ["recorder", "блокфлейта"],
    related: ["flute"],
  },
  "clarinet": {
    use: "Clarinet.",
    synonyms: ["clarinet", "кларнет"],
    related: ["oboe", "saxophone"],
  },
  "oboe": {
    use: "Oboe.",
    synonyms: ["oboe", "гобой"],
    related: ["clarinet", "bassoon"],
  },
  "bassoon": {
    use: "Bassoon.",
    synonyms: ["bassoon", "фагот"],
    related: ["oboe", "clarinet"],
  },
  "saxophone": {
    use: "Saxophone.",
    synonyms: ["saxophone", "sax", "саксофон", "сакс"],
    related: ["clarinet", "trumpet"],
  },
  "trumpet": {
    use: "Trumpet.",
    synonyms: ["trumpet", "труба"],
    related: ["trombone", "french-horn", "tuba"],
  },
  "trombone": {
    use: "Trombone.",
    synonyms: ["trombone", "тромбон"],
    related: ["trumpet", "tuba"],
  },
  "french-horn": {
    use: "French horn.",
    synonyms: ["french horn", "horn", "валторна"],
    related: ["trumpet", "tuba"],
  },
  "tuba": {
    use: "Tuba.",
    synonyms: ["tuba", "туба"],
    related: ["trombone", "french-horn"],
  },
  "harmonica": {
    use: "Harmonica.",
    synonyms: ["harmonica", "harp", "губная гармошка", "гармоника"],
    related: ["accordion", "jaw-harp"],
  },
  "accordion": {
    use: "Accordion.",
    avoid: "For the Russian button variety use `bayan`.",
    synonyms: ["accordion", "аккордеон"],
    related: ["bayan", "harmonica"],
  },
  "bayan": {
    use: "Bayan, the Russian button accordion.",
    synonyms: ["bayan", "button accordion", "баян"],
    related: ["accordion", "balalaika"],
  },
  "balalaika": {
    use: "Balalaika.",
    synonyms: ["balalaika", "балалайка"],
    related: ["domra", "gusli", "bayan"],
  },
  "domra": {
    use: "Domra.",
    synonyms: ["domra", "домра"],
    related: ["balalaika", "mandolin"],
  },
  "gusli": {
    use: "Gusli.",
    synonyms: ["gusli", "гусли"],
    related: ["harp", "balalaika"],
  },
  "banjo": {
    use: "Banjo.",
    synonyms: ["banjo", "банджо"],
    related: ["mandolin", "guitar-acoustic"],
  },
  "mandolin": {
    use: "Mandolin.",
    synonyms: ["mandolin", "мандолина"],
    related: ["banjo", "domra"],
  },
  "ukulele": {
    use: "Ukulele.",
    synonyms: ["ukulele", "uke", "укулеле"],
    related: ["guitar-acoustic", "banjo"],
  },
  "sitar": {
    use: "Sitar.",
    synonyms: ["sitar", "ситар"],
    related: ["guitar-acoustic", "duduk"],
  },
  "duduk": {
    use: "Duduk.",
    synonyms: ["duduk", "дудук"],
    related: ["flute", "bagpipes"],
  },
  "bagpipes": {
    use: "Bagpipes.",
    synonyms: ["bagpipes", "волынка"],
    related: ["duduk", "didgeridoo"],
  },
  "jaw-harp": {
    use: "Jaw harp.",
    synonyms: ["jaw harp", "mouth harp", "варган"],
    related: ["harmonica", "kalimba"],
  },
  "didgeridoo": {
    use: "Didgeridoo.",
    synonyms: ["didgeridoo", "диджериду"],
    related: ["bagpipes", "handpan"],
  },
  "kalimba": {
    use: "Kalimba, the thumb piano.",
    synonyms: ["kalimba", "thumb piano", "калимба"],
    related: ["handpan", "xylophone"],
  },
  "handpan": {
    use: "Handpan, hang.",
    synonyms: ["handpan", "hang", "ханг", "хэндпан"],
    related: ["kalimba", "percussion"],
  },
  "percussion": {
    use: "Percussion in general.",
    avoid: "For a drum kit use `drums`.",
    synonyms: ["percussion", "перкуссия", "ударные инструменты"],
    related: ["drums", "conga", "bongo", "djembe"],
  },
  "djembe": {
    use: "Djembe.",
    synonyms: ["djembe", "джембе"],
    related: ["conga", "bongo", "percussion"],
  },
  "conga": {
    use: "Conga.",
    synonyms: ["conga", "конга"],
    related: ["bongo", "djembe"],
  },
  "bongo": {
    use: "Bongos.",
    synonyms: ["bongo", "бонго"],
    related: ["conga", "djembe"],
  },
  "cajon": {
    use: "Cajón.",
    synonyms: ["cajon", "кахон"],
    related: ["percussion", "drums"],
  },
  "timpani": {
    use: "Timpani.",
    synonyms: ["timpani", "kettledrums", "литавры"],
    related: ["drums", "percussion"],
  },
  "xylophone": {
    use: "Xylophone.",
    avoid: "Marimba and vibraphone look close — check which one you mean.",
    synonyms: ["xylophone", "ксилофон"],
    related: ["marimba", "vibraphone"],
  },
  "marimba": {
    use: "Marimba.",
    synonyms: ["marimba", "маримба"],
    related: ["xylophone", "vibraphone"],
  },
  "vibraphone": {
    use: "Vibraphone.",
    synonyms: ["vibraphone", "vibes", "вибрафон"],
    related: ["marimba", "xylophone"],
  },
  "turntables": {
    use: "Turntables, vinyl decks.",
    avoid: "For the person use `dj`.",
    synonyms: ["turntables", "decks", "vinyl", "вертушки", "винил"],
    related: ["dj", "disc", "sampler"],
  },
  "sampler": {
    use: "Sampler, pad controller.",
    synonyms: ["sampler", "pads", "mpc", "семплер", "пэды"],
    related: ["beatmaker", "synthesizer", "turntables"],
  },
  "dj": {
    use: "DJ as a role.",
    synonyms: ["dj", "disc jockey", "диджей"],
    related: ["turntables", "beatmaker"],
  },
  "beatbox": {
    use: "Beatboxing.",
    synonyms: ["beatbox", "битбокс"],
    related: ["vocals", "mc-rap"],
  },
  "mc-rap": {
    use: "MC, rapper.",
    synonyms: ["mc", "rap", "rapper", "рэп", "эмси", "рэпер"],
    related: ["vocals", "beatbox"],
  },
  "producer": {
    use: "Producer of a track or a record.",
    avoid: "For beat-making specifically use `beatmaker`; for mixing use `sound-engineer`.",
    synonyms: ["producer", "продюсер"],
    related: ["beatmaker", "sound-engineer", "composer"],
  },
  "beatmaker": {
    use: "Beatmaker.",
    synonyms: ["beatmaker", "beats", "битмейкер", "биты"],
    related: ["producer", "sampler"],
  },
  "sound-engineer": {
    use: "Sound engineer.",
    avoid: "For the service of mixing a track use `mixing`.",
    synonyms: ["sound engineer", "audio engineer", "звукорежиссёр", "звукач"],
    related: ["mixing", "mastering", "recording"],
  },
  "composer": {
    use: "Composer.",
    avoid: "For lyrics use `songwriter`; for arrangement use `arranger`.",
    synonyms: ["composer", "композитор"],
    related: ["songwriter", "arranger", "conductor"],
  },
  "songwriter": {
    use: "Songwriter, author of lyrics.",
    synonyms: ["songwriter", "lyricist", "автор песен", "поэт"],
    related: ["composer", "arranger"],
  },
  "arranger": {
    use: "Arranger.",
    synonyms: ["arranger", "arrangement", "аранжировщик", "аранжировка"],
    related: ["composer", "producer"],
  },
  "conductor": {
    use: "Conductor.",
    synonyms: ["conductor", "дирижёр"],
    related: ["composer", "music-teacher"],
  },
  "music-teacher": {
    use: "Music teacher, lessons.",
    avoid: "For general education use `cap`.",
    synonyms: ["music teacher", "lessons", "преподаватель", "уроки музыки", "педагог"],
    related: ["cap", "conductor"],
  },
  "other": {
    use: "Instrument or role outside the list.",
    avoid: "Only as a fallback — if the specific glyph exists, take it.",
    synonyms: ["other", "misc", "другое", "прочее"],
    related: ["note", "music"],
  },
};
