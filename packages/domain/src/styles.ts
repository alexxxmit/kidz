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
  style("scene", "Сцена", "Scene", "Яркий контраст, графика, слои и музыкальная энергия.", "Bright contrast, graphics, layers and music-scene energy.", ["#16151A", "#F04DA8", "#69DCE1"], ["bright", "layered", "music"], ["scene kid", "сцен кид"]),
  style("egirl", "E-girl", "E-girl", "Интернет-эстетика, тёмная база и игровые акценты.", "Internet-native styling, dark basics and playful accents.", ["#17151B", "#D83D79", "#A88BFF"], ["digital", "dark", "playful"]),
  style("soft-girl", "Софт-гёрл", "Soft girl", "Пастель, уютные формы и мягкая графика.", "Pastels, cozy shapes and soft graphic details.", ["#F7C5D8", "#C6D8FF", "#FFF2C9"], ["soft", "pastel", "cozy"]),
  style("clean-girl", "Clean girl", "Clean girl", "Свежая база, гладкие линии и минимум акцентов.", "Fresh basics, sleek lines and restrained accents.", ["#F3ECE2", "#BDAE9E", "#27262A"], ["clean", "sleek", "neutral"]),
  style("balletcore", "Балеткор", "Balletcore", "Трикотаж, ленты, мягкие слои и балетные формы.", "Knitwear, ribbons, soft layers and ballet-inspired forms.", ["#F0CED9", "#E7E2DE", "#9E7D87"], ["soft", "layered", "dance"]),
  style("blokecore", "Блоккор", "Blokecore", "Футбольные джерси, прямые джинсы и ретро-спорт.", "Football jerseys, straight denim and retro sports codes.", ["#1D5B42", "#F4E7C7", "#B42734"], ["sport", "retro", "relaxed"]),
  style("old-money", "Old money", "Old money", "Сдержанная классика, трикотаж и клубные коды.", "Restrained classics, knitwear and heritage club codes.", ["#233A32", "#E8DFC8", "#7C5A3D"], ["classic", "heritage", "polished"]),
  style("quiet-luxury", "Тихая роскошь", "Quiet luxury", "Точная посадка, спокойные ткани и отсутствие громких логотипов.", "Precise fit, calm fabrics and no loud logos.", ["#DBD6CE", "#706B64", "#242326"], ["minimal", "quality", "quiet"]),
  style("cottagecore", "Коттеджкор", "Cottagecore", "Природные ткани, цветы и романтика загородной жизни.", "Natural fabrics, florals and countryside romance.", ["#D8D0A9", "#718460", "#E8B7A9"], ["natural", "romantic", "vintage"]),
  style("fairycore", "Фейрикор", "Fairycore", "Воздушные слои, природные оттенки и сказочные детали.", "Airy layers, nature tones and whimsical details.", ["#CDE2C1", "#DCC6E8", "#8D9B75"], ["airy", "nature", "whimsical"]),
  style("whimsigoth", "Вимзигот", "Whimsigoth", "Звёзды, бархат, глубокие цвета и магический винтаж.", "Stars, velvet, deep colors and magical vintage energy.", ["#251D38", "#70405B", "#D6B95F"], ["mystic", "vintage", "dark"]),
  style("boho", "Бохо", "Boho", "Свободные формы, текстуры и ремесленные детали.", "Flowing shapes, texture and crafted details.", ["#A56C43", "#D5B98B", "#67704D"], ["flowing", "textured", "natural"]),
  style("coastal", "Побережье", "Coastal", "Светлые слои, полоска и расслабленная морская база.", "Light layers, stripes and an easy seaside base.", ["#EDF1EB", "#8EB5C6", "#273E58"], ["light", "relaxed", "nautical"], ["coastal granddaughter"]),
  style("normcore", "Нормкор", "Normcore", "Намеренно обычная база, удобство и простые пропорции.", "Deliberately ordinary basics, comfort and simple proportions.", ["#D7D5CF", "#75777B", "#293039"], ["basic", "relaxed", "practical"]),
  style("kidcore", "Кидкор", "Kidcore", "Чистые яркие цвета, playful-графика и ностальгия.", "Primary colors, playful graphics and nostalgic energy.", ["#E33B3B", "#2F68D8", "#F1D23E"], ["bright", "playful", "nostalgic"]),
  style("indie-sleaze", "Инди-слиз", "Indie sleaze", "Тёмный деним, вспышка, небрежные слои и клубный винтаж.", "Dark denim, flash-photo energy, messy layers and club vintage.", ["#1E1E20", "#6D5146", "#C4B9AC"], ["night", "vintage", "messy"]),
  style("mcbling", "McBling", "McBling", "Глянец нулевых, яркие детали и нарочитый glam.", "Glossy 2000s energy, bright details and unapologetic glam.", ["#F27DB9", "#E7D45B", "#B6C9F4"], ["glam", "shiny", "y2k"]),
  style("cyber-y2k", "Cyber Y2K", "Cyber Y2K", "Металлик, tech-силуэты и цифровая ностальгия.", "Metallics, technical silhouettes and digital nostalgia.", ["#BFC8D7", "#4D60A7", "#151820"], ["metallic", "digital", "technical"]),
  style("harajuku", "Харадзюку", "Harajuku", "Смелое смешение цветов, субкультур и аксессуаров.", "Bold mixing of colors, subcultures and accessories.", ["#F151A8", "#56C9DF", "#F4E94B"], ["layered", "colorful", "expressive"]),
  style("visual-kei", "Visual kei", "Visual kei", "Театральные формы, тёмная романтика и музыкальная графика.", "Theatrical forms, dark romance and music-led graphics.", ["#161419", "#743445", "#D4D1D5"], ["theatrical", "dark", "music"]),
  style("lolita", "Лолита fashion", "Lolita fashion", "Структурированные силуэты, исторические детали и аккуратные слои.", "Structured silhouettes, historical detail and careful layering.", ["#EED8E0", "#6A4052", "#F7F2E9"], ["structured", "historic", "detailed"], ["egl", "elegant gothic lolita"]),
  style("decora", "Декора", "Decora", "Много ярких hair-аксессуаров, слоёв и playful-деталей.", "Colorful hair accessories, layers and playful maximal detail.", ["#FF6FAA", "#67DCE7", "#FFD85B"], ["maximal", "accessories", "colorful"]),
  style("dark-feminine", "Dark feminine", "Dark feminine", "Глубокие оттенки, чёткий силуэт и один драматичный акцент.", "Deep tones, a defined silhouette and one dramatic accent.", ["#23181F", "#681E35", "#B99483"], ["dark", "defined", "dramatic"]),
  style("western", "Вестерн", "Western", "Деним, кожа, рабочие детали и западные силуэты.", "Denim, leather, workwear details and western silhouettes.", ["#47627A", "#8A5A37", "#D7C2A0"], ["denim", "leather", "heritage"]),
  style("workwear", "Ворквир", "Workwear", "Прочные ткани, функциональные карманы и честные формы.", "Durable fabrics, functional pockets and honest shapes.", ["#374A5A", "#9D6F3E", "#D2C49F"], ["durable", "utility", "structured"]),
  style("avant-garde", "Авангард", "Avant-garde", "Неожиданные пропорции, концептуальные слои и выразительный объём.", "Unexpected proportions, conceptual layers and expressive volume.", ["#161719", "#E7E5E1", "#6F7379"], ["conceptual", "sculptural", "bold"]),
  style("art-hoe", "Art hoe", "Art hoe", "Цвет, искусство, винтажный деним и творческие детали.", "Color, art references, vintage denim and creative details.", ["#D6A329", "#3A6B88", "#B94F4B"], ["art", "colorful", "vintage"]),
  style("korean-minimal", "Корейский минимализм", "Korean minimal", "Мягкий объём, чистая база и спокойная многослойность.", "Soft volume, clean basics and calm layering.", ["#E5E0D8", "#A9A39A", "#2C2D30"], ["soft", "clean", "layered"]),
  style("japanese-street", "Японский стрит", "Japanese street", "Точные слои, функциональность и смешение субкультур.", "Precise layering, utility and subculture mixing.", ["#1A1D22", "#657276", "#D16B4A"], ["layered", "utility", "expressive"]),
  style("parisian", "Парижский", "Parisian", "Неброская классика, деним и собранная небрежность.", "Quiet classics, denim and polished nonchalance.", ["#202631", "#E8E2D8", "#9A343D"], ["classic", "relaxed", "timeless"]),
  style("romantic", "Романтический", "Romantic", "Мягкие ткани, плавные линии и деликатные детали.", "Soft fabrics, flowing lines and delicate details.", ["#E9CAD3", "#F5EEE7", "#9A727B"], ["soft", "flowing", "delicate"]),
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
