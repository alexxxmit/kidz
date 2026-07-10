import type {
  GarmentSlot,
  GenderPresentation,
  HairColor,
  HairLength,
  HairSuggestion,
  Locale,
  MakeupSuggestion,
  OutfitRequest,
  StylingSuggestion,
  WardrobeItemInput,
} from "@kidz/contracts";

import { STYLE_CATALOG } from "./styles.js";

type CandidateItem = Omit<WardrobeItemInput, "profileId"> & { id?: string };
type LocalizedText = Record<Locale, string>;
type HairMatrix = Partial<Record<GenderPresentation, Partial<Record<HairLength, LocalizedText>>>> &
  Partial<Record<HairLength, LocalizedText>>;
type MakeupIntensity = MakeupSuggestion["intensity"];
type MakeupPlan = {
  intensity: MakeupIntensity;
  feminine: LocalizedText;
  masculine: LocalizedText;
  neutral: LocalizedText;
};

type StyleStylingConfig = {
  preferredHairColors: HairColor[];
  colorDirection: LocalizedText;
  hair: HairMatrix;
  jewelry: LocalizedText;
  bag: LocalizedText;
  headwear: LocalizedText;
};

const localized = (locale: Locale, value: LocalizedText) => value[locale];

const hairColorLabel: Record<HairColor, LocalizedText> = {
  BLACK: { ru: "чёрный", en: "black" },
  DARK_BROWN: { ru: "тёмный шатен", en: "dark brown" },
  BROWN: { ru: "шатен", en: "brown" },
  LIGHT_BROWN: { ru: "русый", en: "light brown" },
  BLONDE: { ru: "блонд", en: "blonde" },
  RED: { ru: "рыжий", en: "red" },
  GRAY: { ru: "седой/пепельный", en: "gray/ash" },
  DYED_BRIGHT: { ru: "яркое окрашивание", en: "bright dyed color" },
  MIXED: { ru: "смешанный цвет", en: "mixed color" },
  OTHER: { ru: "текущий цвет", en: "current color" },
};

const fallbackHair: Record<HairLength, LocalizedText> = {
  BUZZ: {
    ru: "чистый контур и аккуратная укладка без лишнего объёма",
    en: "a clean outline and neat finish without extra volume",
  },
  SHORT: {
    ru: "текстурированная короткая укладка с естественным объёмом",
    en: "a textured short style with natural volume",
  },
  MEDIUM: {
    ru: "мягкие слои или пробор, который держит силуэт собранным",
    en: "soft layers or a part that keeps the silhouette composed",
  },
  LONG: {
    ru: "низкий хвост, гладкий пучок или свободные слои",
    en: "a low ponytail, sleek bun or loose layers",
  },
  VERY_LONG: {
    ru: "длинные слои, гладкий хвост или аккуратная коса",
    en: "long layers, a sleek ponytail or a neat braid",
  },
};

const presentationHairFinish: Record<Exclude<GenderPresentation, "NOT_SPECIFIED">, LocalizedText> = {
  FEMININE: {
    ru: "Для женственной подачи можно добавить мягкие пряди у лица или более гладкий финиш.",
    en: "For a feminine direction, add soft face-framing pieces or a sleeker finish.",
  },
  MASCULINE: {
    ru: "Для мужской подачи можно оставить более графичный контур и естественную текстуру без лишней фиксации.",
    en: "For a masculine direction, keep a more graphic outline and natural texture without heavy hold.",
  },
  NEUTRAL: {
    ru: "Для нейтральной подачи выбирай степень гладкости и объёма без гендерных правил.",
    en: "For a neutral direction, choose the level of sleekness and volume without gender rules.",
  },
};

const defaultConfig: StyleStylingConfig = {
  preferredHairColors: ["BLACK", "DARK_BROWN", "BROWN", "LIGHT_BROWN"],
  colorDirection: {
    ru: "естественный оттенок без резкого контраста",
    en: "a natural shade without sharp contrast",
  },
  hair: fallbackHair,
  jewelry: {
    ru: "одна спокойная деталь: тонкая цепочка, часы или маленькие серьги",
    en: "one quiet detail: a slim chain, watch or small earrings",
  },
  bag: {
    ru: "простая сумка или рюкзак без лишней графики",
    en: "a simple bag or backpack without loud graphics",
  },
  headwear: {
    ru: "головной убор только если он нужен по погоде или поддерживает силуэт",
    en: "headwear only when the weather or silhouette needs it",
  },
};

const defaultMakeupPlan: MakeupPlan = {
  intensity: "light",
  feminine: {
    ru: "чистая кожа, бальзам для губ и очень мягкий акцент, если он уместен",
    en: "clean skin, lip balm and a very soft accent when appropriate",
  },
  masculine: {
    ru: "уход, бальзам для губ и аккуратные брови; макияж можно полностью пропустить",
    en: "skincare, lip balm and tidy brows; makeup can be skipped entirely",
  },
  neutral: {
    ru: "минимальный уход и один спокойный акцент без обязательного макияжа",
    en: "minimal grooming and one quiet accent without mandatory makeup",
  },
};

const makeupPlans: Record<string, MakeupPlan> = {
  stockholm: {
    intensity: "light",
    feminine: {
      ru: "clean girl / сканди-минимализм: ровный тон, прозрачный гель для бровей, бальзам или нюдовый блеск",
      en: "clean Scandinavian minimalism: even tone, clear brow gel, balm or nude gloss",
    },
    masculine: {
      ru: "аккуратный уход, матовый бальзам и естественные брови; без видимого макияжа",
      en: "neat grooming, matte balm and natural brows; no visible makeup needed",
    },
    neutral: {
      ru: "минимальный уход, прозрачный бальзам и чистая линия бровей",
      en: "minimal grooming, clear balm and a clean brow line",
    },
  },
  emo: {
    intensity: "bold",
    feminine: {
      ru: "мягкий тёмный акцент у глаз, тушь или тонкая стрелка; губы лучше оставить спокойными",
      en: "a soft dark eye accent, mascara or thin liner; keep lips quiet",
    },
    masculine: {
      ru: "если хочется усилить emo-настроение: лёгкий smudged liner или просто тёмный nail/аксессуар",
      en: "to sharpen the emo mood: light smudged liner or simply a dark nail/accessory accent",
    },
    neutral: {
      ru: "тёмный акцент у глаз или nail-деталь, без перегруза всего лица",
      en: "a dark eye or nail accent without overloading the whole face",
    },
  },
  goth: {
    intensity: "bold",
    feminine: {
      ru: "графичная стрелка, холодный контур глаз или тёмная губа — лучше выбрать один главный акцент",
      en: "graphic liner, cool eye contour or dark lip — choose one main accent",
    },
    masculine: {
      ru: "чистая кожа и один gothic-акцент: smudged liner, тёмный nail или серебристая деталь",
      en: "clean skin and one gothic accent: smudged liner, dark nail or silver detail",
    },
    neutral: {
      ru: "один тёмный акцент: глаза, губы или nail-деталь, не всё сразу",
      en: "one dark accent: eyes, lips or nails, not everything at once",
    },
  },
  coquette: {
    intensity: "medium",
    feminine: {
      ru: "мягкий румянец, сияющий бальзам, светлая тень и аккуратная тушь",
      en: "soft blush, glossy balm, light shadow and neat mascara",
    },
    masculine: {
      ru: "уход, бальзам и мягкий healthy-glow эффект без явного макияжа",
      en: "grooming, balm and a soft healthy-glow effect without obvious makeup",
    },
    neutral: {
      ru: "мягкое сияние, бальзам и лёгкий румянец как опция",
      en: "soft glow, balm and optional light blush",
    },
  },
  y2k: {
    intensity: "medium",
    feminine: {
      ru: "глянцевые губы, светлая shimmer-тень или маленький блестящий акцент",
      en: "glossy lips, light shimmer shadow or a small sparkly accent",
    },
    masculine: {
      ru: "глянцевый бальзам или один metallic/nail-акцент, если хочется Y2K-эффекта",
      en: "gloss balm or one metallic/nail accent if you want the Y2K effect",
    },
    neutral: {
      ru: "глянцевый бальзам и один shimmer-акцент без перегруза",
      en: "gloss balm and one shimmer accent without overload",
    },
  },
  acubi: {
    intensity: "light",
    feminine: {
      ru: "холодный минимализм: ровный тон, прозрачный бальзам, тонкая линия у глаз",
      en: "cool minimalism: even tone, clear balm, a thin eye line",
    },
    masculine: {
      ru: "аккуратный уход, матовость и чистые брови; макияж почти невидимый",
      en: "neat grooming, matte finish and clean brows; makeup stays almost invisible",
    },
    neutral: {
      ru: "ровный тон и один холодный минимальный акцент",
      en: "even tone and one cool minimal accent",
    },
  },
  preppy: {
    intensity: "light",
    feminine: {
      ru: "свежий тон, бальзам, аккуратные брови и лёгкая тушь",
      en: "fresh tone, balm, neat brows and light mascara",
    },
    masculine: {
      ru: "ухоженный natural look: бальзам, SPF и аккуратные брови",
      en: "a groomed natural look: balm, SPF and tidy brows",
    },
    neutral: {
      ru: "свежий natural look без ярких акцентов",
      en: "a fresh natural look without loud accents",
    },
  },
  sporty: {
    intensity: "none",
    feminine: {
      ru: "лучше лёгкий уход: SPF, бальзам и ничего, что мешает движению",
      en: "keep it practical: SPF, balm and nothing that gets in the way",
    },
    masculine: {
      ru: "SPF, бальзам и уход; макияж не нужен",
      en: "SPF, balm and grooming; no makeup needed",
    },
    neutral: {
      ru: "SPF, бальзам и практичный уход без макияжа",
      en: "SPF, balm and practical grooming without makeup",
    },
  },
  punk: {
    intensity: "bold",
    feminine: {
      ru: "резкая стрелка, тёмный nail или один контрастный акцент — лучше оставить образ собранным",
      en: "sharp liner, dark nails or one contrast accent — keep the look intentional",
    },
    masculine: {
      ru: "один punk-акцент: smudged liner, nail или графичная деталь",
      en: "one punk accent: smudged liner, nail or graphic detail",
    },
    neutral: {
      ru: "один резкий акцент — глаза, nail или графичная линия",
      en: "one sharp accent — eyes, nails or a graphic line",
    },
  },
};

const styleConfigs: Record<string, Partial<StyleStylingConfig>> = {
  stockholm: {
    preferredHairColors: ["LIGHT_BROWN", "BLONDE", "BROWN", "DARK_BROWN"],
    colorDirection: {
      ru: "русый, тёмный блонд или мягкий шатен",
      en: "light brown, dark blonde or soft brown",
    },
    hair: {
      SHORT: {
        ru: "аккуратный короткий срез, мягкий объём и чистая линия у лица",
        en: "a neat short cut, soft volume and a clean line around the face",
      },
      MEDIUM: {
        ru: "гладкий пробор, мягкие волны или сдержанный боб",
        en: "a sleek part, soft waves or a restrained bob",
      },
      LONG: {
        ru: "низкий хвост, гладкий пучок или прямой пробор без лишнего объёма",
        en: "a low ponytail, sleek bun or straight part without extra volume",
      },
      VERY_LONG: {
        ru: "низкий хвост, гладкая коса или пучок с чистым контуром",
        en: "a low ponytail, sleek braid or clean outlined bun",
      },
      MASCULINE: {
        SHORT: {
          ru: "clean crop, аккуратный taper или мягкий middle part",
          en: "a clean crop, neat taper or soft middle part",
        },
        MEDIUM: {
          ru: "middle part или лёгкий flow без жёсткого стайлинга",
          en: "a middle part or easy flow without hard styling",
        },
      },
    },
    jewelry: {
      ru: "тонкое серебро, маленькие серьги или часы без крупного логотипа",
      en: "slim silver, small earrings or a watch without a large logo",
    },
    bag: {
      ru: "структурированная сумка, tote или спокойный рюкзак",
      en: "a structured bag, tote or quiet backpack",
    },
    headwear: {
      ru: "минимальная beanie или кепка без яркого принта",
      en: "a minimal beanie or cap without a loud print",
    },
  },
  emo: {
    preferredHairColors: ["BLACK", "DARK_BROWN", "DYED_BRIGHT", "MIXED"],
    colorDirection: {
      ru: "чёрный, тёмный шатен или контрастная прядь",
      en: "black, dark brown or a contrasting streak",
    },
    hair: {
      SHORT: {
        ru: "слоистая чёлка, текстура и немного асимметрии",
        en: "layered fringe, texture and a touch of asymmetry",
      },
      MEDIUM: {
        ru: "косая чёлка, рваные слои или face-framing пряди",
        en: "side fringe, choppy layers or face-framing pieces",
      },
      LONG: {
        ru: "длинные слои, косая чёлка или одна контрастная прядь",
        en: "long layers, a side fringe or one contrasting streak",
      },
      VERY_LONG: {
        ru: "длинные слои с чёлкой или контрастом у лица",
        en: "long layers with fringe or contrast around the face",
      },
    },
    jewelry: {
      ru: "цепочка, браслет, кольца или маленькая деталь с металлом",
      en: "a chain, bracelet, rings or a small metal detail",
    },
    bag: {
      ru: "чёрная crossbody, рюкзак с патчем или компактная сумка",
      en: "a black crossbody, patched backpack or compact bag",
    },
    headwear: {
      ru: "beanie, кепка или заколка, если хочется усилить mood",
      en: "a beanie, cap or hair clip when you want to sharpen the mood",
    },
  },
  streetwear: {
    preferredHairColors: ["BLACK", "DARK_BROWN", "BROWN", "DYED_BRIGHT"],
    colorDirection: {
      ru: "естественная база или один смелый акцент",
      en: "a natural base or one bold accent",
    },
    hair: {
      SHORT: {
        ru: "текстурированный crop, fade или свободный объём",
        en: "a textured crop, fade or loose volume",
      },
      MEDIUM: {
        ru: "естественная текстура, braids, хвост или messy part",
        en: "natural texture, braids, a ponytail or messy part",
      },
      LONG: {
        ru: "braids, высокий хвост, loose waves или чисто собранные волосы",
        en: "braids, a high ponytail, loose waves or cleanly tied hair",
      },
    },
    jewelry: {
      ru: "цепочка, часы или один заметный браслет",
      en: "a chain, watch or one visible bracelet",
    },
    bag: {
      ru: "crossbody, sling bag или функциональный рюкзак",
      en: "a crossbody, sling bag or functional backpack",
    },
    headwear: {
      ru: "кепка, beanie или капюшон как часть силуэта",
      en: "a cap, beanie or hood as part of the silhouette",
    },
  },
  skater: {
    preferredHairColors: ["BLACK", "DARK_BROWN", "BROWN", "LIGHT_BROWN"],
    colorDirection: {
      ru: "естественные оттенки с выгоревшим или небрежным эффектом",
      en: "natural shades with a sun-faded or undone feel",
    },
    hair: {
      SHORT: {
        ru: "shaggy crop, messy fringe или волосы из-под кепки",
        en: "a shaggy crop, messy fringe or cap hair",
      },
      MEDIUM: {
        ru: "небрежный middle part, слои или лёгкий shag",
        en: "an undone middle part, layers or a light shag",
      },
      LONG: {
        ru: "свободные слои, хвост или волосы, которые легко убрать под кепку",
        en: "loose layers, a ponytail or hair that tucks under a cap",
      },
    },
    jewelry: {
      ru: "браслет, шнурок, часы или неброская цепочка",
      en: "a bracelet, cord, watch or low-key chain",
    },
    bag: {
      ru: "рюкзак, sling bag или сумка, которую удобно носить весь день",
      en: "a backpack, sling bag or a bag you can wear all day",
    },
    headwear: {
      ru: "кепка или beanie с расслабленной посадкой",
      en: "a cap or relaxed beanie",
    },
  },
  y2k: {
    preferredHairColors: ["BLONDE", "LIGHT_BROWN", "DYED_BRIGHT", "MIXED"],
    colorDirection: {
      ru: "блонд, яркая прядь, контраст или глянцевый оттенок",
      en: "blonde, a bright streak, contrast or a glossy tone",
    },
    hair: {
      MEDIUM: {
        ru: "face-framing пряди, заколки или гладкий высокий хвост",
        en: "face-framing pieces, clips or a sleek high ponytail",
      },
      LONG: {
        ru: "гладкий хвост, две пряди у лица или блестящие заколки",
        en: "a sleek ponytail, two face pieces or glossy clips",
      },
    },
    jewelry: {
      ru: "глянцевые кольца, тонкие цепочки или маленькие блестящие серьги",
      en: "glossy rings, slim chains or small shiny earrings",
    },
    bag: {
      ru: "мини-сумка, baguette или маленький рюкзак",
      en: "a mini bag, baguette or tiny backpack",
    },
    headwear: {
      ru: "заколки, ободок или кепка с глянцевым акцентом",
      en: "clips, a headband or a cap with a glossy accent",
    },
  },
  goth: {
    preferredHairColors: ["BLACK", "DARK_BROWN", "DYED_BRIGHT"],
    colorDirection: {
      ru: "чёрный, очень тёмный шатен или холодный контраст",
      en: "black, very dark brown or cool contrast",
    },
    hair: {
      SHORT: {
        ru: "чёткий силуэт, тяжёлая чёлка или гладкая текстура",
        en: "a sharp silhouette, heavy fringe or sleek texture",
      },
      MEDIUM: {
        ru: "прямой пробор, тяжёлая чёлка или гладкие слои",
        en: "a straight part, heavy fringe or sleek layers",
      },
      LONG: {
        ru: "гладкие длинные волосы, низкий хвост или драматичная чёлка",
        en: "sleek long hair, a low ponytail or dramatic fringe",
      },
    },
    jewelry: {
      ru: "серебристый металл, кольца или тонкая цепь",
      en: "silver-tone metal, rings or a slim chain",
    },
    bag: {
      ru: "чёрная сумка с чистой формой или неброской фурнитурой",
      en: "a black bag with a clean shape or subtle hardware",
    },
    headwear: {
      ru: "чёрная beanie, лента или заколка без случайных цветов",
      en: "a black beanie, ribbon or clip without random color",
    },
  },
  grunge: {
    preferredHairColors: ["BLACK", "DARK_BROWN", "BROWN", "RED"],
    colorDirection: {
      ru: "тёмная натуральная база, рыжий или выцветший оттенок",
      en: "a dark natural base, red or faded tone",
    },
    hair: {
      SHORT: {
        ru: "messy crop, shag или чуть небрежная чёлка",
        en: "a messy crop, shag or slightly undone fringe",
      },
      MEDIUM: {
        ru: "shag, небрежные слои или лёгкая волна",
        en: "a shag, undone layers or light wave",
      },
      LONG: {
        ru: "свободные слои, хвост без идеальности или естественная волна",
        en: "loose layers, an imperfect ponytail or natural wave",
      },
    },
    jewelry: {
      ru: "цепочка, шнурок, браслет или винтажное кольцо",
      en: "a chain, cord, bracelet or vintage ring",
    },
    bag: {
      ru: "мягкий рюкзак, canvas tote или worn-in crossbody",
      en: "a soft backpack, canvas tote or worn-in crossbody",
    },
    headwear: {
      ru: "beanie или кепка с ощущением worn-in",
      en: "a beanie or cap with a worn-in feel",
    },
  },
  acubi: {
    preferredHairColors: ["BLACK", "DARK_BROWN", "BROWN", "GRAY"],
    colorDirection: {
      ru: "чёрный, тёмный шатен или холодный пепельный оттенок",
      en: "black, dark brown or a cool ash tone",
    },
    hair: {
      SHORT: {
        ru: "чёткая короткая форма или гладкий crop",
        en: "a sharp short shape or sleek crop",
      },
      MEDIUM: {
        ru: "гладкий пробор, clean layers или точный боб",
        en: "a sleek part, clean layers or precise bob",
      },
      LONG: {
        ru: "прямые гладкие волосы, низкий хвост или clean braid",
        en: "straight sleek hair, a low ponytail or clean braid",
      },
    },
    jewelry: {
      ru: "маленькое серебро, тонкие кольца или ear cuff",
      en: "small silver, slim rings or an ear cuff",
    },
    bag: {
      ru: "минимальная crossbody или структурированная маленькая сумка",
      en: "a minimal crossbody or structured small bag",
    },
    headwear: {
      ru: "чистая beanie, капюшон или заколка без лишнего декора",
      en: "a clean beanie, hood or clip without extra decoration",
    },
  },
  coquette: {
    preferredHairColors: ["BLONDE", "LIGHT_BROWN", "BROWN", "RED"],
    colorDirection: {
      ru: "мягкий блонд, русый, тёплый шатен или рыжий",
      en: "soft blonde, light brown, warm brown or red",
    },
    hair: {
      SHORT: {
        ru: "мягкий боб, заколка или лёгкая волна у лица",
        en: "a soft bob, clip or light wave around the face",
      },
      MEDIUM: {
        ru: "мягкие волны, лента или две пряди у лица",
        en: "soft waves, a ribbon or two face-framing pieces",
      },
      LONG: {
        ru: "лента, мягкие локоны, half-up или аккуратная коса",
        en: "a ribbon, soft curls, half-up style or neat braid",
      },
    },
    jewelry: {
      ru: "жемчужина, маленький кулон, бантик или тонкое кольцо",
      en: "a pearl, small pendant, bow or slim ring",
    },
    bag: {
      ru: "маленькая сумка, мягкая форма или светлый mini bag",
      en: "a small bag, soft shape or light mini bag",
    },
    headwear: {
      ru: "лента, ободок или аккуратная заколка",
      en: "a ribbon, headband or neat clip",
    },
  },
  preppy: {
    preferredHairColors: ["BROWN", "DARK_BROWN", "LIGHT_BROWN", "BLONDE"],
    colorDirection: {
      ru: "натуральный шатен, русый или аккуратный блонд",
      en: "natural brown, light brown or polished blonde",
    },
    hair: {
      SHORT: {
        ru: "аккуратный crop, side part или мягкий боб",
        en: "a neat crop, side part or soft bob",
      },
      MEDIUM: {
        ru: "side part, clean layers или собранные передние пряди",
        en: "a side part, clean layers or pinned front pieces",
      },
      LONG: {
        ru: "низкий хвост, лента или гладкая коса",
        en: "a low ponytail, ribbon or sleek braid",
      },
    },
    jewelry: {
      ru: "часы, маленькие серьги или тонкий кулон",
      en: "a watch, small earrings or slim pendant",
    },
    bag: {
      ru: "структурированный рюкзак, satchel или tote",
      en: "a structured backpack, satchel or tote",
    },
    headwear: {
      ru: "ободок, кепка varsity или аккуратная beanie",
      en: "a headband, varsity cap or neat beanie",
    },
  },
  sporty: {
    preferredHairColors: ["BLACK", "DARK_BROWN", "BROWN", "LIGHT_BROWN"],
    colorDirection: {
      ru: "любой естественный оттенок, который легко собрать",
      en: "any natural shade that is easy to tie back",
    },
    hair: {
      SHORT: {
        ru: "чистый crop или текстура, которая не мешает движению",
        en: "a clean crop or texture that stays out of the way",
      },
      MEDIUM: {
        ru: "хвост, braids или заколка, чтобы волосы не мешали",
        en: "a ponytail, braids or clip to keep hair out of the way",
      },
      LONG: {
        ru: "высокий хвост, braids или плотная коса",
        en: "a high ponytail, braids or secure braid",
      },
    },
    jewelry: {
      ru: "минимум украшений: часы, резинка или безопасный браслет",
      en: "minimal jewelry: a watch, hair tie or safe bracelet",
    },
    bag: {
      ru: "спортивный рюкзак или лёгкая сумка для формы",
      en: "a sport backpack or light kit bag",
    },
    headwear: {
      ru: "кепка, повязка или шапка по погоде",
      en: "a cap, headband or weather-appropriate hat",
    },
  },
  minimal: {
    preferredHairColors: ["BLACK", "DARK_BROWN", "BROWN", "LIGHT_BROWN", "BLONDE"],
    colorDirection: {
      ru: "натуральный оттенок и чистая форма",
      en: "a natural shade and clean shape",
    },
    hair: {
      SHORT: {
        ru: "чистая короткая форма без лишней текстуры",
        en: "a clean short shape without extra texture",
      },
      MEDIUM: {
        ru: "гладкий пробор, clean bob или мягкие слои",
        en: "a sleek part, clean bob or soft layers",
      },
      LONG: {
        ru: "низкий хвост, гладкая коса или свободные прямые волосы",
        en: "a low ponytail, sleek braid or loose straight hair",
      },
    },
    jewelry: defaultConfig.jewelry,
    bag: defaultConfig.bag,
    headwear: defaultConfig.headwear,
  },
  classic: {
    preferredHairColors: ["DARK_BROWN", "BROWN", "LIGHT_BROWN", "BLONDE"],
    colorDirection: {
      ru: "натуральный шатен, русый или мягкий блонд",
      en: "natural brown, light brown or soft blonde",
    },
    hair: {
      SHORT: {
        ru: "аккуратная короткая форма, side part или боб",
        en: "a neat short shape, side part or bob",
      },
      MEDIUM: {
        ru: "мягкие слои, side part или собранные волосы",
        en: "soft layers, a side part or tied-back hair",
      },
      LONG: {
        ru: "низкий хвост, волны или гладкая коса",
        en: "a low ponytail, waves or sleek braid",
      },
    },
    jewelry: {
      ru: "часы, маленькие серьги или один аккуратный кулон",
      en: "a watch, small earrings or one neat pendant",
    },
    bag: {
      ru: "структурированная сумка или классический рюкзак",
      en: "a structured bag or classic backpack",
    },
    headwear: {
      ru: "аккуратная шапка, кепка или ободок без лишней графики",
      en: "a neat hat, cap or headband without extra graphics",
    },
  },
  techwear: {
    preferredHairColors: ["BLACK", "DARK_BROWN", "GRAY", "DYED_BRIGHT"],
    colorDirection: {
      ru: "чёрный, холодный тёмный или пепельный оттенок",
      en: "black, cool dark or ash tone",
    },
    hair: {
      SHORT: {
        ru: "чёткий crop, wet-look текстура или clean taper",
        en: "a sharp crop, wet-look texture or clean taper",
      },
      MEDIUM: {
        ru: "гладкий пробор, собранные волосы или контролируемая текстура",
        en: "a sleek part, tied-back hair or controlled texture",
      },
      LONG: {
        ru: "низкий хвост, плотная коса или sleek bun",
        en: "a low ponytail, secure braid or sleek bun",
      },
    },
    jewelry: {
      ru: "минимальный металл или функциональная деталь без шума",
      en: "minimal metal or a functional detail without noise",
    },
    bag: {
      ru: "sling bag, utility crossbody или рюкзак с карманами",
      en: "a sling bag, utility crossbody or pocketed backpack",
    },
    headwear: {
      ru: "капюшон, beanie или кепка с техническим ощущением",
      en: "a hood, beanie or cap with a technical feel",
    },
  },
  gorpcore: {
    preferredHairColors: ["DARK_BROWN", "BROWN", "LIGHT_BROWN", "RED"],
    colorDirection: {
      ru: "натуральный оттенок, будто после прогулок и солнца",
      en: "a natural shade with an outdoorsy, sun-touched feel",
    },
    hair: {
      SHORT: {
        ru: "практичный crop или волосы, которые спокойно живут под кепкой",
        en: "a practical crop or hair that works under a cap",
      },
      MEDIUM: {
        ru: "хвост, braids или естественные слои",
        en: "a ponytail, braids or natural layers",
      },
      LONG: {
        ru: "коса, хвост или собранные волосы для ветра и прогулок",
        en: "a braid, ponytail or tied-back hair for wind and walks",
      },
    },
    jewelry: {
      ru: "минимум украшений: часы, шнурок или outdoor-браслет",
      en: "minimal jewelry: a watch, cord or outdoor bracelet",
    },
    bag: {
      ru: "рюкзак, поясная сумка или функциональная crossbody",
      en: "a backpack, waist bag or functional crossbody",
    },
    headwear: {
      ru: "кепка, панама, beanie или шапка по погоде",
      en: "a cap, bucket hat, beanie or weather hat",
    },
  },
  academia: {
    preferredHairColors: ["DARK_BROWN", "BROWN", "LIGHT_BROWN", "RED"],
    colorDirection: {
      ru: "глубокий шатен, русый или тёплый рыжий",
      en: "deep brown, light brown or warm red",
    },
    hair: {
      SHORT: {
        ru: "аккуратный crop, side part или мягкий боб",
        en: "a neat crop, side part or soft bob",
      },
      MEDIUM: {
        ru: "side part, мягкие слои или низкий хвост",
        en: "a side part, soft layers or low ponytail",
      },
      LONG: {
        ru: "низкая коса, хвост, лента или мягкие волны",
        en: "a low braid, ponytail, ribbon or soft waves",
      },
    },
    jewelry: {
      ru: "винтажное кольцо, маленький кулон или часы",
      en: "a vintage ring, small pendant or watch",
    },
    bag: {
      ru: "satchel, tote или рюкзак с книжным настроением",
      en: "a satchel, tote or bookish backpack",
    },
    headwear: {
      ru: "ободок, берет или аккуратная шерстяная шапка",
      en: "a headband, beret or neat wool hat",
    },
  },
  kawaii: {
    preferredHairColors: ["BLACK", "BROWN", "LIGHT_BROWN", "DYED_BRIGHT", "MIXED"],
    colorDirection: {
      ru: "мягкая натуральная база или пастельный акцент",
      en: "a soft natural base or pastel accent",
    },
    hair: {
      SHORT: {
        ru: "мягкая чёлка, заколки или округлый боб",
        en: "soft fringe, clips or a rounded bob",
      },
      MEDIUM: {
        ru: "заколки, хвостики, мягкая чёлка или half-up",
        en: "clips, small ponytails, soft fringe or half-up style",
      },
      LONG: {
        ru: "две косы, хвостики, ленты или мягкие локоны",
        en: "two braids, pigtails, ribbons or soft curls",
      },
    },
    jewelry: {
      ru: "милые серьги, charm-браслет или маленький кулон",
      en: "cute earrings, a charm bracelet or small pendant",
    },
    bag: {
      ru: "маленький рюкзак, мягкая сумка или charm на молнии",
      en: "a small backpack, soft bag or zipper charm",
    },
    headwear: {
      ru: "заколки, ободок, лента или мягкая beanie",
      en: "clips, a headband, ribbon or soft beanie",
    },
  },
  punk: {
    preferredHairColors: ["BLACK", "DYED_BRIGHT", "MIXED", "RED"],
    colorDirection: {
      ru: "чёрный, яркий цвет, контраст или рыжий",
      en: "black, bright color, contrast or red",
    },
    hair: {
      SHORT: {
        ru: "резкий crop, spikes, undercut или асимметрия",
        en: "a sharp crop, spikes, undercut or asymmetry",
      },
      MEDIUM: {
        ru: "undercut, чёлка, рваные слои или яркая прядь",
        en: "an undercut, fringe, choppy layers or bright streak",
      },
      LONG: {
        ru: "рваные слои, высокий хвост, контрастная прядь или braids",
        en: "choppy layers, a high ponytail, contrast streak or braids",
      },
    },
    jewelry: {
      ru: "цепи, кольца, булавка или металл — но не всё сразу",
      en: "chains, rings, a pin or metal — not all at once",
    },
    bag: {
      ru: "чёрная сумка, рюкзак с патчем или crossbody с металлом",
      en: "a black bag, patched backpack or metal-accent crossbody",
    },
    headwear: {
      ru: "beanie, кепка, заколка или резкий hair accessory",
      en: "a beanie, cap, clip or sharp hair accessory",
    },
  },
  vintage: {
    preferredHairColors: ["DARK_BROWN", "BROWN", "LIGHT_BROWN", "RED", "BLONDE"],
    colorDirection: {
      ru: "тёплый натуральный оттенок или мягкий ретро-блонд",
      en: "a warm natural shade or soft retro blonde",
    },
    hair: {
      SHORT: {
        ru: "soft crop, боб или лёгкая ретро-волна",
        en: "a soft crop, bob or light retro wave",
      },
      MEDIUM: {
        ru: "мягкие волны, side part или заколка",
        en: "soft waves, a side part or clip",
      },
      LONG: {
        ru: "волны, лента, платок или низкая коса",
        en: "waves, a ribbon, scarf or low braid",
      },
    },
    jewelry: {
      ru: "винтажное кольцо, кулон, часы или маленькие серьги",
      en: "a vintage ring, pendant, watch or small earrings",
    },
    bag: {
      ru: "маленькая сумка, satchel или canvas tote",
      en: "a small bag, satchel or canvas tote",
    },
    headwear: {
      ru: "платок, берет, лента или мягкая кепка",
      en: "a scarf, beret, ribbon or soft cap",
    },
  },
  hiphop: {
    preferredHairColors: ["BLACK", "DARK_BROWN", "BROWN", "DYED_BRIGHT"],
    colorDirection: {
      ru: "естественная тёмная база или заметный цветовой акцент",
      en: "a natural dark base or visible color accent",
    },
    hair: {
      SHORT: {
        ru: "clean fade, crop, waves или чёткий контур",
        en: "a clean fade, crop, waves or sharp outline",
      },
      MEDIUM: {
        ru: "braids, twists, хвост или объёмная текстура",
        en: "braids, twists, a ponytail or voluminous texture",
      },
      LONG: {
        ru: "braids, высокий хвост, twists или свободные слои",
        en: "braids, a high ponytail, twists or loose layers",
      },
    },
    jewelry: {
      ru: "цепочка, часы, кольцо или браслет как главный акцент",
      en: "a chain, watch, ring or bracelet as the main accent",
    },
    bag: {
      ru: "crossbody, рюкзак или compact bag с сильной формой",
      en: "a crossbody, backpack or compact bag with a strong shape",
    },
    headwear: {
      ru: "кепка, beanie или durag/bandana там, где это уместно",
      en: "a cap, beanie or durag/bandana where appropriate",
    },
  },
};

const mergeConfig = (styleId: string): StyleStylingConfig => {
  const partial = styleConfigs[styleId] ?? {};
  return {
    ...defaultConfig,
    ...partial,
    hair: { ...defaultConfig.hair, ...partial.hair },
  };
};

const dominantStyleId = (styleMix: OutfitRequest["profile"]["styleMix"]) =>
  [...styleMix].sort((a, b) => b.weight - a.weight)[0]?.styleId ?? "minimal";

const styleName = (styleId: string, locale: Locale) => {
  const style = STYLE_CATALOG.find((entry) => entry.id === styleId);
  return style?.names[locale] ?? styleId;
};

const hairText = (
  config: StyleStylingConfig,
  length: HairLength,
  genderPresentation: GenderPresentation,
  locale: Locale,
) => {
  const genderSpecific = config.hair[genderPresentation]?.[length];
  if (genderSpecific) return localized(locale, genderSpecific);
  const lengthSpecific = config.hair[length];
  const base = localized(locale, lengthSpecific ?? fallbackHair[length]);
  if (genderPresentation === "NOT_SPECIFIED") return base;
  return `${base}. ${localized(locale, presentationHairFinish[genderPresentation])}`;
};

const makeupTextForPresentation = (
  plan: MakeupPlan,
  genderPresentation: GenderPresentation,
  locale: Locale,
) => {
  if (genderPresentation === "FEMININE") return localized(locale, plan.feminine);
  if (genderPresentation === "MASCULINE") return localized(locale, plan.masculine);
  return localized(locale, plan.neutral);
};

const buildMakeupGuidance = (
  profile: OutfitRequest["profile"],
  styleId: string,
  styleTitle: string,
): MakeupSuggestion => {
  const locale = profile.locale;
  const plan = makeupPlans[styleId] ?? defaultMakeupPlan;
  if (profile.ageYears < 10) {
    return {
      title: locale === "ru" ? `Макияж · ${styleTitle}` : `Makeup · ${styleTitle}`,
      detail:
        locale === "ru"
          ? "Для этого возраста приложение не предлагает макияж. Можно оставить уход, SPF и бальзам для губ."
          : "For this age, the app does not suggest makeup. Keep it to grooming, SPF and lip balm.",
      intensity: "none",
      agePolicy: "not_suggested",
      reasonCodes: ["MAKEUP_AGE_LIMIT"],
    };
  }
  const agePrefix =
    profile.ageYears < 13
      ? locale === "ru"
        ? "Опционально и очень легко: "
        : "Optional and very light: "
      : "";
  return {
    title: locale === "ru" ? `Макияж · ${styleTitle}` : `Makeup · ${styleTitle}`,
    detail: `${agePrefix}${makeupTextForPresentation(plan, profile.genderPresentation, locale)}`,
    intensity: profile.ageYears < 13 && plan.intensity !== "none" ? "light" : plan.intensity,
    agePolicy: profile.ageYears < 13 ? "optional" : "style_reference",
    reasonCodes: ["MAKEUP_DIRECTION", `MAKEUP_${plan.intensity.toUpperCase()}`],
  };
};

const optionItem = (items: CandidateItem[], slots: GarmentSlot[]) =>
  items.find((item) => slots.includes(item.slot));

const suggestionForSlot = (
  slot: GarmentSlot,
  actualItem: CandidateItem | undefined,
  fallback: LocalizedText,
  locale: Locale,
): StylingSuggestion => {
  if (slot === "jewelry") {
    return {
      slot,
      title: locale === "ru" ? "Украшения" : "Jewelry",
      detail: actualItem
        ? locale === "ru"
          ? `В образ уже добавлено: ${actualItem.name}.`
          : `Already included in the look: ${actualItem.name}.`
        : localized(locale, fallback),
      reasonCode: actualItem ? "JEWELRY_INCLUDED" : "JEWELRY_IDEA",
    };
  }
  if (slot === "bag") {
    return {
      slot,
      title: locale === "ru" ? "Сумка" : "Bag",
      detail: actualItem
        ? locale === "ru"
          ? `Под образ подходит: ${actualItem.name}.`
          : `Works with this look: ${actualItem.name}.`
        : localized(locale, fallback),
      reasonCode: actualItem ? "BAG_INCLUDED" : "BAG_IDEA",
    };
  }
  return {
    slot,
    title: locale === "ru" ? "Головной убор" : "Headwear",
    detail: actualItem
      ? locale === "ru"
        ? `Можно добавить: ${actualItem.name}.`
        : `Optional add-on: ${actualItem.name}.`
      : localized(locale, fallback),
    reasonCode: actualItem ? "HEADWEAR_INCLUDED" : "HEADWEAR_IDEA",
  };
};

export const buildStylingGuidance = (
  profile: OutfitRequest["profile"],
  items: CandidateItem[],
): {
  hair: HairSuggestion;
  makeup: MakeupSuggestion;
  stylingSuggestions: StylingSuggestion[];
  stylingScore: number;
} => {
  const locale = profile.locale;
  const styleId = dominantStyleId(profile.styleMix);
  const config = mergeConfig(styleId);
  const preferredColors = config.preferredHairColors;
  const currentColor = profile.hairProfile.color;
  const currentColorLabel = localized(locale, hairColorLabel[currentColor]);
  const preferredColorText = localized(locale, config.colorDirection);
  const styleTitle = styleName(styleId, locale);
  const colorMatches = preferredColors.includes(currentColor);
  const colorAdviceAllowed = profile.hairProfile.openToColorAdvice;

  const colorAdvice = !colorAdviceAllowed
    ? undefined
    : colorMatches
      ? locale === "ru"
        ? `Текущий цвет (${currentColorLabel}) уже хорошо ложится в ${styleTitle}.`
        : `Your current color (${currentColorLabel}) already works well with ${styleTitle}.`
      : locale === "ru"
        ? `Если хочется ближе к референсам «${styleTitle}», чаще подходят ${preferredColorText}. Текущий цвет (${currentColorLabel}) тоже можно оставить — это направление, не правило.`
        : `If you want a look closer to “${styleTitle}” references, ${preferredColorText} often fits best. You can absolutely keep your current color (${currentColorLabel}); this is a direction, not a rule.`;

  const hair: HairSuggestion = {
    title: locale === "ru" ? `Причёска · ${styleTitle}` : `Hair · ${styleTitle}`,
    detail: hairText(config, profile.hairProfile.length, profile.genderPresentation, locale),
    ...(colorAdvice ? { colorAdvice } : {}),
    recommendedColor: colorMatches || !colorAdviceAllowed ? currentColor : (preferredColors[0] ?? currentColor),
    colorFit: !colorAdviceAllowed ? "not_applicable" : colorMatches ? "already_fits" : "optional_shift",
    reasonCodes: ["HAIR_DIRECTION", colorMatches ? "HAIR_COLOR_FITS" : "HAIR_COLOR_OPTION"],
  };
  const makeup = buildMakeupGuidance(profile, styleId, styleTitle);

  const jewelryItem = optionItem(items, ["jewelry", "accessory"]);
  const bagItem = optionItem(items, ["bag"]);
  const headwearItem = optionItem(items, ["headwear"]);
  const stylingSuggestions = [
    suggestionForSlot("jewelry", jewelryItem, config.jewelry, locale),
    suggestionForSlot("bag", bagItem, config.bag, locale),
    suggestionForSlot("headwear", headwearItem, config.headwear, locale),
  ];

  const includedStylingSlots = [jewelryItem, bagItem, headwearItem].filter(Boolean).length;
  const colorScore = !colorAdviceAllowed || colorMatches ? 1 : 0.72;
  const stylingScore = Math.max(0, Math.min(1, 0.55 + colorScore * 0.25 + (includedStylingSlots / 3) * 0.2));

  return { hair, makeup, stylingSuggestions, stylingScore: Number(stylingScore.toFixed(3)) };
};
