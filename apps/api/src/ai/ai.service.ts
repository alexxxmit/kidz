import { Injectable } from "@nestjs/common";
import { WardrobeVisionResultSchema, type AiStylistInput, type AiStylistResponse, type GarmentCategory, type GarmentSlot, type WardrobeVisionInput, type WardrobeVisionResult } from "@kidz/contracts";
import { STYLE_CATALOG } from "@kidz/domain";

import { ModerationService } from "../safety/moderation.service.js";

const localAnswer = (input: AiStylistInput): AiStylistResponse => {
  const styles = input.styleMix.map((item) => item.styleId).join(" + ");
  const count = input.wardrobeSummary.length;
  const ru = input.locale === "ru";
  return {
    answer: ru
      ? `Я бы сохранила направление ${styles}: выбери одну главную вещь, спокойную базу и один акцент. В твоём шкафу сейчас ${count} вещей — могу собрать вариант из них без лишних покупок.`
      : `I would keep the ${styles} direction: one hero piece, a calm base and one accent. Your closet has ${count} pieces, so I can remix what you own before suggesting a purchase.`,
    quickActions: ru ? ["Сделай смелее", "Только из чистых вещей", "Вариант для школы"] : ["Make it bolder", "Clean items only", "School version"],
    safetyMode: input.ageYears < 13 ? "UNDER_13_LOCAL" : "TEEN_GUARDED",
    provider: "local",
  };
};

const categorySlots: Record<GarmentCategory, GarmentSlot> = {
  tshirt: "top", shirt: "top", hoodie: "mid_layer", sweater: "mid_layer", jacket: "outerwear", coat: "outerwear",
  jeans: "bottom", trousers: "bottom", skirt: "bottom", dress: "one_piece", shorts: "bottom",
  sneakers: "footwear", boots: "footwear", shoes: "footwear", hat: "headwear", cap: "headwear", beanie: "headwear",
  headband: "headwear", hair_accessory: "headwear", scarf: "accessory", belt: "accessory", necklace: "jewelry",
  bracelet: "jewelry", ring: "jewelry", earrings: "jewelry", watch: "jewelry", bag: "bag", backpack: "bag",
  crossbody_bag: "bag", tote: "bag", accessory: "accessory",
};

const localWardrobeAnalysis = (input: WardrobeVisionInput): WardrobeVisionResult => ({
  name: input.locale === "ru" ? "Новая вещь · проверь тип" : "New piece · check type",
  category: "tshirt",
  slot: "top",
  colors: ["#808080"],
  warmth: 1,
  styleIds: input.selectedStyleIds,
  confidence: 0,
  provider: "local",
});

@Injectable()
export class AiService {
  constructor(private readonly moderation: ModerationService) {}

  async stylist(input: AiStylistInput): Promise<AiStylistResponse> {
    const moderation = await this.moderation.checkText(input.question, { blockContactSharing: input.ageYears < 16 });
    if (!moderation.allowed) {
      const urgent = moderation.reason === "HIGH_RISK_ESCALATION";
      const ru = input.locale === "ru";
      return {
        answer: urgent
          ? ru
            ? "Мне очень жаль, что тебе сейчас тяжело. Пожалуйста, прямо сейчас расскажи взрослому, которому доверяешь, и не оставайся с этим в одиночку. Если есть непосредственная опасность — обратись в местную экстренную службу."
            : "I’m really sorry this feels so hard. Please tell a trusted adult right now and do not stay alone with it. If there is immediate danger, contact your local emergency service."
          : ru
            ? "Я могу помочь со стилем и образом, но не с этим запросом. Давай соберём безопасный вариант из твоего гардероба."
            : "I can help with style and outfits, but not with that request. Let’s build a safe option from your closet.",
        quickActions: ru ? ["Образ для школы", "Спокойный вариант"] : ["School outfit", "Calmer option"],
        safetyMode: input.ageYears < 13 ? "UNDER_13_LOCAL" : "TEEN_GUARDED",
        provider: "local",
      };
    }
    const key = process.env.OPENAI_API_KEY;
    const under13Allowed = process.env.OPENAI_ZERO_DATA_RETENTION === "true";
    if (!key || moderation.state === "PENDING" || (input.ageYears < 13 && !under13Allowed)) return localAnswer(input);

    const language = input.locale === "ru" ? "Russian" : "English";
    const wardrobe = input.wardrobeSummary.slice(0, 80).join(", ");
    const instructions = [
      `You are MIRA, a supportive fashion stylist for a ${input.ageYears}-year-old user.`,
      `Answer in ${language}. Be specific, warm and concise. Never judge the user's body, attractiveness, gender expression or budget.`,
      "Prefer remixing the real wardrobe. Never invent an owned item. Suggestions are optional, not commands.",
      "For minors: no sexualized styling, dieting, body comparison, private contact sharing or manipulative shopping pressure.",
      `Selected styles: ${input.styleMix.map((entry) => `${entry.styleId}:${entry.weight}`).join(", ")}.`,
      `Available wardrobe item names: ${wardrobe || "not provided"}.`,
    ].join("\n");
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: process.env.OPENAI_STYLIST_MODEL ?? "gpt-5.6",
          store: false,
          instructions,
          input: input.question,
          max_output_tokens: 280,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`responses ${response.status}`);
      const payload = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
      const answer = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((item) => item.text)?.text;
      if (!answer) throw new Error("empty response");
      return {
        answer,
        quickActions: input.locale === "ru" ? ["Сделай спокойнее", "Добавь аксессуар", "Собери другой"] : ["Make it calmer", "Add an accessory", "Remix it"],
        safetyMode: input.ageYears < 13 ? "UNDER_13_LOCAL" : "TEEN_GUARDED",
        provider: "openai",
      };
    } catch {
      return localAnswer(input);
    }
  }

  async analyzeWardrobe(input: WardrobeVisionInput): Promise<WardrobeVisionResult> {
    const key = process.env.OPENAI_API_KEY;
    const under13Allowed = process.env.OPENAI_ZERO_DATA_RETENTION === "true";
    if (!key || (input.ageYears < 13 && !under13Allowed)) return localWardrobeAnalysis(input);

    const categories = Object.keys(categorySlots) as GarmentCategory[];
    const allowedStyles = [...STYLE_CATALOG.map((style) => style.id), "school-uniform"];
    const language = input.locale === "ru" ? "Russian" : "English";
    const schema = {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        category: { type: "string", enum: categories },
        slot: { type: "string", enum: [...new Set(Object.values(categorySlots))] },
        colors: { type: "array", minItems: 1, maxItems: 4, items: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" } },
        warmth: { type: "integer", minimum: 0, maximum: 4 },
        styleIds: { type: "array", maxItems: 8, items: { type: "string", enum: allowedStyles } },
        confidence: { type: "number", minimum: 0, maximum: 1 },
      },
      required: ["name", "category", "slot", "colors", "warmth", "styleIds", "confidence"],
    };
    const selected = input.selectedStyleIds.join(", ");
    const instructions = [
      "You classify one photographed wardrobe item for a private digital closet.",
      `Return the short item name in ${language}. Never describe a person, body, face, age, brand or price.`,
      "Classify only the most prominent garment, shoe, bag, headwear, jewelry or accessory in the image.",
      "Use visible dominant colors as uppercase 6-digit hex values. Warmth is 0 for jewelry/accessories, 1 for light, 2 for medium, 3 for warm, 4 for winter.",
      `Style tags must come only from this catalog: ${allowedStyles.join(", ")}. Add school-uniform only when the item visibly belongs to a school uniform.`,
      `The user's selected directions are ${selected}; include them only when the photographed item can genuinely work in those aesthetics.`,
      "If the image is unclear, choose the closest category and lower confidence. Do not invent details that are not visible.",
    ].join("\n");
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: process.env.OPENAI_VISION_MODEL ?? "gpt-5.4-mini",
          store: false,
          instructions,
          input: [{ role: "user", content: [{ type: "input_text", text: "Classify this wardrobe item." }, { type: "input_image", image_url: input.imageDataUrl, detail: "low" }] }],
          text: { format: { type: "json_schema", name: "wardrobe_item", strict: true, schema } },
          max_output_tokens: 240,
        }),
        signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) throw new Error(`responses ${response.status}`);
      const payload = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
      const output = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((item) => item.text)?.text;
      if (!output) throw new Error("empty response");
      const parsed = WardrobeVisionResultSchema.parse({ ...JSON.parse(output), provider: "openai" });
      const canonicalSlot = categorySlots[parsed.category];
      return { ...parsed, slot: canonicalSlot, styleIds: parsed.styleIds.filter((styleId) => allowedStyles.includes(styleId)) };
    } catch {
      return localWardrobeAnalysis(input);
    }
  }
}
