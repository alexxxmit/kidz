import { Injectable } from "@nestjs/common";

const contactPattern = /(?:\+?\d[\d\s()-]{7,}\d|(?:t\.me|wa\.me|snapchat\.com|discord\.gg)\/|@[a-z0-9._]{3,})/i;
const urgentPattern = /(?:kill myself|suicide|self[- ]?harm|убить себя|суицид|самоповреж)/i;
const abusePattern = /(?:nudes?|sext|porn|гол(?:ая|ые)|нюдс|порно)/i;

@Injectable()
export class ModerationService {
  async checkText(text: string, options: { blockContactSharing?: boolean } = {}) {
    if (options.blockContactSharing && contactPattern.test(text)) {
      return { allowed: false, state: "HIDDEN" as const, reason: "CONTACT_SHARING" };
    }
    if (urgentPattern.test(text)) {
      return { allowed: false, state: "HIDDEN" as const, reason: "HIGH_RISK_ESCALATION" };
    }
    if (abusePattern.test(text)) {
      return { allowed: false, state: "HIDDEN" as const, reason: "SEXUAL_CONTENT" };
    }
    const key = process.env.OPENAI_API_KEY;
    if (!key) return { allowed: true, state: "CLEAN" as const, reason: "LOCAL_BASELINE" };
    try {
      const response = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) throw new Error(`moderation ${response.status}`);
      const payload = (await response.json()) as { results?: Array<{ flagged?: boolean }> };
      const flagged = payload.results?.[0]?.flagged === true;
      return { allowed: !flagged, state: flagged ? "HIDDEN" as const : "CLEAN" as const, reason: flagged ? "MODEL_FLAG" : "MODEL_CLEAN" };
    } catch {
      return { allowed: true, state: "PENDING" as const, reason: "REVIEW_REQUIRED" };
    }
  }
}
