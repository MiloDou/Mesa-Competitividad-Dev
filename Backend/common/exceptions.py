from rest_framework.exceptions import APIException, ValidationError
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response

    details = response.data
    response.data = {
        "error": {
            "code": _error_code(exc, response.status_code),
            "detail": details,
        }
    }
    return response


def _error_code(exc, status_code):
    if isinstance(exc, ValidationError):
        return "validation_error"
    if isinstance(exc, APIException):
        return getattr(exc, "default_code", "api_error")
    return f"http_{status_code}"
