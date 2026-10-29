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
