import { describe, expect, it } from "vitest";
import { isValidEmail, validateLogin, validateRegister } from "@/lib/validation/auth";

describe("authentication form validation", () => {
  it("validates conventional email addresses", () => { expect(isValidEmail("explorer@example.com")).toBe(true); expect(isValidEmail("not-an-email")).toBe(false); });
  it("reports login fields without authenticating", () => { expect(validateLogin({ email: "bad", password: "tiny" })).toEqual({ email: "Enter a valid email address.", password: "Password must be at least 8 characters." }); });
  it("accepts a valid login shape", () => { expect(validateLogin({ email: "explorer@example.com", password: "trailpass9" })).toEqual({}); });
  it("requires a matching mixed password for registration", () => { expect(validateRegister({ username: "Ex", email: "explorer@example.com", password: "allletters", confirmPassword: "different" })).toMatchObject({ username: expect.any(String), password: expect.any(String), confirmPassword: expect.any(String) }); });
  it("accepts a valid registration shape", () => { expect(validateRegister({ username: "JungleFox", email: "explorer@example.com", password: "trailpass9", confirmPassword: "trailpass9" })).toEqual({}); });
});
