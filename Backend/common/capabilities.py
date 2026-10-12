CAPABILITIES = {
    "users.manage": "Administrar usuarios y asignación de roles",
    "directory.read": "Consultar el directorio interno",
    "directory.write": "Administrar instituciones y miembros",
    "projects.read": "Consultar proyectos internos",
    "projects.write": "Crear y editar proyectos y seguimiento",
    "projects.publish": "Autorizar la visibilidad pública de proyectos",
    "confidentiality.read": "Consultar iniciativas y documentos temporalmente confidenciales",
    "documents.read": "Descargar documentos autorizados",
    "documents.write": "Subir y gestionar documentos",
    "meetings.read": "Consultar reuniones, minutas y acuerdos internos",
    "meetings.write": "Administrar reuniones, asistencia, minutas y acuerdos",
    "minutes.approve": "Aprobar minutas",
    "voting.read": "Consultar procesos de votación internos",
    "voting.manage": "Crear y configurar votaciones",
    "voting.open_close": "Abrir y cerrar votaciones",
    "vote.cast": "Emitir un voto como miembro habilitado",
    "content.write": "Crear y editar contenido institucional",
    "content.read": "Consultar borradores y contenido institucional interno",
    "content.publish": "Publicar o archivar contenido institucional",
    "events.read": "Consultar eventos e inscripciones",
    "events.registrations": "Consultar datos personales de inscripciones",
    "events.write": "Administrar eventos e inscripciones",
    "events.publish": "Publicar eventos",
    "contact.manage": "Gestionar solicitudes de contacto",
    "notifications.read": "Consultar avisos de la cuenta",
    "audit.read": "Consultar la bitácora de auditoría",
}

ROLE_CAPABILITIES = {
    "commission": set(CAPABILITIES),
    "editor": {
        "directory.read", "projects.read", "projects.write", "documents.read", "documents.write", "meetings.read", "meetings.write",
        "voting.read", "voting.manage", "content.read", "content.write", "events.read", "events.write",
        "notifications.read",
    },
    "reader": {
        "directory.read", "projects.read", "documents.read", "meetings.read", "voting.read", "content.read", "events.read", "notifications.read",
    },
    "member": {
        "projects.read", "documents.read", "meetings.read", "voting.read", "vote.cast", "notifications.read",
    },
}

ROLE_NAMES = {"commission": "Comisión", "editor": "Editor", "reader": "Lector", "member": "Miembro"}
