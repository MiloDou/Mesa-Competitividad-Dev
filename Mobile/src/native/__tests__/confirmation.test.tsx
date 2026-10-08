// Pruebas R04 T01/T02 — confirmación obligatoria y aviso tras POST 201.
// Transporte 100% falso (fetch mock + SecureStore en memoria), datos sintéticos `.invalid`.
import { fireEvent, render, screen, act } from "@testing-library/react-native";
import { BackHandler, Modal } from "react-native";
import MobileApp from "../MobileApp";
import { clearSession } from "../../api/client";

const mockStore = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => { mockStore.set(key, value); }),
  deleteItemAsync: jest.fn(async (key: string) => { mockStore.delete(key); }),
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => "44444444-4444-4444-8444-444444444444" }));
jest.mock("@expo-google-fonts/montserrat", () => ({ useFonts: () => [true] }));
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const ReactNative = require("react-native");
  return {
    SafeAreaProvider: ({ children }: { children?: React.ReactNode }) => React.createElement(ReactNative.View, null, children),
    SafeAreaView: ({ children }: { children?: React.ReactNode }) => React.createElement(ReactNative.View, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  };
});

const API = "http://127.0.0.1:8000/api/v1";
interface FetchInit { method?: string; headers?: Record<string, string>; body?: string }

const json = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response);
const voting = { id: 1, title: "Propuesta Uno", description: "Descripción sintética", status: "open", options: ["Sí", "No"], opens_at: null, closes_at: null, member_has_voted: false, subject: null };
const page = { count: 1, next: null, previous: null, results: [voting] };
const user = { id: 11, email: "beto@ejemplo.invalid", first_name: "Beto", last_name: "Demo", display_name: "Beto Demo", roles: [], member_id: 7 };
const tokens = { access: "access-X", refresh: "refresh-X-rot", token_type: "Bearer", expires_in: 1200, user };

let fetchMock: jest.Mock;
const castCalls = () => fetchMock.mock.calls.filter(([url]: [string]) => String(url).includes("/cast/"));

beforeEach(async () => {
  await clearSession();
  mockStore.clear();
  mockStore.set("mesa_refresh", "refresh-X");
  fetchMock = jest.fn(async (url: string, _init: FetchInit = {}) => {
    const path = String(url).replace(API, "");
    if (path.startsWith("/auth/refresh/")) return json(200, tokens);
    if (path.startsWith("/auth/me/")) return json(200, user);
    if (path === "/votings/1/cast/") return json(201, { status: "recorded", cast_at: "2026-10-07T15:30:00Z" });
    if (path === "/votings/1/") return json(200, voting);
    if (path.startsWith("/votings/")) return json(200, page);
    return json(404, { error: { code: "not_found", detail: "Ruta no prevista." } });
  });
  globalThis.fetch = fetchMock;
});

afterEach(async () => {
  await clearSession();
  mockStore.clear();
});

async function goToPreview() {
  render(<MobileApp />);
  expect(await screen.findByText("Hola, Beto Demo")).toBeTruthy();
  fireEvent.press(screen.getByText("Votar"));
  fireEvent.press((await screen.findAllByText("Propuesta Uno"))[0]);
  fireEvent.press(await screen.findByRole("button", { name: "Elegir mi voto" }));
  fireEvent.press(await screen.findByText("Sí"));
  fireEvent.press(screen.getByRole("button", { name: "Revisar elección" }));
  fireEvent.press(await screen.findByRole("button", { name: "Enviar voto" }));
}

describe("Confirmación obligatoria antes del POST", () => {
  it("abrir el diálogo no envía; Cancelar y Back lo cierran sin POST", async () => {
    await goToPreview();
    expect(await screen.findByText("¿Confirmar tu voto?")).toBeTruthy();
    expect(screen.getByText(/Opción: Sí/)).toBeTruthy();
    expect(castCalls()).toHaveLength(0);

    fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByText("¿Confirmar tu voto?")).toBeNull();

    fireEvent.press(screen.getByRole("button", { name: "Enviar voto" }));
    expect(await screen.findByText("¿Confirmar tu voto?")).toBeTruthy();
    act(() => { screen.UNSAFE_getByType(Modal).props.onRequestClose(); });
    expect(screen.queryByText("¿Confirmar tu voto?")).toBeNull();

    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
    expect(castCalls()).toHaveLength(0);
  });
});

describe("Aviso tras POST 201", () => {
  it("muestra aviso simple sin comprobante oficial, fecha ni opción", async () => {
    await goToPreview();
    fireEvent.press(await screen.findByRole("button", { name: "Confirmar y enviar" }));

    expect(await screen.findByText("Voto registrado")).toBeTruthy();
    expect(castCalls()).toHaveLength(1);
    expect(screen.queryByText(/COMPROBANTE OFICIAL/)).toBeNull();
    expect(screen.queryByText(/Registrado:/)).toBeNull();
    expect(screen.queryByText(/2026/)).toBeNull();
    expect(screen.queryByText("Sí")).toBeNull();
  });
});

describe("Envío único", () => {
  it("doble toque en Confirmar y enviar hace un solo POST", async () => {
    let releaseCast!: (response: Response) => void;
    const base = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation((url: string, init?: FetchInit) => (
      String(url).includes("/cast/") ? new Promise<Response>((resolve) => { releaseCast = resolve; }) : base(url, init)
    ));
    await goToPreview();
    const confirmButton = await screen.findByRole("button", { name: "Confirmar y enviar" });
    act(() => {
      fireEvent.press(confirmButton);
      fireEvent.press(confirmButton);
    });
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
    expect(castCalls()).toHaveLength(1);
    expect(screen.queryByText("Perfil")).toBeNull(); // navegación bloqueada durante el envío

    await act(async () => { releaseCast(json(201, { status: "recorded", cast_at: "2026-10-07T15:30:00Z" })); });
    expect(await screen.findByText("Voto registrado")).toBeTruthy();
    expect(castCalls()).toHaveLength(1);
  });
});

describe("POST ambiguo → un GET de verificación, sin reenvío automático", () => {
  type Reply = Response | Error;
  function route(castReplies: Reply[], verifyReply: Reply, refreshAfterCast: Response = json(200, tokens)) {
    let castDone = false;
    fetchMock.mockImplementation(async (url: string, _init: FetchInit = {}) => {
      const path = String(url).replace(API, "");
      if (path.startsWith("/auth/refresh/")) return castDone ? refreshAfterCast : json(200, tokens);
      if (path.startsWith("/auth/me/")) return json(200, user);
      if (path === "/votings/1/cast/") {
        castDone = true;
        const reply = castReplies.shift()!;
        if (reply instanceof Error) throw reply;
        return reply;
      }
      if (path === "/votings/1/") {
        if (!castDone) return json(200, voting);
        if (verifyReply instanceof Error) throw verifyReply;
        return verifyReply;
      }
      if (path.startsWith("/votings/")) return json(200, page);
      return json(404, { error: { code: "not_found", detail: "Ruta no prevista." } });
    });
  }
  const urls = () => fetchMock.mock.calls.map(([url]: [string]) => String(url).replace(API, ""));
  const verifyGets = () => {
    const all = urls();
    return all.slice(all.indexOf("/votings/1/cast/") + 1).filter((path) => path === "/votings/1/").length;
  };
  const settle = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
  const fail500 = () => json(500, { error: { code: "server_error", detail: "Fallo sintético." } });

  it("500 + GET member_has_voted=true → aviso de voto existente sin opción ni fecha", async () => {
    route([fail500()], json(200, { ...voting, member_has_voted: true }));
    await goToPreview();
    fireEvent.press(await screen.findByRole("button", { name: "Confirmar y enviar" }));

    expect(await screen.findByText("Voto ya registrado")).toBeTruthy();
    expect(screen.getByText(/Tu cuenta ya tiene un voto registrado/)).toBeTruthy();
    expect(screen.queryByText(/COMPROBANTE OFICIAL/)).toBeNull();
    expect(screen.queryByText(/2026/)).toBeNull();
    expect(screen.queryByText("Sí")).toBeNull();
    await settle();
    expect(castCalls()).toHaveLength(1);
    expect(verifyGets()).toBe(1);
  });

  it("cast 401 + refresh OK (manual_retry) + GET true → aviso de cuenta, sin POST automático", async () => {
    route([json(401, { error: { code: "not_authenticated", detail: "Token expirado." } })], json(200, { ...voting, member_has_voted: true }));
    await goToPreview();
    fireEvent.press(await screen.findByRole("button", { name: "Confirmar y enviar" }));

    expect(await screen.findByText("Voto ya registrado")).toBeTruthy();
    expect(screen.queryByText(/2026/)).toBeNull();
    expect(screen.queryByText("Sí")).toBeNull();
    await settle();
    expect(castCalls()).toHaveLength(1);
    expect(verifyGets()).toBe(1);
  });

  it("TypeError + GET false → incierto; reintento manual con mismo UUID y opción", async () => {
    route([new TypeError("Network request failed"), json(201, { status: "recorded", cast_at: "2026-10-07T15:30:00Z" })], json(200, voting));
    await goToPreview();
    fireEvent.press(await screen.findByRole("button", { name: "Confirmar y enviar" }));

    expect(await screen.findByText(/No pudimos confirmar si tu voto quedó registrado/)).toBeTruthy();
    expect(screen.queryByText("Voto registrado")).toBeNull();
    expect(screen.queryByText("Voto ya registrado")).toBeNull();
    expect(screen.queryByRole("button", { name: "Cambiar opción" })).toBeNull();
    await settle();
    expect(castCalls()).toHaveLength(1);
    expect(verifyGets()).toBe(1);

    fireEvent.press(screen.getByRole("button", { name: "Reintentar envío" }));
    fireEvent.press(await screen.findByRole("button", { name: "Confirmar y enviar" }));
    expect(await screen.findByText("Voto registrado")).toBeTruthy();
    const bodies = castCalls().map(([, init]: [string, FetchInit]) => JSON.parse(String(init.body)));
    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toEqual(bodies[0]);
    expect(bodies[0]).toEqual({ option: "Sí", client_request_id: "44444444-4444-4444-8444-444444444444" });
  });

  it("500 + GET 500 → incierto sin aviso ni POST automático", async () => {
    route([fail500()], fail500());
    await goToPreview();
    fireEvent.press(await screen.findByRole("button", { name: "Confirmar y enviar" }));

    expect(await screen.findByText(/No pudimos confirmar si tu voto quedó registrado/)).toBeTruthy();
    expect(screen.queryByText(/Voto (ya )?registrado/)).toBeNull();
    await settle();
    expect(castCalls()).toHaveLength(1);
    expect(verifyGets()).toBe(1);
  });

  it("500 + GET 401 con refresh rechazado → vuelve a login sin fuga", async () => {
    route([fail500()], json(401, { error: { code: "not_authenticated", detail: "Token inválido." } }),
      json(403, { error: { code: "authentication_failed", detail: "Refresh inválido." } }));
    await goToPreview();
    fireEvent.press(await screen.findByRole("button", { name: "Confirmar y enviar" }));

    expect(await screen.findByRole("button", { name: "Iniciar sesión" })).toBeTruthy();
    expect(screen.queryByText("Propuesta Uno")).toBeNull();
    // Mensaje honesto: tras el login el intento local se pierde; no se promete reintento seguro.
    expect(screen.getByText(/La sesión expiró/)).toBeTruthy();
    expect(screen.queryByText(/reintentar el mismo voto/)).toBeNull();
    expect(screen.queryByText(/Voto (ya )?registrado/)).toBeNull();
    await settle();
    expect(castCalls()).toHaveLength(1);
  });
});

describe("Back de hardware en la preview", () => {
  const pressBack = () => {
    const calls = (BackHandler.addEventListener as unknown as jest.SpyInstance).mock.calls;
    let handled: boolean | null | undefined;
    act(() => { handled = calls[calls.length - 1][1](); });
    return handled;
  };
  beforeEach(() => { jest.spyOn(BackHandler, "addEventListener"); });
  afterEach(() => { jest.restoreAllMocks(); });

  it("sin intento vuelve a elegir opción y no sale de la app", async () => {
    await goToPreview();
    fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
    expect(pressBack()).toBe(true);
    expect(await screen.findByText("Selecciona una opción")).toBeTruthy();
  });

  it("durante el POST queda bloqueado", async () => {
    const base = fetchMock.getMockImplementation()!;
    let releaseCast!: (response: Response) => void;
    fetchMock.mockImplementation((url: string, init?: FetchInit) => (
      String(url).includes("/cast/") ? new Promise<Response>((resolve) => { releaseCast = resolve; }) : base(url, init)
    ));
    await goToPreview();
    fireEvent.press(await screen.findByRole("button", { name: "Confirmar y enviar" }));
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
    expect(pressBack()).toBe(true);
    expect(screen.getByText("Confirmar voto")).toBeTruthy();
    await act(async () => { releaseCast(json(201, { status: "recorded", cast_at: "2026-10-07T15:30:00Z" })); });
  });

  it("tras fallo incierto va a votaciones, nunca a cambiar opción, y conserva UUID/opción", async () => {
    let casts = 0;
    const base = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (url: string, init?: FetchInit) => {
      const path = String(url).replace(API, "");
      if (path === "/votings/1/cast/") {
        casts += 1;
        return casts === 1 ? json(500, { error: { code: "server_error", detail: "Fallo." } }) : json(201, { status: "recorded", cast_at: "2026-10-07T15:30:00Z" });
      }
      return base(url, init);
    });
    await goToPreview();
    fireEvent.press(await screen.findByRole("button", { name: "Confirmar y enviar" }));
    expect(await screen.findByText(/No pudimos confirmar si tu voto quedó registrado/)).toBeTruthy();

    expect(pressBack()).toBe(true);
    expect(await screen.findByText("Todas las votaciones")).toBeTruthy();
    expect(screen.queryByText("Selecciona una opción")).toBeNull();

    fireEvent.press((await screen.findAllByText("Propuesta Uno"))[0]);
    expect(await screen.findByText("Opción seleccionada: Sí")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Reintentar envío" }));
    fireEvent.press(await screen.findByRole("button", { name: "Confirmar y enviar" }));
    expect(await screen.findByText("Voto registrado")).toBeTruthy();
    const bodies = castCalls().map(([, init]: [string, FetchInit]) => JSON.parse(String(init.body)));
    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toEqual(bodies[0]);
  });
});

describe("Cachés tras voto registrado", () => {
  it.each([
    ["POST 201", () => json(201, { status: "recorded", cast_at: "2026-10-07T15:30:00Z" })],
    ["500 + GET true", () => json(500, { error: { code: "server_error", detail: "Fallo." } })],
  ])("%s: Inicio y votaciones no vuelven a ofrecerla como pendiente", async (_label, castReply) => {
    let voted = false;
    fetchMock.mockImplementation(async (url: string) => {
      const path = String(url).replace(API, "");
      if (path.startsWith("/auth/refresh/")) return json(200, tokens);
      if (path.startsWith("/auth/me/")) return json(200, user);
      if (path === "/votings/1/cast/") { voted = true; return castReply(); }
      const current = { ...voting, member_has_voted: voted };
      if (path === "/votings/1/") return json(200, current);
      if (path.startsWith("/votings/pending/")) return json(200, { ...page, count: voted ? 0 : 1, results: voted ? [] : [current] });
      if (path.startsWith("/votings/")) return json(200, { ...page, results: [current] });
      return json(404, { error: { code: "not_found", detail: "Ruta no prevista." } });
    });
    await goToPreview();
    fireEvent.press(await screen.findByRole("button", { name: "Confirmar y enviar" }));
    expect(await screen.findByText(/^Voto (ya )?registrado$/)).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Volver al inicio" }));
    expect(screen.queryByText(/votación pendiente/i)).toBeNull();
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
    expect(screen.queryByText(/votación pendiente/i)).toBeNull();

    fireEvent.press(screen.getByText("Votar"));
    expect(screen.queryByText(/pendiente ·/i)).toBeNull();
    expect(await screen.findByText(/ya votaste/i)).toBeTruthy();
    expect(screen.queryByText(/pendiente ·/i)).toBeNull();
    fireEvent.press(screen.getByText("Propuesta Uno"));
    expect(await screen.findByText(/ya está registrado/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Elegir mi voto" })).toBeNull();
    expect(castCalls()).toHaveLength(1);
  });
});

describe("RNF: máximo cinco activaciones desde Inicio", () => {
  async function fromHomeToDialog() {
    render(<MobileApp />);
    fireEvent.press(await screen.findByText("Propuesta Uno")); // 1: tarjeta pendiente en Inicio
    fireEvent.press(await screen.findByRole("button", { name: "Elegir mi voto" })); // 2
    fireEvent.press(await screen.findByText("Sí")); // 3
    fireEvent.press(screen.getByRole("button", { name: "Revisar elección" })); // 4
  }

  it("tras la cuarta activación el diálogo ya está visible sin POST; la quinta envía una vez", async () => {
    await fromHomeToDialog();
    expect(await screen.findByText("¿Confirmar tu voto?")).toBeTruthy();
    expect(screen.getByText(/Opción: Sí/)).toBeTruthy();
    expect(castCalls()).toHaveLength(0);

    fireEvent.press(screen.getByRole("button", { name: "Confirmar y enviar" })); // 5
    expect(await screen.findByText("Voto registrado")).toBeTruthy();
    expect(castCalls()).toHaveLength(1);
  });

  it("Cancelar el diálogo autoabierto deja la preview para revisar o cambiar, sin POST", async () => {
    await fromHomeToDialog();
    fireEvent.press(await screen.findByRole("button", { name: "Cancelar" }));
    expect(screen.queryByText("¿Confirmar tu voto?")).toBeNull();
    expect(screen.getByText("Opción seleccionada: Sí")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cambiar opción" })).toBeTruthy();
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
    expect(castCalls()).toHaveLength(0);
  });

  it("reentrada con intento pendiente no autoabre el diálogo", async () => {
    let casts = 0;
    const base = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (url: string, init?: FetchInit) => {
      const path = String(url).replace(API, "");
      if (path === "/votings/1/cast/") { casts += 1; return json(500, { error: { code: "server_error", detail: "Fallo." } }); }
      return base(url, init);
    });
    await fromHomeToDialog();
    fireEvent.press(await screen.findByRole("button", { name: "Confirmar y enviar" }));
    expect(await screen.findByText(/No pudimos confirmar/)).toBeTruthy();
    fireEvent.press(screen.getByText("Votar"));
    fireEvent.press((await screen.findAllByText("Propuesta Uno"))[0]);
    expect(await screen.findByText(/Hay un envío anterior sin confirmar/)).toBeTruthy();
    expect(screen.getByText("Opción seleccionada: Sí")).toBeTruthy();
    expect(screen.queryByText("¿Confirmar tu voto?")).toBeNull();
    expect(casts).toBe(1);
  });
});
