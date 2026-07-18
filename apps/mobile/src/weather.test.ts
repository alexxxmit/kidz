import { describe, expect, it } from "vitest";

import { parseWeatherLocation, toWeatherContext, weatherAdvice, weatherKind, type WeatherSnapshot } from "./weather";

const snapshot = (patch: Partial<WeatherSnapshot> = {}): WeatherSnapshot => ({
  temperatureC: 8,
  feelsLikeC: 6,
  precipitationProbability: 10,
  windKph: 8,
  weatherCode: 2,
  observedAt: "2026-07-18T12:00",
  fetchedAt: "2026-07-18T12:01:00.000Z",
  ...patch,
});

describe("weather helpers", () => {
  it("maps WMO conditions and converts percentage rain to the recommendation context", () => {
    expect(weatherKind(0)).toBe("clear");
    expect(weatherKind(63)).toBe("rain");
    expect(weatherKind(73)).toBe("snow");
    expect(weatherKind(96)).toBe("storm");
    expect(toWeatherContext(snapshot({ precipitationProbability: 70 }), "school")).toMatchObject({ rainProbability: 0.7, feelsLikeC: 6, occasion: "school" });
  });

  it("gives layering advice from feels-like temperature", () => {
    expect(weatherAdvice(snapshot({ feelsLikeC: 5 }), "ru")).toContain("базовый слой");
    expect(weatherAdvice(snapshot({ feelsLikeC: 34 }), "ru")).toContain("без лишних слоёв");
  });

  it("rejects malformed stored locations", () => {
    expect(parseWeatherLocation('{"name":"Dubai"}')).toBeUndefined();
  });
});
