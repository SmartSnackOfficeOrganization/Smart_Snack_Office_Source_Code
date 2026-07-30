import { requestPasswordReset, resetPassword } from "@/lib/auth/passwordReset";

describe("requestPasswordReset", () => {
  it("returns a reset URL in mock mode", async () => {
    const url = await requestPasswordReset("test@empresa.com");
    expect(url).toBe("/reset-password/bW9ja1VpZA==/mock-token-abc123/");
  });

  it("returns a reset URL for any email in mock mode", async () => {
    const url = await requestPasswordReset("nonexistent@empresa.com");
    expect(url).toBe("/reset-password/bW9ja1VpZA==/mock-token-abc123/");
  });
});

describe("resetPassword", () => {
  it("resolves without error in mock mode", async () => {
    await expect(
      resetPassword("dGVzdA==", "mock-token", "NewPassword1!"),
    ).resolves.toBeUndefined();
  });

  it("resolves with any token in mock mode", async () => {
    await expect(
      resetPassword("dGVzdA==", "any-token", "NewPassword1!"),
    ).resolves.toBeUndefined();
  });
});
