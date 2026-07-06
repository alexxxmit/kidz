import type { Locale, StyleDefinition } from "@kidz/contracts";

const style = (
  id: string,
  ru: string,
  en: string,
  ruDescription: string,
  enDescription: string,
  palette: string[],
  traits: string[],
  aliases: string[] = [],
): StyleDefinition => ({
  id,
  names: { ru, en },
  descriptions: { ru: ruDescription, en: enDescription },
  aliases: [ru.toLowerCase(), en.toLowerCase(), ...aliases.map((value) => value.toLowerCase())],
  palette,
  traits,
});

export const STYLE_CATALOG: StyleDefinition[] = [
  style("stockholm", "Стокгольмский", "Stockholm", "Чистые линии, спокойные оттенки и уверенный минимализм.", "Clean lines, quiet tones and confident minimalism.", ["#E9E7E2", "#25272D", "#9DA7B4"], ["minimal", "layered", "clean"], ["scandinavian", "скандинавский"]),
  style("emo", "Эмо", "Emo", "Контраст, выразительные детали и музыка в силуэте.", "Contrast, expressive details and music in the silhouette.", ["#111217", "#7D1D35", "#D8D9DF"], ["dark", "layered", "expressive"]),
  style("streetwear", "Стритвир", "Streetwear", "Свободный крой, графика и городская практичность.", "Relaxed cuts, graphics and urban practicality.", ["#20242D", "#E85D3F", "#ECE7DD"], ["oversized", "graphic", "urban"]),
  style("skater", "Скейтерский", "Skater", "Объёмные вещи, удобство и немного уличного беспорядка.", "Roomy pieces, comfort and a little street chaos.", ["#4C5B43", "#C9B78C", "#30343B"], ["relaxed", "durable", "street"]),
  style("y2k", "Y2K", "Y2K", "Блеск, короткие силуэты и энергия начала нулевых.", "Gloss, cropped silhouettes and early-2000s energy.", ["#B8C7FF", "#E66BAA", "#C8F0E8"], ["playful", "shiny", "fitted"]),
  style("goth", "Готический", "Goth", "Тёмная палитра, драматичные формы и фактуры.", "Dark palettes, dramatic shapes and texture.", ["#111114", "#4C4057", "#8A172B"], ["dark", "dramatic", "textured"]),
  style("grunge", "Гранж", "Grunge", "Слои, выцветшие цвета и нарочитая небрежность.", "Layers, washed colors and deliberate roughness.", ["#515044", "#8A6F61", "#202326"], ["layered", "washed", "relaxed"]),
  style("acubi", "Акуби", "Acubi", "Минималистичная база, точный крой и футуристичные детали.", "Minimal basics, precise cuts and futuristic detail.", ["#24272B", "#A9AFB2", "#E6E7E3"], ["fitted", "minimal", "futuristic"]),
  style("coquette", "Кокет", "Coquette", "Мягкие фактуры, банты и романтические акценты.", "Soft textures, bows and romantic accents.", ["#F2CBD8", "#F8F2EE", "#8F5F68"], ["romantic", "soft", "detail"]),
  style("preppy", "Преппи", "Preppy", "Собранная классика, трикотаж и академические детали.", "Polished classics, knitwear and academic details.", ["#23334F", "#E8DFC7", "#8A2432"], ["polished", "classic", "academic"]),
  style("sporty", "Спортивный", "Sporty", "Движение, функциональные материалы и лёгкие слои.", "Movement, functional fabrics and light layers.", ["#2659D9", "#DFF25C", "#1D2230"], ["active", "technical", "comfortable"]),
  style("minimal", "Минимализм", "Minimal", "Меньше деталей, сильнее силуэт и качество базы.", "Fewer details, stronger silhouettes and better basics.", ["#EFEDE8", "#1F2125", "#9C9A94"], ["clean", "neutral", "precise"]),
  style("classic", "Классический", "Classic", "Вневременные формы и аккуратные сочетания.", "Timeless shapes and polished combinations.", ["#18233A", "#F4F0E6", "#7D2938"], ["timeless", "polished", "structured"]),
  style("techwear", "Техвир", "Techwear", "Функциональные слои, карманы и технологичная графика.", "Functional layers, utility pockets and technical graphics.", ["#15181B", "#3D4851", "#88A5A8"], ["technical", "layered", "utility"]),
  style("gorpcore", "Горпкор", "Gorpcore", "Outdoor-вещи в городе: защита, цвет и практичность.", "Outdoor gear in the city: protection, color and utility.", ["#E46B32", "#516243", "#D6CEAD"], ["outdoor", "utility", "layered"]),
  style("academia", "Тёмная академия", "Dark academia", "Твид, глубокие оттенки и библиотечная строгость.", "Tweed, deep tones and library-minded structure.", ["#3C3028", "#75614E", "#D1C4A8"], ["academic", "vintage", "structured"]),
  style("kawaii", "Каваии", "Kawaii", "Мягкие цвета, милые детали и выразительные аксессуары.", "Soft colors, cute details and expressive accessories.", ["#F5B9D2", "#B8DDF1", "#FFF2B6"], ["cute", "soft", "playful"]),
  style("punk", "Панк", "Punk", "Резкий контраст, кастомизация и независимый характер.", "Sharp contrast, customization and independent attitude.", ["#141416", "#D92B3A", "#D7D1C9"], ["bold", "custom", "rebellious"]),
  style("vintage", "Винтажный", "Vintage", "Формы прошлых десятилетий и тёплая патина.", "Past-decade silhouettes and warm patina.", ["#8A5E3B", "#D8C39D", "#536252"], ["retro", "textured", "warm"]),
  style("hiphop", "Хип-хоп", "Hip-hop", "Объём, спортивные коды и сильные акценты.", "Volume, sports codes and strong accents.", ["#161A22", "#E3B341", "#7C2330"], ["oversized", "sport", "bold"]),
];

export const getStyles = (locale: Locale): Array<StyleDefinition & { name: string; description: string }> =>
  STYLE_CATALOG.map((entry) => ({
    ...entry,
    name: entry.names[locale],
    description: entry.descriptions[locale],
  }));

export const findStyle = (query: string): StyleDefinition | undefined => {
  const normalized = query.trim().toLowerCase();
  return STYLE_CATALOG.find(
    (entry) => entry.id === normalized || entry.aliases.includes(normalized),
  );
};
