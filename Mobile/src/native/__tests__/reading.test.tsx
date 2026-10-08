// Pruebas focalizadas R03 (T04) — contrato CONTRATO-LECTURAS.md.
// Cubren las pantallas de lectura del worker A (VotesScreen/VoteDetailScreen con sus props
// reales: pendingState/pendingExpedientes/retryPending/pendingCanRetry/pendingErrorMessage y
// state/detailError/canRetry/retry) y la integración MobileApp con respuestas GET diferidas,
// cambio de identidad y reset de selección al abrir otra propuesta.
// Transporte 100% falso (fetch mock + SecureStore en memoria), datos sintéticos `.invalid`:
// esto NO es un backend real. Las lecturas no invocan POST; el caso de regresión
// simula un fallo y un reintento de envío para comprobar el aislamiento del detalle.
import { fireEvent, render, screen, act } from "@testing-library/react-native";
import type { ComponentProps } from "react";
import MobileApp from "../MobileApp";
import { VotesScreen, VoteDetailScreen } from "../screens/Voting";
import type { RemoteState } from "../types";
import { clearSession } from "../../api/client";
import type { Expediente } from "../../api/votings";

const mockStore = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => { mockStore.set(key, value); }),
  deleteItemAsync: jest.fn(async (key: string) => { mockStore.delete(key); }),
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => "33333333-3333-4333-8333-333333333333" }));
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

const exp = (over: Partial<Expediente> = {}): Expediente => ({
  id: 1,
  titulo: "Propuesta pendiente",
  resumen: "Resumen sintético",
  antecedentes: "",
  estado: "open",
  estado_etiqueta: "Abierta",
  opciones_voto: ["Sí", "No"],
  cierre: null,
  ya_voto: false,
  ...over,
});

function renderVotes(over: Partial<ComponentProps<typeof VotesScreen>> = {}) {
  const props: ComponentProps<typeof VotesScreen> = {
    state: "content" as RemoteState,
    expedientes: [],
    open: jest.fn(),
    retry: jest.fn(),
    canRetry: false,
    pendingState: "content" as RemoteState,
    pendingExpedientes: [],
    retryPending: jest.fn(),
    pendingCanRetry: false,
    ...over,
  };
  render(<VotesScreen {...props} />);
  return props;
}

function renderDetail(over: Partial<ComponentProps<typeof VoteDetailScreen>> = {}) {
  const props: ComponentProps<typeof VoteDetailScreen> = {
    state: "loading",
    expediente: null,
    canRetry: false,
    retry: jest.fn(),
    continueToVote: jest.fn(),
    showResults: jest.fn(),
    back: jest.fn(),
    ...over,
  };
  render(<VoteDetailScreen {...props} />);
  return props;
}

describe("VotesScreen — bandeja pendiente vs lista general", () => {
  it("muestra pendiente, ya votada y cerrada sin duplicar la bandeja", () => {
    const pendiente = exp({ id: 1, titulo: "Propuesta pendiente" });
    const votada = exp({ id: 2, titulo: "Propuesta votada", ya_voto: true });
    const cerrada = exp({ id: 3, titulo: "Propuesta cerrada", estado: "closed", estado_etiqueta: "Cerrada" });
    renderVotes({ pendingExpedientes: [pendiente], expedientes: [pendiente, votada, cerrada] });

    expect(screen.getByText("PENDIENTE · ABIERTA")).toBeTruthy();
    expect(screen.getByText("ABIERTA · YA VOTASTE")).toBeTruthy();
    expect(screen.getByText("CERRADA")).toBeTruthy();
    expect(screen.getAllByText("Propuesta pendiente")).toHaveLength(1);
    expect(screen.getByText("Propuesta votada")).toBeTruthy();
    expect(screen.getByText("Propuesta cerrada")).toBeTruthy();
  });

  it("loading de la bandeja no bloquea la lista general", () => {
    renderVotes({ pendingState: "loading", expedientes: [exp({ id: 2, titulo: "Propuesta votada" })] });

    expect(screen.getByText("Cargando pendientes…")).toBeTruthy();
    expect(screen.getByText("Propuesta votada")).toBeTruthy();
  });

  it("bandeja vacía anuncia que no hay pendientes", () => {
    renderVotes({ pendingExpedientes: [] });

    expect(screen.getByText("No hay votaciones pendientes")).toBeTruthy();
  });

  it("error de bandeja con reintento manual llama a retryPending", () => {
    const retryPending = jest.fn();
    renderVotes({
      pendingState: "error",
      pendingErrorMessage: "No se pudo cargar la información. Reintenta en unos momentos.",
      pendingCanRetry: true,
      retryPending,
    });

    expect(screen.getByText("No se pudo cargar la bandeja pendiente")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Reintentar" }));
    expect(retryPending).toHaveBeenCalledTimes(1);
  });

  it("error de bandeja sin reintento no ofrece botón", () => {
    renderVotes({ pendingState: "error", pendingErrorMessage: "La sesión expiró. Inicia sesión de nuevo.", pendingCanRetry: false });

    expect(screen.getByText("La sesión expiró. Inicia sesión de nuevo.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
  });
});

describe("VoteDetailScreen — detalle, 404 y recuperación", () => {
  it("muestra loading mientras viaja la lectura", () => {
    renderDetail({ state: "loading" });

    expect(screen.getByText("Cargando votación…")).toBeTruthy();
  });

  it("404 no muestra contenido viejo, voto ni resultados", () => {
    renderDetail({ state: "not_found", expediente: null });

    expect(screen.getByText("Votación no disponible")).toBeTruthy();
    expect(screen.queryByText("Propuesta pendiente")).toBeNull();
    expect(screen.queryByRole("button", { name: "Elegir mi voto" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Ver resultados" })).toBeNull();
  });

  it("404 con reintento permitido llama a retry", () => {
    const props = renderDetail({ state: "not_found", expediente: null, canRetry: true });

    fireEvent.press(screen.getByRole("button", { name: "Reintentar" }));
    expect(props.retry).toHaveBeenCalledTimes(1);
  });

  it("error genérico muestra el mensaje y reintenta", () => {
    const props = renderDetail({ state: "error", expediente: null, errorMessage: "No se pudo cargar la información. Reintenta en unos momentos.", canRetry: true });

    expect(screen.getByText("No se pudo cargar la información. Reintenta en unos momentos.")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Reintentar" }));
    expect(props.retry).toHaveBeenCalledTimes(1);
  });

  it("abierta sin voto permite votar y no muestra resultados", () => {
    renderDetail({ state: "content", expediente: exp({ titulo: "Propuesta abierta" }) });

    expect(screen.getByRole("button", { name: "Elegir mi voto" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Ver resultados" })).toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("ya votada anuncia voto único y no deja votar de nuevo", () => {
    renderDetail({ state: "content", expediente: exp({ ya_voto: true }) });

    expect(screen.getByText(/El voto es único y no se puede cambiar/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Elegir mi voto" })).toBeNull();
  });

  it("cerrada ofrece resultados y no ofrece votar", () => {
    const props = renderDetail({ state: "content", expediente: exp({ estado: "closed", estado_etiqueta: "Cerrada" }) });

    fireEvent.press(screen.getByRole("button", { name: "Ver resultados" }));
    expect(props.showResults).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Elegir mi voto" })).toBeNull();
  });
});

describe("MobileApp — integración con transporte falso", () => {
  interface FetchInit { method?: string; headers?: Record<string, string>; body?: string }

  const json = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response);
  const rawVoting = (id: number, title: string, over: Record<string, unknown> = {}) => ({
    id, title, description: "Descripción sintética", status: "open", options: ["Sí", "No"],
    opens_at: null, closes_at: null, member_has_voted: false, subject: null, ...over,
  });
  const rawPage = (results: unknown[], next: string | null = null) => ({ count: results.length, next, previous: null, results });

  const userX = { id: 11, email: "beto@ejemplo.invalid", first_name: "Beto", last_name: "Demo", display_name: "Beto Demo", roles: [], member_id: 7 };
  const userY = { id: 22, email: "ana@ejemplo.invalid", first_name: "Ana", last_name: "Demo", display_name: "Ana Demo", roles: [], member_id: 8 };
  const tokensFor = (label: "X" | "Y") => ({
    access: `access-${label}`, refresh: `refresh-${label}-rot`, token_type: "Bearer" as const,
    expires_in: 1200, user: label === "X" ? userX : userY,
  });

  function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => { resolve = r; });
    return { promise, resolve };
  }

  let fetchMock: jest.Mock;

  // Una sola copia de React, compartida entre el renderer y MobileApp: sin jest.resetModules().
  // El singleton de sesión del cliente se limpia con clearSession() para no filtrar estado entre casos.
  beforeEach(async () => {
    await clearSession();
    mockStore.clear();
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock;
  });

  afterEach(async () => {
    await clearSession();
    mockStore.clear();
  });

  it("la respuesta diferida de otra cuenta no se filtra tras cambiar de identidad", async () => {
    mockStore.set("mesa_refresh", "refresh-X");
    const puertaBandejaX = deferred<Response>();
    fetchMock.mockImplementation(async (url: string, init: FetchInit = {}) => {
      const path = String(url).replace(API, "");
      const auth = init.headers?.Authorization ?? "";
      if (path.startsWith("/auth/refresh/")) {
        const body = JSON.parse(String(init.body));
        return body.refresh === "refresh-X"
          ? json(200, tokensFor("X"))
          : json(403, { error: { code: "authentication_failed", detail: "Refresh inválido." } });
      }
      if (path.startsWith("/auth/login/")) {
        const body = JSON.parse(String(init.body));
        return body.email === "ana@ejemplo.invalid"
          ? json(200, tokensFor("Y"))
          : json(400, { error: { code: "validation_error", detail: { non_field_errors: ["Credenciales inválidas."] } } });
      }
      if (path.startsWith("/auth/me/")) return json(200, auth === "Bearer access-X" ? userX : userY);
      if (path.startsWith("/auth/logout/")) return json(204, {});
      if (path.startsWith("/votings/pending/")) {
        // La bandeja de Beto queda en vuelo; la de Ana responde al momento.
        if (auth === "Bearer access-X") return puertaBandejaX.promise;
        return json(200, rawPage([rawVoting(1, "Expediente de Ana")]));
      }
      if (path.startsWith("/votings/")) return json(200, rawPage([]));
      return json(404, { error: { code: "not_found", detail: "Ruta no prevista en la prueba." } });
    });

    render(<MobileApp />);
    expect(await screen.findByText("Hola, Beto Demo")).toBeTruthy();

    fireEvent.press(screen.getByText("Votar"));
    expect(await screen.findByText("Cargando pendientes…")).toBeTruthy();

    // Cambio de identidad mientras la lectura de Beto sigue en vuelo.
    fireEvent.press(screen.getByText("Perfil"));
    fireEvent.press(await screen.findByRole("button", { name: "Cerrar sesión" }));
    expect(await screen.findByRole("button", { name: "Iniciar sesión" })).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText("Correo electrónico"), "ana@ejemplo.invalid");
    fireEvent.changeText(screen.getByLabelText("Contraseña"), "clave-sintetica");
    fireEvent.press(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByText("Hola, Ana Demo")).toBeTruthy();
    fireEvent.press(screen.getByText("Votar"));
    expect(await screen.findByText("Expediente de Ana")).toBeTruthy();

    // La lectura diferida de Beto aterriza tarde: el epoch de sesión debe descartarla.
    puertaBandejaX.resolve(json(200, rawPage([rawVoting(9, "Expediente de Beto")])));
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)); });

    expect(screen.queryByText("Expediente de Beto")).toBeNull();
    expect(screen.getByText("Expediente de Ana")).toBeTruthy();
  });

  it("abrir otra propuesta resetea la selección y las lecturas nunca envían el voto", async () => {
    mockStore.set("mesa_refresh", "refresh-X");
    const detallePorId: Record<number, unknown> = { 1: rawVoting(1, "Propuesta Uno"), 2: rawVoting(2, "Propuesta Dos") };
    fetchMock.mockImplementation(async (url: string, init: FetchInit = {}) => {
      const path = String(url).replace(API, "");
      if (path.startsWith("/auth/refresh/")) return json(200, tokensFor("X"));
      if (path.startsWith("/auth/me/")) return json(200, userX);
      if (path.startsWith("/votings/pending/")) return json(200, rawPage([detallePorId[1], detallePorId[2]]));
      const detalle = path.match(/^\/votings\/(\d+)\/$/);
      if (detalle) return json(200, detallePorId[Number(detalle[1])]);
      if (path.startsWith("/votings/")) return json(200, rawPage([detallePorId[1], detallePorId[2]]));
      return json(404, { error: { code: "not_found", detail: "Ruta no prevista en la prueba." } });
    });

    render(<MobileApp />);
    expect(await screen.findByText("Hola, Beto Demo")).toBeTruthy();
    fireEvent.press(screen.getByText("Votar"));
    fireEvent.press(await screen.findByText("Propuesta Uno"));

    fireEvent.press(await screen.findByRole("button", { name: "Elegir mi voto" }));
    fireEvent.press(await screen.findByText("Sí"));
    expect(screen.getByRole("button", { name: "Revisar elección" })).toBeEnabled();

    fireEvent.press(screen.getByRole("button", { name: "Volver a propuesta" }));
    fireEvent.press(await screen.findByRole("button", { name: "Volver a votaciones" }));
    fireEvent.press(await screen.findByText("Propuesta Dos"));
    fireEvent.press(await screen.findByRole("button", { name: "Elegir mi voto" }));

    // Propuesta distinta: la elección anterior debe resetearse.
    expect(await screen.findByText("Selecciona una opción")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Revisar elección" })).toBeDisabled();

    // Ninguna lectura/reintento envió votos: los únicos POST son de autenticación.
    const posts = fetchMock.mock.calls.filter(([, init]: [string, FetchInit]) => (init?.method ?? "GET") === "POST");
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.every(([url]: [string, FetchInit]) => String(url).includes("/auth/"))).toBe(true);
    expect(fetchMock.mock.calls.every(([url]: [string]) => !String(url).includes("/cast/"))).toBe(true);
  });

  // Regresión (bug A MobileApp.tsx openExpediente): al abrir la preview mediante pendingAttempts
  // hay que invalidar detailRequestIdRef; si no, un GET anterior de otra propuesta que aterriza
  // tarde sobrescribe `expediente` y el reintento votaría la propuesta equivocada.
  it("un GET diferido de otra propuesta no sobrescribe la preview abierta vía pendingAttempts", async () => {
    mockStore.set("mesa_refresh", "refresh-X");
    const uno = rawVoting(1, "Propuesta Uno");
    const dos = rawVoting(2, "Propuesta Dos");
    const puertaDetalleUno = deferred<Response>();
    let enviosCast = 0;
    fetchMock.mockImplementation(async (url: string, init: FetchInit = {}) => {
      const path = String(url).replace(API, "");
      if (path.startsWith("/auth/refresh/")) return json(200, tokensFor("X"));
      if (path.startsWith("/auth/me/")) return json(200, userX);
      if (path.startsWith("/votings/pending/")) return json(200, rawPage([uno, dos]));
      if (path === "/votings/2/cast/") {
        enviosCast += 1;
        // Primer envío: fallo simulado reintentable (500); el reintento confirma.
        return enviosCast === 1
          ? json(500, { error: { code: "server_error", detail: "Fallo sintético del servidor." } })
          : json(201, { status: "recorded", cast_at: "2026-10-06T10:00:00Z" });
      }
      if (path === "/votings/1/") return puertaDetalleUno.promise; // GET diferido a propósito
      if (path === "/votings/2/") return json(200, dos);
      if (path.startsWith("/votings/")) return json(200, rawPage([uno, dos]));
      return json(404, { error: { code: "not_found", detail: "Ruta no prevista en la prueba." } });
    });

    render(<MobileApp />);
    expect(await screen.findByText("Hola, Beto Demo")).toBeTruthy();
    fireEvent.press(screen.getByText("Votar"));

    // Envío fallido de Propuesta Dos: pendingAttempts conserva {opción "No", UUID}.
    fireEvent.press(await screen.findByText("Propuesta Dos"));
    fireEvent.press(await screen.findByRole("button", { name: "Elegir mi voto" }));
    fireEvent.press(await screen.findByText("No"));
    fireEvent.press(screen.getByRole("button", { name: "Revisar elección" }));
    fireEvent.press(screen.getByRole("button", { name: "Enviar voto" }));
    fireEvent.press(await screen.findByRole("button", { name: "Confirmar y enviar" }));
    expect(await screen.findByText(/No se pudo confirmar el envío/)).toBeTruthy();

    // Abre Propuesta Uno (su GET queda en vuelo) y vuelve a la lista sin esperar.
    fireEvent.press(screen.getByText("Votar"));
    fireEvent.press(await screen.findByText("Propuesta Uno"));
    expect(await screen.findByText("Cargando votación…")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Volver a votaciones" }));

    // Reabre Propuesta Dos: pendingAttempts la lleva directo a la preview del envío pendiente.
    fireEvent.press(await screen.findByText("Propuesta Dos"));
    expect(await screen.findByText(/Hay un envío anterior sin confirmar/)).toBeTruthy();
    expect(screen.getByText("Opción seleccionada: No")).toBeTruthy();

    // El GET de Propuesta Uno aterriza tarde: la invalidación de detailRequestIdRef debe descartarlo.
    puertaDetalleUno.resolve(json(200, uno));
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)); });

    expect(screen.queryByText("Propuesta Uno")).toBeNull();
    expect(screen.getByText("Propuesta Dos")).toBeTruthy();
    expect(screen.getByText("Opción seleccionada: No")).toBeTruthy();

    // El reintento vota la propuesta de la preview, no la del GET desfasado.
    fireEvent.press(screen.getByRole("button", { name: "Reintentar envío" }));
    fireEvent.press(await screen.findByRole("button", { name: "Confirmar y enviar" }));
    expect(await screen.findByText("Voto registrado")).toBeTruthy();
    expect(screen.getByText("Propuesta Dos")).toBeTruthy();
    const casts = fetchMock.mock.calls.filter(([url]: [string]) => String(url).includes("/cast/"));
    expect(casts).toHaveLength(2);
    expect(casts.every(([url]: [string]) => String(url).endsWith("/votings/2/cast/"))).toBe(true);
  });
});
