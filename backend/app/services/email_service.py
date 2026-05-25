import os
import smtplib
from email.message import EmailMessage


SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"


def get_smtp_identity(identity: str = "noreply") -> tuple[str | None, str | None, str]:
    if identity == "system":
        return (
            os.getenv("SMTP_SYSTEM_USER"),
            os.getenv("SMTP_SYSTEM_PASSWORD"),
            os.getenv("SMTP_SYSTEM_FROM", "system@leasemate.local"),
        )

    return (
        os.getenv("SMTP_NOREPLY_USER") or os.getenv("SMTP_USER") or os.getenv("SMTP_USERNAME"),
        os.getenv("SMTP_NOREPLY_PASSWORD") or os.getenv("SMTP_PASSWORD"),
        (
            os.getenv("SMTP_NOREPLY_FROM")
            or os.getenv("SMTP_FROM")
            or os.getenv("SMTP_FROM_EMAIL")
            or "no-reply@leasemate.local"
        ),
    )


def email_enabled(identity: str = "noreply") -> bool:
    smtp_user, smtp_password, _smtp_from = get_smtp_identity(identity)
    return bool(SMTP_HOST and smtp_user and smtp_password)


def send_email(
    to_email: str,
    subject: str,
    body: str,
    identity: str = "noreply"
) -> bool:
    smtp_user, smtp_password, smtp_from = get_smtp_identity(identity)

    if not email_enabled(identity):
        return False

    message = EmailMessage()
    message["From"] = smtp_from
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
        if SMTP_USE_TLS:
            smtp.starttls()
        smtp.login(smtp_user, smtp_password)
        smtp.send_message(message)

    return True


def send_email_confirmation(to_email: str, verification_url: str) -> bool:
    return send_email(
        to_email=to_email,
        subject="Verify your LeaseMate admin account",
        body=(
            "Welcome to LeaseMate.\n\n"
            "Please verify your admin account using this link:\n"
            f"{verification_url}\n\n"
            "If you did not create this account, you can ignore this email."
        ),
    )
