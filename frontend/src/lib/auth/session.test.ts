import {
  saveAuthSession,
  getAuthSession,
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
} from "@/lib/auth/session";
import { AUTH_STORAGE_KEY } from "@/lib/auth/constants";
import { AuthSession } from "@/lib/auth/types";

const mockSession: AuthSession = {
  access: "mock.access.token",
  refresh: "mock.refresh.token",
  role: "buyer",
  email: "test@empresa.com",
};

describe("saveAuthSession", () => {
  afterEach(() => localStorage.clear());

  it("saves session to localStorage with correct key", () => {
    saveAuthSession(mockSession);
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    expect(stored).toBe(JSON.stringify(mockSession));
  });

  it("overwrites existing session", () => {
    saveAuthSession(mockSession);
    const newSession = { ...mockSession, email: "other@empresa.com" };
    saveAuthSession(newSession);
    expect(JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)!)).toEqual(newSession);
  });
});

describe("getAuthSession", () => {
  afterEach(() => localStorage.clear());

  it("returns parsed session when valid data exists", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockSession));
    expect(getAuthSession()).toEqual(mockSession);
  });

  it("returns null when localStorage is empty", () => {
    expect(getAuthSession()).toBeNull();
  });

  it("returns null and clears storage when JSON is corrupt", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, "invalid-json{{{");
    expect(getAuthSession()).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});

describe("clearAuthSession", () => {
  afterEach(() => localStorage.clear());

  it("removes session from localStorage", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockSession));
    clearAuthSession();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("does not throw when no session exists", () => {
    expect(() => clearAuthSession()).not.toThrow();
  });
});

describe("getAccessToken", () => {
  afterEach(() => localStorage.clear());

  it("returns access token when session exists", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockSession));
    expect(getAccessToken()).toBe("mock.access.token");
  });

  it("returns null when no session exists", () => {
    expect(getAccessToken()).toBeNull();
  });
});

describe("getRefreshToken", () => {
  afterEach(() => localStorage.clear());

  it("returns refresh token when session exists", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockSession));
    expect(getRefreshToken()).toBe("mock.refresh.token");
  });

  it("returns null when no session exists", () => {
    expect(getRefreshToken()).toBeNull();
  });
});
