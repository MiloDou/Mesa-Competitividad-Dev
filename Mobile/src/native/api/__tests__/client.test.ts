import {
  fetchPublicInitiatives,
  getMobileSession,
  login,
  logout,
  setMobileSession,
} from "../client";

const response = (status: number, body?: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(body),
}) as unknown as Response;

const activeSession = {
  access: "access-old",
  refresh: "refresh-old",
  user: { id: 7, email: "miembro@example.test", display_name: "Miembro", roles: [] },
};

describe("mobile API session requests", () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    setMobileSession(null);
    fetchMock = jest.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it("sends login credentials without an old bearer token and stores the returned session", async () => {
    fetchMock.mockResolvedValueOnce(response(200, activeSession));

    await login("miembro@example.test", "clave-sintetica");

    const [, request] = fetchMock.mock.calls[0];
    expect(request.headers.Authorization).toBeUndefined();
    expect(JSON.parse(request.body)).toMatchObject({ email: "miembro@example.test", password: "clave-sintetica" });
    expect(getMobileSession()).toEqual(activeSession);
  });

  it("sends the bearer token when revoking the session on logout", async () => {
    setMobileSession(activeSession);
    fetchMock.mockResolvedValueOnce(response(204));

    await logout();

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer access-old");
    expect(getMobileSession()).toBeNull();
  });

  it("rotates a rejected access token and retries the original request with the new token", async () => {
    const rotatedSession = { ...activeSession, access: "access-new", refresh: "refresh-new" };
    fetchMock
      .mockResolvedValueOnce(response(401, { detail: "Unauthorized" }))
      .mockResolvedValueOnce(response(200, rotatedSession))
      .mockResolvedValueOnce(response(200, { count: 0, next: null, results: [] }));
    setMobileSession(activeSession);

    await expect(fetchPublicInitiatives()).resolves.toEqual([]);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer access-old");
    expect(fetchMock.mock.calls[1][0]).toContain("/auth/refresh/");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBeUndefined();
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe("Bearer access-new");
    expect(getMobileSession()).toEqual(rotatedSession);
  });

  it("clears the local session when refresh is rejected", async () => {
    fetchMock
      .mockResolvedValueOnce(response(401, { detail: "Unauthorized" }))
      .mockResolvedValueOnce(response(401, { detail: "Unauthorized" }));
    setMobileSession(activeSession);

    await expect(fetchPublicInitiatives()).rejects.toThrow("La sesión expiró. Inicia sesión de nuevo.");
    expect(getMobileSession()).toBeNull();
  });
});
