"""Django settings for the Mesa API."""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "local-only-insecure-secret")
DEBUG = os.getenv("DJANGO_DEBUG", "true").lower() == "true"
ALLOWED_HOSTS = [host.strip() for host in os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if host.strip()]

if not DEBUG and SECRET_KEY == "local-only-insecure-secret":
    raise RuntimeError("Set DJANGO_SECRET_KEY to a private value when DEBUG is false.")
if not DEBUG and not ALLOWED_HOSTS:
    raise RuntimeError("Set DJANGO_ALLOWED_HOSTS before deploying.")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "drf_spectacular",
    "common.apps.CommonConfig",
    "accounts",
    "directory",
    "projects",
    "meetings",
    "voting",
    "portal",
    "notifications",
    "audit",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DB_ENGINE = os.getenv("DB_ENGINE", "sqlite").lower()
if DB_ENGINE in {"postgres", "postgresql"}:
    if not os.getenv("DB_PASSWORD"):
        raise RuntimeError("Set DB_PASSWORD when using PostgreSQL.")
    db_sslmode = os.getenv("DB_SSLMODE", "prefer" if DEBUG else "require").lower()
    allowed_ssl_modes = {"disable", "allow", "prefer", "require", "verify-ca", "verify-full"}
    if db_sslmode not in allowed_ssl_modes or (not DEBUG and db_sslmode in {"disable", "allow", "prefer"}):
        raise RuntimeError("Use DB_SSLMODE=require, verify-ca o verify-full para PostgreSQL fuera de desarrollo.")
    database_options = {"sslmode": db_sslmode}
    if os.getenv("DB_SSLROOTCERT"):
        database_options["sslrootcert"] = os.environ["DB_SSLROOTCERT"]
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME", "mesa_competitividad"),
            "USER": os.getenv("DB_USER", "mesa_app"),
            "PASSWORD": os.getenv("DB_PASSWORD", ""),
            "HOST": os.getenv("DB_HOST", "127.0.0.1"),
            "PORT": os.getenv("DB_PORT", "5432"),
            "CONN_MAX_AGE": 60,
            "CONN_HEALTH_CHECKS": True,
            "OPTIONS": database_options,
        }
    }
elif DB_ENGINE == "sqlite":
    if not DEBUG:
        raise RuntimeError("Use PostgreSQL when DEBUG is false; SQLite is for local development only.")
    DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}}
else:
    raise RuntimeError("DB_ENGINE must be sqlite or postgres.")

AUTH_USER_MODEL = "accounts.User"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 12}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "es-gt"
TIME_ZONE = "America/Guatemala"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_ROOT = BASE_DIR / "private_uploads"
MEDIA_URL = "/private-media/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",") if origin.strip()]
CORS_URLS_REGEX = r"^/api/.*$"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["accounts.authentication.DatabaseTokenAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {"anon": "120/hour", "user": "2400/hour", "contact": "10/hour", "auth": "10/hour"},
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
    "EXCEPTION_HANDLER": "common.exceptions.api_exception_handler",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Mesa de Competitividad API",
    "DESCRIPTION": "API REST versionada para el sitio público, la administración y la aplicación móvil.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "ENUM_NAME_OVERRIDES": {
        "ProjectStatusEnum": [("draft", "Borrador"), ("active", "En curso"), ("paused", "Pausado"), ("completed", "Completado"), ("archived", "Archivado")],
        "ProjectConfidentialityEnum": [("public", "Público"), ("internal", "Interno"), ("temporary_confidential", "Confidencial temporal")],
        "MeetingModalityEnum": [("in_person", "Presencial"), ("virtual", "Virtual"), ("hybrid", "Híbrida")],
        "MinuteStatusEnum": [("draft", "Borrador"), ("approved", "Aprobada")],
        "AgreementStatusEnum": [("pending", "Pendiente"), ("in_progress", "En seguimiento"), ("completed", "Cumplido"), ("cancelled", "Cancelado")],
        "VotingStatusEnum": [("draft", "Borrador"), ("scheduled", "Programada"), ("open", "Abierta"), ("closed", "Cerrada")],
        "PublicationStatusEnum": [("draft", "Borrador"), ("published", "Publicado"), ("archived", "Archivado")],
        "EventStatusEnum": [("draft", "Borrador"), ("published", "Publicado"), ("cancelled", "Cancelado"), ("completed", "Finalizado")],
        "ContactRequestStatusEnum": [("new", "Nueva"), ("in_progress", "En gestión"), ("closed", "Cerrada")],
    },
}

EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.dummy.EmailBackend")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "no-reply@example.invalid")
CONTACT_NOTIFICATION_EMAIL = os.getenv("CONTACT_NOTIFICATION_EMAIL", "")
EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "true").lower() == "true"
EMAIL_USE_SSL = os.getenv("EMAIL_USE_SSL", "false").lower() == "true"
if EMAIL_USE_SSL and EMAIL_USE_TLS:
    raise RuntimeError("Set only one of EMAIL_USE_SSL or EMAIL_USE_TLS.")
PASSWORD_RESET_URL = os.getenv("PASSWORD_RESET_URL", "http://localhost:5173/reset-password")

EXPO_ACCESS_TOKEN = os.getenv("EXPO_ACCESS_TOKEN", "")
EXPO_PUSH_URL = os.getenv("EXPO_PUSH_URL", "https://exp.host/--/api/v2/push/send")
EXPO_PUSH_ENABLED = os.getenv("EXPO_PUSH_ENABLED", "false").lower() == "true"
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "20"))
DATA_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = DATA_UPLOAD_MAX_MEMORY_SIZE

if not DEBUG:
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = "same-origin"
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "true").lower() == "true"
    SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = False
