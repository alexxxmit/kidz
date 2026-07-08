import type { WardrobeItemInput } from "@kidz/contracts";

type DemoItem = Omit<WardrobeItemInput, "profileId">;

export const STARTER_WARDROBE: DemoItem[] = [
  { name: "Молочная рубашка оверсайз", category: "shirt", slot: "top", colors: ["#EEEAE2"], warmth: 1, styleIds: ["stockholm", "preppy", "minimal", "classic"], careState: "CLEAN", fitState: "FITS" },
  { name: "Белый лонгслив в рубчик", category: "tshirt", slot: "top", colors: ["#F4F1EA"], warmth: 1, styleIds: ["stockholm", "minimal", "acubi", "classic"], careState: "CLEAN", fitState: "FITS" },
  { name: "Чёрная футболка с графикой", category: "tshirt", slot: "top", colors: ["#111217", "#D8D9DF"], warmth: 1, styleIds: ["emo", "streetwear", "punk", "grunge"], careState: "CLEAN", fitState: "FITS" },
  { name: "Полосатый лонгслив", category: "tshirt", slot: "top", colors: ["#1E2026", "#E8E2D8"], warmth: 2, styleIds: ["emo", "skater", "grunge", "vintage"], careState: "CLEAN", fitState: "FITS" },
  { name: "Голубая оксфордская рубашка", category: "shirt", slot: "top", colors: ["#BFD4EA"], warmth: 1, styleIds: ["preppy", "classic", "stockholm"], careState: "CLEAN", fitState: "FITS" },
  { name: "Пудровый топ с мягким воротом", category: "shirt", slot: "top", colors: ["#F0CDD8"], warmth: 1, styleIds: ["coquette", "classic", "preppy"], careState: "CLEAN", fitState: "FITS" },
  { name: "Спортивная футболка dry-fit", category: "tshirt", slot: "top", colors: ["#2659D9", "#F4F7FB"], warmth: 1, styleIds: ["sporty", "streetwear"], careState: "CLEAN", fitState: "FITS" },
  { name: "Серый топ с высоким воротом", category: "shirt", slot: "top", colors: ["#A7ABB2"], warmth: 1, styleIds: ["acubi", "minimal", "techwear"], careState: "CLEAN", fitState: "FITS" },
  { name: "Футболка с винтажным принтом", category: "tshirt", slot: "top", colors: ["#DDD0B6", "#7A4E32"], warmth: 1, styleIds: ["vintage", "grunge", "streetwear"], careState: "CLEAN", fitState: "FITS" },

  { name: "Графитовое худи оверсайз", category: "hoodie", slot: "mid_layer", colors: ["#575D67"], warmth: 3, styleIds: ["emo", "skater", "streetwear", "hiphop"], careState: "CLEAN", fitState: "FITS" },
  { name: "Чёрный кардиган на молнии", category: "sweater", slot: "mid_layer", colors: ["#17191E"], warmth: 2, styleIds: ["emo", "acubi", "minimal", "goth"], careState: "CLEAN", fitState: "FITS" },
  { name: "Бордовый свитер с V-вырезом", category: "sweater", slot: "mid_layer", colors: ["#7A2434"], warmth: 3, styleIds: ["preppy", "academia", "classic"], careState: "CLEAN", fitState: "FITS" },
  { name: "Флисовый зип оливкового цвета", category: "sweater", slot: "mid_layer", colors: ["#68735D"], warmth: 3, styleIds: ["gorpcore", "sporty", "skater"], careState: "CLEAN", fitState: "FITS" },
  { name: "Джинсовая рубашка вторым слоем", category: "shirt", slot: "mid_layer", colors: ["#657B91"], warmth: 2, styleIds: ["skater", "vintage", "grunge"], careState: "CLEAN", fitState: "FITS" },
  { name: "Мягкий кремовый кардиган", category: "sweater", slot: "mid_layer", colors: ["#EFE5D4"], warmth: 2, styleIds: ["coquette", "classic", "stockholm"], careState: "CLEAN", fitState: "FITS" },

  { name: "Чёрные прямые джинсы", category: "jeans", slot: "bottom", colors: ["#1B1D22"], warmth: 2, styleIds: ["emo", "grunge", "stockholm", "minimal"], careState: "CLEAN", fitState: "FITS" },
  { name: "Светлые широкие брюки", category: "trousers", slot: "bottom", colors: ["#CBC7BE"], warmth: 2, styleIds: ["stockholm", "minimal", "preppy", "classic"], careState: "CLEAN", fitState: "FITS" },
  { name: "Серые карго с прямым кроем", category: "trousers", slot: "bottom", colors: ["#6A707A"], warmth: 2, styleIds: ["techwear", "streetwear", "acubi", "skater"], careState: "CLEAN", fitState: "FITS" },
  { name: "Тёмно-синяя джинсовая юбка", category: "skirt", slot: "bottom", colors: ["#283C59"], warmth: 1, styleIds: ["preppy", "vintage", "coquette"], careState: "CLEAN", fitState: "FITS" },
  { name: "Серая плиссированная юбка", category: "skirt", slot: "bottom", colors: ["#8D929B"], warmth: 1, styleIds: ["preppy", "academia", "kawaii"], careState: "CLEAN", fitState: "FITS" },
  { name: "Чёрные спортивные джоггеры", category: "trousers", slot: "bottom", colors: ["#20242D"], warmth: 2, styleIds: ["sporty", "streetwear", "hiphop"], careState: "CLEAN", fitState: "FITS" },
  { name: "Коричневые вельветовые брюки", category: "trousers", slot: "bottom", colors: ["#7C5A3C"], warmth: 3, styleIds: ["vintage", "academia", "classic"], careState: "CLEAN", fitState: "FITS" },
  { name: "Бежевые бермуды", category: "shorts", slot: "bottom", colors: ["#D2C3AA"], warmth: 1, styleIds: ["stockholm", "minimal", "classic"], careState: "CLEAN", fitState: "FITS" },

  { name: "Чёрное платье-футболка", category: "dress", slot: "one_piece", colors: ["#17191E"], warmth: 1, styleIds: ["emo", "streetwear", "minimal"], careState: "CLEAN", fitState: "FITS" },
  { name: "Светлое платье с мягкой фактурой", category: "dress", slot: "one_piece", colors: ["#F4E6DE"], warmth: 1, styleIds: ["coquette", "classic", "vintage"], careState: "CLEAN", fitState: "FITS" },

  { name: "Тёмная куртка-ветровка", category: "jacket", slot: "outerwear", colors: ["#3D4851"], warmth: 3, styleIds: ["techwear", "streetwear", "stockholm", "gorpcore"], careState: "CLEAN", fitState: "FITS" },
  { name: "Песочный тренч", category: "coat", slot: "outerwear", colors: ["#C8B99E"], warmth: 3, styleIds: ["stockholm", "classic", "preppy", "minimal"], careState: "CLEAN", fitState: "FITS" },
  { name: "Чёрный бомбер", category: "jacket", slot: "outerwear", colors: ["#14161B"], warmth: 3, styleIds: ["streetwear", "emo", "hiphop", "punk"], careState: "CLEAN", fitState: "FITS" },
  { name: "Оливковая стёганая куртка", category: "jacket", slot: "outerwear", colors: ["#5B664F"], warmth: 4, styleIds: ["gorpcore", "classic", "skater"], careState: "CLEAN", fitState: "FITS" },
  { name: "Серое шерстяное пальто", category: "coat", slot: "outerwear", colors: ["#7B8088"], warmth: 4, styleIds: ["academia", "classic", "stockholm"], careState: "CLEAN", fitState: "FITS" },
  { name: "Непромокаемый дождевик", category: "coat", slot: "outerwear", colors: ["#F0C94A"], warmth: 2, styleIds: ["gorpcore", "sporty", "kawaii"], careState: "CLEAN", fitState: "FITS" },

  { name: "Белые кожаные кроссовки", category: "sneakers", slot: "footwear", colors: ["#F1F0EB"], warmth: 1, styleIds: ["stockholm", "minimal", "classic", "sporty"], careState: "CLEAN", fitState: "FITS" },
  { name: "Чёрные высокие кеды", category: "sneakers", slot: "footwear", colors: ["#16171A", "#E5E2DB"], warmth: 1, styleIds: ["emo", "skater", "streetwear", "punk"], careState: "CLEAN", fitState: "FITS" },
  { name: "Чёрные лоферы", category: "shoes", slot: "footwear", colors: ["#17191E"], warmth: 1, styleIds: ["preppy", "classic", "academia", "stockholm"], careState: "CLEAN", fitState: "FITS" },
  { name: "Кожаные ботинки челси", category: "boots", slot: "footwear", colors: ["#241F1C"], warmth: 2, styleIds: ["classic", "academia", "goth", "minimal"], careState: "CLEAN", fitState: "FITS" },
  { name: "Беговые кроссовки", category: "sneakers", slot: "footwear", colors: ["#2659D9", "#DFF25C"], warmth: 1, styleIds: ["sporty", "streetwear"], careState: "CLEAN", fitState: "FITS" },
  { name: "Треккинговые кроссовки", category: "sneakers", slot: "footwear", colors: ["#516243", "#E46B32"], warmth: 2, styleIds: ["gorpcore", "techwear", "sporty"], careState: "CLEAN", fitState: "FITS" },
  { name: "Тёмные балетки Mary Jane", category: "shoes", slot: "footwear", colors: ["#242026"], warmth: 1, styleIds: ["coquette", "preppy", "classic", "kawaii"], careState: "CLEAN", fitState: "FITS" },
  { name: "Серебристые акцентные кроссовки", category: "sneakers", slot: "footwear", colors: ["#C7CCD4"], warmth: 1, styleIds: ["y2k", "acubi", "streetwear"], careState: "CLEAN", fitState: "FITS" },

  { name: "Минимальная серая beanie", category: "beanie", slot: "headwear", colors: ["#4C5058"], warmth: 1, styleIds: ["stockholm", "skater", "streetwear", "minimal"], careState: "CLEAN", fitState: "FITS" },
  { name: "Чёрная бейсболка без логотипа", category: "cap", slot: "headwear", colors: ["#17191E"], warmth: 0, styleIds: ["streetwear", "skater", "emo", "techwear"], careState: "CLEAN", fitState: "FITS" },
  { name: "Панама из плотного хлопка", category: "hat", slot: "headwear", colors: ["#D4C6A8"], warmth: 0, styleIds: ["gorpcore", "kawaii", "streetwear"], careState: "CLEAN", fitState: "FITS" },
  { name: "Бархатный ободок", category: "headband", slot: "headwear", colors: ["#2D2230"], warmth: 0, styleIds: ["coquette", "preppy", "academia"], careState: "CLEAN", fitState: "FITS" },
  { name: "Шерстяной берет", category: "hat", slot: "headwear", colors: ["#6D2634"], warmth: 1, styleIds: ["vintage", "academia", "classic"], careState: "CLEAN", fitState: "FITS" },

  { name: "Тонкая серебристая цепочка", category: "necklace", slot: "jewelry", colors: ["#C9CDD3"], warmth: 0, styleIds: ["stockholm", "emo", "minimal", "acubi"], careState: "CLEAN", fitState: "FITS" },
  { name: "Браслет из чёрного шнурка", category: "bracelet", slot: "jewelry", colors: ["#15171C"], warmth: 0, styleIds: ["emo", "skater", "grunge", "punk"], careState: "CLEAN", fitState: "FITS" },
  { name: "Набор тонких колец", category: "ring", slot: "jewelry", colors: ["#BFC4CC"], warmth: 0, styleIds: ["acubi", "emo", "y2k", "goth"], careState: "CLEAN", fitState: "FITS" },
  { name: "Маленькие жемчужные серьги", category: "earrings", slot: "jewelry", colors: ["#F5F0E6"], warmth: 0, styleIds: ["coquette", "classic", "preppy"], careState: "CLEAN", fitState: "FITS" },
  { name: "Часы с тёмным ремешком", category: "watch", slot: "jewelry", colors: ["#20242D"], warmth: 0, styleIds: ["classic", "stockholm", "minimal", "preppy"], careState: "CLEAN", fitState: "FITS" },
  { name: "Металлический кулон", category: "necklace", slot: "jewelry", colors: ["#A8ADB6"], warmth: 0, styleIds: ["goth", "punk", "emo", "streetwear"], careState: "CLEAN", fitState: "FITS" },
  { name: "Чёрный ремень с простой пряжкой", category: "belt", slot: "accessory", colors: ["#16171A", "#A8ADB6"], warmth: 0, styleIds: ["stockholm", "emo", "classic", "punk"], careState: "CLEAN", fitState: "FITS" },

  { name: "Чёрная сумка crossbody", category: "crossbody_bag", slot: "bag", colors: ["#17191E"], warmth: 0, styleIds: ["emo", "streetwear", "acubi", "techwear"], careState: "CLEAN", fitState: "FITS" },
  { name: "Бежевый canvas tote", category: "tote", slot: "bag", colors: ["#E4D7BE"], warmth: 0, styleIds: ["stockholm", "minimal", "vintage", "academia"], careState: "CLEAN", fitState: "FITS" },
  { name: "Графитовый школьный рюкзак", category: "backpack", slot: "bag", colors: ["#30343B"], warmth: 0, styleIds: ["streetwear", "skater", "sporty", "minimal"], careState: "CLEAN", fitState: "FITS" },
  { name: "Маленькая глянцевая сумка", category: "bag", slot: "bag", colors: ["#B8C7FF"], warmth: 0, styleIds: ["y2k", "coquette", "kawaii"], careState: "CLEAN", fitState: "FITS" },
  { name: "Спортивная сумка для формы", category: "bag", slot: "bag", colors: ["#1D2230", "#DFF25C"], warmth: 0, styleIds: ["sporty", "streetwear"], careState: "CLEAN", fitState: "FITS" },
];

export const quickItems: Record<"top" | "bottom" | "footwear" | "outerwear" | "jewelry" | "bag" | "headwear", DemoItem> = {
  top: { name: "Белая базовая футболка", category: "tshirt", slot: "top", colors: ["#F4F1EA"], warmth: 1, styleIds: [], careState: "CLEAN", fitState: "FITS" },
  bottom: { name: "Серые прямые брюки", category: "trousers", slot: "bottom", colors: ["#626873"], warmth: 2, styleIds: [], careState: "CLEAN", fitState: "FITS" },
  footwear: { name: "Кремовые кроссовки", category: "sneakers", slot: "footwear", colors: ["#F1E3C4"], warmth: 1, styleIds: [], careState: "CLEAN", fitState: "FITS" },
  outerwear: { name: "Лёгкая зелёная куртка", category: "jacket", slot: "outerwear", colors: ["#BFDCC9"], warmth: 3, styleIds: [], careState: "CLEAN", fitState: "FITS" },
  jewelry: { name: "Серебристая цепочка", category: "necklace", slot: "jewelry", colors: ["#D8DCE2"], warmth: 0, styleIds: [], careState: "CLEAN", fitState: "FITS" },
  bag: { name: "Тёмная crossbody", category: "crossbody_bag", slot: "bag", colors: ["#2B2E36"], warmth: 0, styleIds: [], careState: "CLEAN", fitState: "FITS" },
  headwear: { name: "Серая beanie", category: "beanie", slot: "headwear", colors: ["#8D94A1"], warmth: 1, styleIds: [], careState: "CLEAN", fitState: "FITS" },
};
