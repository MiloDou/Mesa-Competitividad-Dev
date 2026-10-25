import { fetchAllPages, type PublicEventRecord } from "../api/client";
import type { AgendaActivity } from "../types/public";

export async function fetchAgendaActivities(): Promise<AgendaActivity[]> {
  const events = await fetchAllPages<PublicEventRecord>("/public/events/");
  return events.map((event) => ({
    id: String(event.id),
    title: event.title,
    subtitle: event.modality,
    date: new Date(event.starts_at).toLocaleDateString("es-GT"),
    time: new Date(event.starts_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" }),
    location: event.location,
    modality: event.modality === "virtual" ? "Virtual" : event.modality === "hybrid" ? "Híbrida" : "Presencial",
    organizer: "",
    description: event.description,
    agendaTopics: [],
    status: "programada",
  }));
}
