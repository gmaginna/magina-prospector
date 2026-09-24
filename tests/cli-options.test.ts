import { describe, expect, it } from "vitest";
import { hasOption, optionValue } from "../src/utils/cli-options.js";

describe("CLI options", () => {
  it("reads regular and inline arguments", () => {
    expect(optionValue("--city", ["prospect", "--city", "Campinas"], {})).toBe("Campinas");
    expect(optionValue("--niche", ["prospect", "--niche=Móveis planejados"], {})).toBe("Móveis planejados");
  });

  it("reads options that npm exposes as config environment variables", () => {
    const npmEnvironment = {
      npm_config_dry_run: "true",
      npm_config_city: "Campinas",
      npm_config_niche: "Móveis planejados",
    };
    expect(hasOption("--dry-run", [], npmEnvironment)).toBe(true);
    expect(optionValue("--city", [], npmEnvironment)).toBe("Campinas");
    expect(optionValue("--niche", [], npmEnvironment)).toBe("Móveis planejados");
  });
});
