from django.core.files.storage import Storage
from rest_framework.exceptions import APIException


class FileStorageUnavailable(APIException):
    status_code = 503
    default_detail = "El almacenamiento duradero de archivos no está configurado."
    default_code = "file_storage_unavailable"


class UnavailableStorage(Storage):
    """Fail closed when a serverless deployment has no durable file store."""

    def _unavailable(self):
        raise FileStorageUnavailable()

    def _open(self, name, mode="rb"):
        self._unavailable()

    def _save(self, name, content):
        self._unavailable()

    def delete(self, name):
        self._unavailable()

    def exists(self, name):
        self._unavailable()

    def listdir(self, path):
        self._unavailable()

    def size(self, name):
        self._unavailable()

    def url(self, name):
        self._unavailable()

    def path(self, name):
        self._unavailable()
