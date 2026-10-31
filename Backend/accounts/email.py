from email.mime.image import MIMEImage
from pathlib import Path

import requests
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string


BREVO_EMAIL_API_URL = "https://api.brevo.com/v3/smtp/email"
PASSWORD_RESET_LOGO_CID = "mesa-competitividad-logo"
PASSWORD_RESET_LOGO_PATH = Path(__file__).resolve().parent / "assets" / "password-reset-logo.jpg"
PASSWORD_RESET_SUBJECT = "Recupera tu contraseña | Mesa de Competitividad"


def send_password_reset_email(user, reset_url: str) -> None:
    display_name = user.first_name.strip() or user.display_name
    text_body = render_to_string("accounts/email/password_reset.txt", {
        "display_name": display_name,
        "reset_url": reset_url,
    })

    if getattr(settings, "BREVO_API_KEY", ""):
        html_body = render_to_string("accounts/email/password_reset.html", {
            "display_name": display_name,
            "reset_url": reset_url,
            "logo_cid": "",
        })
        response = requests.post(
            BREVO_EMAIL_API_URL,
            headers={
                "accept": "application/json",
                "api-key": settings.BREVO_API_KEY,
                "content-type": "application/json",
            },
            json={
                "sender": {
                    "email": settings.DEFAULT_FROM_EMAIL,
                    "name": "Mesa Departamental de Competitividad de Quetzaltenango",
                },
                "to": [{"email": user.email, "name": display_name}],
                "subject": PASSWORD_RESET_SUBJECT,
                "textContent": text_body,
                "htmlContent": html_body,
            },
            timeout=10,
        )
        response.raise_for_status()
        return

    context = {
        "display_name": display_name,
        "reset_url": reset_url,
        "logo_cid": PASSWORD_RESET_LOGO_CID,
    }
    html_body = render_to_string("accounts/email/password_reset.html", context)
    message = EmailMultiAlternatives(
        subject=PASSWORD_RESET_SUBJECT,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    message.attach_alternative(html_body, "text/html")

    with PASSWORD_RESET_LOGO_PATH.open("rb") as logo_file:
        logo = MIMEImage(logo_file.read(), _subtype="jpeg")
    logo.add_header("Content-ID", f"<{PASSWORD_RESET_LOGO_CID}>")
    logo.add_header("Content-Disposition", "inline", filename="mesa-competitividad.jpg")
    message.attach(logo)
    message.send(fail_silently=False)
from email.mime.image import MIMEImage
from pathlib import Path

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string


PASSWORD_RESET_LOGO_CID = "mesa-competitividad-logo"
PASSWORD_RESET_LOGO_PATH = Path(__file__).resolve().parent / "assets" / "password-reset-logo.jpg"


def send_password_reset_email(user, reset_url: str) -> None:
    context = {
        "display_name": user.first_name.strip() or user.display_name,
        "reset_url": reset_url,
        "logo_cid": PASSWORD_RESET_LOGO_CID,
    }
    text_body = render_to_string("accounts/email/password_reset.txt", context)
    html_body = render_to_string("accounts/email/password_reset.html", context)
    message = EmailMultiAlternatives(
        subject="Recupera tu contraseña | Mesa de Competitividad",
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    message.attach_alternative(html_body, "text/html")

    with PASSWORD_RESET_LOGO_PATH.open("rb") as logo_file:
        logo = MIMEImage(logo_file.read(), _subtype="jpeg")
    logo.add_header("Content-ID", f"<{PASSWORD_RESET_LOGO_CID}>")
    logo.add_header("Content-Disposition", "inline", filename="mesa-competitividad.jpg")
    message.attach(logo)
    message.send(fail_silently=False)
