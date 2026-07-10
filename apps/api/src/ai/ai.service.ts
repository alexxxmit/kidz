import { Injectable } from "@nestjs/common";
import type { AiStylistInput, AiStylistResponse } from "@kidz/contracts";

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

@Injectable()
export class AiService {
  async stylist(input: AiStylistInput): Promise<AiStylistResponse> {
    const key = process.env.OPENAI_API_KEY;
    const under13Allowed = process.env.OPENAI_ZERO_DATA_RETENTION === "true";
    if (!key || (input.ageYears < 13 && !under13Allowed)) return localAnswer(input);

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
          moderation: { model: "omni-moderation-latest" },
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
}
