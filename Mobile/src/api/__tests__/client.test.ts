const mockStore = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => { mockStore.set(key, value); }),
  deleteItemAsync: jest.fn(async (key: string) => { mockStore.delete(key); }),
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => "11111111-1111-4111-8111-111111111111" }));

type Client = typeof import("../client");
type Votings = typeof import("../votings");

const user = { id: 1, email: "miembro@ejemplo.invalid", first_name: "Ana", last_name: "Demo", display_name: "Ana Demo", roles: [], member_id: 7 };
const tokens = (n: number) => ({ access: `access-${n}`, refresh: `refresh-${n}`, token_type: "Bearer", expires_in: 1200, user });

function reply(status: number, body: unknown) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response);
}

let fetchMock: jest.Mock;
let client: Client;
let votings: Votings;

beforeEach(() => {
  mockStore.clear();
  jest.resetModules();
  fetchMock = jest.fn();
  globalThis.fetch = fetchMock;
  client = require("../client");
  votings = require("../votings");
});

describe("api client", () => {
  it("logs in, keeps the refresh token in secure storage and sends Bearer", async () => {
    fetchMock.mockReturnValueOnce(reply(200, tokens(1))).mockReturnValueOnce(reply(200, { count: 0, next: null, previous: null, results: [] }));

    await client.login("miembro@ejemplo.invalid", "clave-de-prueba");
    await votings.listExpedientes();

    expect(mockStore.get("mesa_refresh")).toBe("refresh-1");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer access-1");
  });

  it("removes spaces and capitals the phone keyboard adds to the email", async () => {
    fetchMock.mockReturnValueOnce(reply(200, tokens(1)));

    await client.login(" Miembro.demo@ejemplo. invalid ", "clave-de-prueba");

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).email).toBe("miembro.demo@ejemplo.invalid");
  });

  it("maps the 400 login error envelope to a readable message", async () => {
    fetchMock.mockReturnValueOnce(reply(400, { error: { code: "validation_error", detail: { non_field_errors: ["Correo o contraseña incorrectos."] } } }));

    await expect(client.login("x@ejemplo.invalid", "mal")).rejects.toMatchObject({ status: 400, message: "Correo o contraseña incorrectos." });
  });

  it("refreshes once and repeats a GET after 401", async () => {
    mockStore.set("mesa_refresh", "refresh-0");
    fetchMock
      .mockReturnValueOnce(reply(401, { error: { code: "authentication_failed", detail: { detail: "Sesión inválida o expirada." } } }))
      .mockReturnValueOnce(reply(200, tokens(2)))
      .mockReturnValueOnce(reply(200, { id: 5, title: "T", description: "", status: "open", options: ["Sí"], opens_at: null, closes_at: null, member_has_voted: false, subject: null }));

    const expediente = await votings.getExpediente(5);

    expect(expediente).toMatchObject({ id: 5, titulo: "T", estado: "open", opciones_voto: ["Sí"], ya_voto: false });
    expect(mockStore.get("mesa_refresh")).toBe("refresh-2");
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe("Bearer access-2");
  });

  it("drops the stored session when the server rejects the refresh with 403", async () => {
    mockStore.set("mesa_refresh", "refresh-used");
    fetchMock
      .mockReturnValueOnce(reply(401, {}))
      .mockReturnValueOnce(reply(403, { error: { code: "authentication_failed", detail: { detail: "Refresh token inválido o expirado." } } }));

    await expect(votings.listExpedientes()).rejects.toMatchObject({ status: 401, code: "session_expired" });
    expect(mockStore.has("mesa_refresh")).toBe(false);
  });

  it("never resends the vote POST automatically after 401", async () => {
    mockStore.set("mesa_refresh", "refresh-0");
    fetchMock.mockReturnValueOnce(reply(401, {})).mockReturnValueOnce(reply(200, tokens(2)));

    const failure = await votings.castVote({ id: 5, titulo: "T" }, "Sí", "uuid-1").catch((error) => error);

    const castCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/votings/5/cast/"));
    expect(castCalls).toHaveLength(1);
    expect(votings.classifyCastError(failure)).toMatchObject({ kind: "manual_retry", canRetrySameVote: true });
  });

  it("builds the receipt only from the 201 response", async () => {
    fetchMock.mockReturnValueOnce(reply(201, { status: "recorded", cast_at: "2026-10-06T10:00:00Z" }));

    const receipt = await votings.castVote({ id: 5, titulo: "T" }, "Sí", "uuid-1");

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ option: "Sí", client_request_id: "uuid-1" });
    expect(receipt).toEqual({ votacion_id: 5, titulo: "T", estado: "recorded", emitido_en: "2026-10-06T10:00:00Z", comprobante_url: null });
  });

  it("classifies a duplicate vote as final and a network failure as retryable with the same UUID", async () => {
    fetchMock.mockReturnValueOnce(reply(400, { error: { code: "validation_error", detail: { vote: "Ya existe un voto para este miembro en esta votación." } } }));
    const duplicate = await votings.castVote({ id: 5, titulo: "T" }, "Sí", "uuid-1").catch((error) => error);
    fetchMock.mockReturnValueOnce(Promise.reject(new TypeError("Network request failed")));
    const offline = await votings.castVote({ id: 5, titulo: "T" }, "Sí", "uuid-1").catch((error) => error);

    expect(votings.classifyCastError(duplicate)).toMatchObject({ kind: "already_voted", canRetrySameVote: false });
    expect(votings.classifyCastError(offline)).toMatchObject({ kind: "network", canRetrySameVote: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
