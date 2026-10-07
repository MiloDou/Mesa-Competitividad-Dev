// Pruebas del adapter de lecturas (R03, contrato CONTRATO-LECTURAS.md).
// Transporte falso con fetch mock y datos sintéticos: no hay red ni backend real.
const mockStore = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => { mockStore.set(key, value); }),
  deleteItemAsync: jest.fn(async (key: string) => { mockStore.delete(key); }),
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => "22222222-2222-4222-8222-222222222222" }));

type Client = typeof import("../client");
type Votings = typeof import("../votings");

const API = "http://127.0.0.1:8000/api/v1";

function voting(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    title: `Votación ${id}`,
    description: "Descripción sintética",
    status: "open",
    options: ["Sí", "No"],
    opens_at: null,
    closes_at: null,
    member_has_voted: false,
    subject: null,
    ...overrides,
  };
}

function page(results: unknown[], next: string | null) {
  return { count: results.length, next, previous: null, results };
}

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

describe("listPendingExpedientes", () => {
  it("combina dos páginas siguiendo el next absoluto del mismo origen", async () => {
    fetchMock
      .mockReturnValueOnce(reply(200, page([voting(1)], `${API}/votings/pending/?page=2`)))
      .mockReturnValueOnce(reply(200, page([voting(2)], null)));

    const pendientes = await votings.listPendingExpedientes();

    expect(pendientes.map((e) => e.id)).toEqual([1, 2]);
    expect(pendientes[0]).toMatchObject({ estado: "open", estado_etiqueta: "Abierta", ya_voto: false, opciones_voto: ["Sí", "No"] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe(`${API}/votings/pending/`);
    expect(fetchMock.mock.calls[1][0]).toBe(`${API}/votings/pending/?page=2`);
  });

  it("devuelve bandeja vacía sin abrir ninguna página extra", async () => {
    fetchMock.mockReturnValueOnce(reply(200, page([], null)));

    await expect(votings.listPendingExpedientes()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rechaza un next de otro origen sin solicitarlo ni filtrar el Bearer", async () => {
    fetchMock.mockReturnValueOnce(reply(200, page([voting(1)], "http://evil.example/api/v1/votings/pending/?page=2")));

    const error = await votings.listPendingExpedientes().catch((e) => e);

    expect(error).toBeInstanceOf(client.ApiError);
    expect(error).toMatchObject({ code: "pagination_rejected" });
    expect(votings.classifyReadError(error)).toMatchObject({ kind: "rejected", canRetry: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.every(([url]: [string]) => !url.includes("evil.example"))).toBe(true);
  });

  it("rechaza un ciclo de paginación de forma explícita", async () => {
    fetchMock.mockReturnValueOnce(reply(200, page([voting(1)], `${API}/votings/pending/`)));

    await expect(votings.listPendingExpedientes()).rejects.toMatchObject({ code: "pagination_rejected" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rechaza una ruta inesperada aunque sea del mismo origen", async () => {
    fetchMock.mockReturnValueOnce(reply(200, page([voting(1)], `${API}/auth/me/`)));

    await expect(votings.listPendingExpedientes()).rejects.toMatchObject({ code: "pagination_rejected" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("aplica el tope de páginas como error, no como truncado silencioso", async () => {
    let siguiente = 2;
    fetchMock.mockImplementation(() => reply(200, page([voting(1)], `${API}/votings/pending/?page=${siguiente++}`)));

    await expect(votings.listPendingExpedientes()).rejects.toMatchObject({ code: "pagination_rejected" });
    expect(fetchMock).toHaveBeenCalledTimes(20);
  });

  it("mapea member_has_voted a ya_voto con toExpediente (el filtro de la bandeja lo hace el backend, no el cliente)", async () => {
    fetchMock.mockReturnValueOnce(reply(200, page([voting(1, { member_has_voted: false }), voting(2, { member_has_voted: true, status: "closed" })], null)));

    const [pendiente, votada] = await votings.listPendingExpedientes();

    expect(pendiente.ya_voto).toBe(false);
    expect(votada).toMatchObject({ ya_voto: true, estado: "closed", estado_etiqueta: "Cerrada" });
  });
});

describe("getExpediente y classifyReadError", () => {
  it("404 rechaza con el ApiError existente y se clasifica como not_found", async () => {
    fetchMock.mockReturnValueOnce(reply(404, { error: { code: "not_found", detail: "Voting interno pk=9 no hallado" } }));

    const error = await votings.getExpediente(9).catch((e) => e);

    expect(error).toBeInstanceOf(client.ApiError);
    expect(error).toMatchObject({ status: 404 });
    const clasificado = votings.classifyReadError(error);
    expect(clasificado).toMatchObject({ kind: "not_found", canRetry: false });
    expect(clasificado.message).not.toContain("interno");
    expect(clasificado.message).not.toContain("pk=9");
  });

  it("fallo de red se clasifica como network con reintento manual", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Network request failed"));

    const error = await votings.listPendingExpedientes().catch((e) => e);
    const clasificado = votings.classifyReadError(error);

    expect(clasificado).toMatchObject({ kind: "network", canRetry: true });
    expect(clasificado.message).not.toContain("Network request failed");
  });

  it("500 se clasifica como network sin exponer el cuerpo interno", async () => {
    fetchMock.mockReturnValueOnce(reply(500, { error: { code: "server_error", detail: "Traceback interno del servidor" } }));

    const error = await votings.getExpediente(3).catch((e) => e);
    const clasificado = votings.classifyReadError(error);

    expect(clasificado).toMatchObject({ kind: "network", canRetry: true });
    expect(clasificado.message).not.toContain("Traceback");
  });

  it("sesión expirada sin refresh se clasifica session_expired y no reintenta", async () => {
    fetchMock.mockReturnValueOnce(reply(401, { error: { code: "authentication_failed", detail: { detail: "Sesión inválida o expirada." } } }));

    const error = await votings.listPendingExpedientes().catch((e) => e);

    expect(votings.classifyReadError(error)).toMatchObject({ kind: "session_expired", canRetry: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("un error que no es ApiError se clasifica rejected", () => {
    expect(votings.classifyReadError(new Error("fallo interno inesperado"))).toMatchObject({ kind: "rejected", canRetry: false });
  });
});

describe("transporte de solo lectura", () => {
  it("bandeja y detalle nunca envían POST ni body", async () => {
    fetchMock
      .mockReturnValueOnce(reply(200, page([voting(1)], `${API}/votings/pending/?page=2`)))
      .mockReturnValueOnce(reply(200, page([], null)))
      .mockReturnValueOnce(reply(200, voting(1)));

    await votings.listPendingExpedientes();
    await votings.getExpediente(1);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const [url, init] of fetchMock.mock.calls) {
      expect(init.method).toBe("GET");
      expect(init.body).toBeUndefined();
      expect(String(url)).not.toContain("/cast/");
    }
  });
});
