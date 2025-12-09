import { describe, it, expect } from "vitest";
import sgMail from "@sendgrid/mail";

describe("SendGrid Configuration", () => {
  it("should have SENDGRID_API_KEY configured", () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(apiKey?.startsWith("SG.")).toBe(true);
  });

  it("should have SENDGRID_FROM_EMAIL configured", () => {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    expect(fromEmail).toBeDefined();
    expect(fromEmail).not.toBe("");
    expect(fromEmail).toContain("@");
  });

  it("should have SENDGRID_FROM_NAME configured", () => {
    const fromName = process.env.SENDGRID_FROM_NAME;
    expect(fromName).toBeDefined();
    expect(fromName).not.toBe("");
  });

  it("should be able to set SendGrid API key without errors", () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      expect(() => {
        sgMail.setApiKey(apiKey);
      }).not.toThrow();
    }
  });
});
