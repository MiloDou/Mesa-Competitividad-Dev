import { randomUUID } from "expo-crypto";
import { ApiError, apiRequest, MANUAL_RETRY_CODE, NETWORK_ERROR_CODE, SESSION_EXPIRED_CODE } from "./client";
import type { CastVoteResponse, Page, Voting, VotingResults, VotingStatus } from "./types";

/** Vista móvil de una votación con los nombres del entregable del Run 03 (`openapi_movil.yaml`, x-mobile-mapping). */
export interface Expediente {
  id: number;
  titulo: string;
  resumen: string;
  antecedentes: string;
  estado: VotingStatus;
  estado_etiqueta: string;
  opciones_voto: string[];
  cierre: string | null;
  ya_voto: boolean;
}

/** Acuse oficial: solo se construye con la respuesta 201 del servidor. */
export interface Comprobante {
  votacion_id: number;
  titulo: string;
  estado: CastVoteResponse["status"];
  emitido_en: string;
  /** El backend todavía no expone un recibo descargable. */
  comprobante_url: null;
}

const statusLabels: Record<VotingStatus, string> = {
  draft: "Borrador",
  scheduled: "Programada",
  open: "Abierta",
  closed: "Cerrada",
};

export function toExpediente(voting: Voting): Expediente {
  return {
    id: voting.id,
    titulo: voting.subject?.title || voting.title,
    resumen: voting.subject?.summary || voting.description,
    antecedentes: voting.subject?.background ?? "",
    estado: voting.status,
    estado_etiqueta: statusLabels[voting.status] ?? voting.status,
    opciones_voto: voting.options,
    cierre: voting.closes_at,
    ya_voto: voting.member_has_voted,
  };
}

export async function listExpedientes(): Promise<Expediente[]> {
  const items: Voting[] = [];
  let next: string | null = "/votings/";
  while (next) {
    const page: Page<Voting> = await apiRequest<Page<Voting>>(next);
    items.push(...page.results);
    next = page.next;
  }
  return items.map(toExpediente);
}

export async function getExpediente(id: number): Promise<Expediente> {
  return toExpediente(await apiRequest<Voting>(`/votings/${id}/`));
}

/** Un UUID por intención de voto. Reutilízalo solo en un reintento manual del mismo voto. */
export function newClientRequestId(): string {
  return randomUUID();
}

/** Envía el voto una sola vez. No hay reintento automático; ante un error, la persona decide si reintenta. */
export async function castVote(expediente: Pick<Expediente, "id" | "titulo">, option: string, clientRequestId: string): Promise<Comprobante> {
  const receipt = await apiRequest<CastVoteResponse>(`/votings/${expediente.id}/cast/`, {
    method: "POST",
    body: { option, client_request_id: clientRequestId },
    retryAfterRefresh: false,
  });
  return { votacion_id: expediente.id, titulo: expediente.titulo, estado: receipt.status, emitido_en: receipt.cast_at, comprobante_url: null };
}

export function getResults(id: number): Promise<VotingResults> {
  return apiRequest<VotingResults>(`/votings/${id}/results/`);
}

export type CastFailure = "network" | "manual_retry" | "session_expired" | "already_voted" | "closed" | "rejected";

/** Clasifica el error de `castVote` según la clave de `error.detail` (el código siempre llega como `validation_error`). */
export function classifyCastError(error: unknown): { kind: CastFailure; message: string; canRetrySameVote: boolean } {
  if (!(error instanceof ApiError)) return { kind: "network", message: "No se pudo confirmar el envío.", canRetrySameVote: true };
  if (error.code === NETWORK_ERROR_CODE || error.status >= 500) {
    return { kind: "network", message: "No se pudo confirmar el envío. Si reintentas, se reenviará el mismo voto y el servidor no lo duplicará.", canRetrySameVote: true };
  }
  if (error.code === MANUAL_RETRY_CODE) return { kind: "manual_retry", message: error.message, canRetrySameVote: true };
  if (error.code === SESSION_EXPIRED_CODE) return { kind: "session_expired", message: error.message, canRetrySameVote: false };
  if (error.field === "vote") return { kind: "already_voted", message: "Ya existe un voto tuyo en esta votación. El voto es único y no se puede cambiar.", canRetrySameVote: false };
  if (error.field === "voting") return { kind: "closed", message: "La votación no está abierta.", canRetrySameVote: false };
  return { kind: "rejected", message: error.message, canRetrySameVote: false };
}
