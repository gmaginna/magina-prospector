import { describe, expect, it } from "vitest";
import { dedupeKey, fallbackHash } from "../src/utils/hash.js";

describe("deduplicação", () => {
  it("usa placeId como identificador primário", () => {
    expect(dedupeKey({ placeId: "abc", dedupeHash: "one" })).toBe(dedupeKey({ placeId: "abc", dedupeHash: "two" }));
    expect(dedupeKey({ placeId: "abc", dedupeHash: "one" })).not.toBe(dedupeKey({ placeId: "def", dedupeHash: "one" }));
  });
  it("normaliza acentos e telefone no fallback", () => {
    const first = fallbackHash({ companyName: "Café São João", phone: "+55 (19) 3333-2222", city: "Campinas" });
    const second = fallbackHash({ companyName: "Cafe Sao Joao", phone: "551933332222", city: "Campinas" });
    expect(first).toBe(second);
  });
  it("gera hash diferente quando cidade ou telefone diferem", () => {
    const base = { companyName: "Empresa", phone: "1912345678", city: "Campinas" };
    expect(fallbackHash(base)).not.toBe(fallbackHash({ ...base, city: "Valinhos" }));
  });
});
