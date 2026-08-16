// Creators and services around music. The short form, but `avoid` is there
// wherever a lookalike role lives next door: shooting a concert and cutting the
// footage are done by different people.

import type { IconMeta } from "./metaTypes.js";

export const SERVICE_META: Record<string, IconMeta> = {
  "photographer": {
    use: "Photographer as a service.",
    avoid: "For the act of taking a photo use `camera`.",
    synonyms: ["photographer", "photo", "фотограф", "фотосъёмка"],
    related: ["camera", "videographer", "artwork-design"],
  },
  "videographer": {
    use: "Videographer, shooting video.",
    avoid: "For a video file use `file-video`; for a call use `video`.",
    synonyms: ["videographer", "video shooting", "видеограф", "видеосъёмка"],
    related: ["photographer", "livestream", "video"],
  },
  "recording": {
    use: "Studio recording as a service.",
    avoid: "For mixing use `mixing`, for mastering use `mastering` — these are different stages.",
    synonyms: ["recording", "studio", "запись", "студия"],
    related: ["mixing", "mastering", "sound-engineer"],
  },
  "mixing": {
    use: "Mixing a track.",
    avoid: "Mastering comes after mixing — that is `mastering`.",
    synonyms: ["mixing", "mix", "сведение", "микс"],
    related: ["mastering", "recording", "sound-engineer"],
  },
  "mastering": {
    use: "Mastering, the final polish before release.",
    synonyms: ["mastering", "мастеринг", "финальная обработка"],
    related: ["mixing", "recording", "distribution"],
  },
  "rehearsal": {
    use: "Rehearsal room, rehearsal time.",
    synonyms: ["rehearsal", "practice room", "репетиция", "репточка", "база"],
    related: ["equipment-rental", "recording"],
  },
  "booking": {
    use: "Booking: finding gigs and venues.",
    avoid: "For a ticket to an event use `ticket`.",
    synonyms: ["booking", "gigs", "букинг", "концерты", "площадки"],
    related: ["ticket", "calendar", "promotion"],
  },
  "distribution": {
    use: "Getting a release onto streaming platforms.",
    avoid: "For promoting it afterwards use `promotion`.",
    synonyms: ["distribution", "streaming", "release", "дистрибуция", "релиз", "стриминг"],
    related: ["promotion", "mastering", "rocket"],
  },
  "promotion": {
    use: "Promotion, PR, growing an audience.",
    synonyms: ["promotion", "pr", "marketing", "продвижение", "пиар", "реклама"],
    related: ["megaphone", "distribution", "booking"],
  },
  "lighting": {
    use: "Stage lighting.",
    avoid: "For light theme of the interface use `sun`.",
    synonyms: ["lighting", "stage light", "свет", "световое оформление"],
    related: ["equipment-rental", "livestream"],
  },
  "equipment-rental": {
    use: "Renting gear: backline, PA, instruments.",
    synonyms: ["equipment rental", "backline", "gear", "аппаратура", "аренда оборудования", "прокат"],
    related: ["lighting", "rehearsal"],
  },
  "artwork-design": {
    use: "Cover art and visual identity.",
    avoid: "For a colour picker in the interface use `palette`.",
    synonyms: ["artwork", "cover", "design", "обложка", "дизайн", "оформление"],
    related: ["palette", "photographer", "merch-production"],
  },
  "merch-production": {
    use: "Making merch: shirts, prints, vinyl.",
    synonyms: ["merch", "merchandise", "prints", "мерч", "атрибутика", "печать"],
    related: ["artwork-design", "box"],
  },
  "livestream": {
    use: "Live broadcast of a performance.",
    avoid: "For a video call use `video`; for a recorded file use `file-video`.",
    synonyms: ["livestream", "broadcast", "live", "трансляция", "эфир", "стрим"],
    related: ["videographer", "video", "screen-share"],
  },
  "hosting": {
    use: "Host, presenter of an event.",
    avoid: "Nothing to do with web hosting — for a server use `server`.",
    synonyms: ["host", "presenter", "mc of event", "ведущий", "конферансье"],
    related: ["megaphone", "mic", "booking"],
  },
  "catering": {
    use: "Catering for an event.",
    synonyms: ["catering", "food", "кейтеринг", "еда", "питание"],
    related: ["cake", "transport-logistics"],
  },
  "transport-logistics": {
    use: "Transport and logistics: gear and people to the venue.",
    synonyms: ["logistics", "transport", "delivery", "логистика", "транспорт", "доставка"],
    related: ["train", "plane", "equipment-rental"],
  },
  "legal-consulting": {
    use: "Legal help: contracts, rights, royalties.",
    synonyms: ["legal", "lawyer", "contracts", "юрист", "договоры", "права"],
    related: ["dollar-sign", "shield"],
  },
  "security": {
    use: "Event security staff.",
    avoid: "For information security use `shield` or `lock`.",
    synonyms: ["security", "guards", "охрана", "безопасность на площадке"],
    related: ["shield", "lock"],
  },
};
