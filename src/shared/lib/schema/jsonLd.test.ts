import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./jsonLd";

describe("serializeJsonLd", () => {
  it("escapes script-closing content", () => {
    const serialized = serializeJsonLd({ text: "</script><script>alert(1)</script>" });
    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script>");
  });
});
