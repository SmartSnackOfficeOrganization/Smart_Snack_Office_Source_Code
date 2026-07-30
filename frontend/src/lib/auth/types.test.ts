import { AuthError } from "@/lib/auth/types";

describe("AuthError", () => {
  it("sets name to AuthError", () => {
    const error = new AuthError("NETWORK", "Network error");
    expect(error.name).toBe("AuthError");
  });

  it("sets code correctly", () => {
    const error = new AuthError("INVALID_CREDENTIALS", "Bad creds");
    expect(error.code).toBe("INVALID_CREDENTIALS");
  });

  it("sets message correctly", () => {
    const error = new AuthError("UNKNOWN", "Something went wrong");
    expect(error.message).toBe("Something went wrong");
  });

  it("is an instance of Error", () => {
    const error = new AuthError("NETWORK", "test");
    expect(error).toBeInstanceOf(Error);
  });

  it("is an instance of AuthError", () => {
    const error = new AuthError("NETWORK", "test");
    expect(error).toBeInstanceOf(AuthError);
  });
});
