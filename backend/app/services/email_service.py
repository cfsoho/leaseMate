import smtplib
import logging
from email.message import EmailMessage

from sqlalchemy.orm import Session

from app.services.email_templates.email_confirmation import (
    PASSWORD_RESET_TEMPLATES,
    build_email_confirmation_message,
    build_user_invitation_message,
)
from app.services.system_settings_service import get_smtp_config


logger = logging.getLogger(__name__)


def email_enabled(identity: str = "noreply", db: Session | None = None) -> bool:
    config = get_smtp_config(db, identity)
    return bool(config.host and config.user and config.password and config.from_address)


def send_email(
    to_email: str,
    subject: str,
    body: str,
    html_body: str | None = None,
    identity: str = "noreply",
    db: Session | None = None,
) -> bool:
    config = get_smtp_config(db, identity)

    if not (config.host and config.user and config.password and config.from_address):
        return False

    message = EmailMessage()
    message["From"] = config.from_address
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)
    if html_body:
        message.add_alternative(html_body, subtype="html")

    try:
        with smtplib.SMTP(config.host, config.port) as smtp:
            if config.use_tls:
                smtp.starttls()
            smtp.login(config.user, config.password.replace(" ", ""))
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException):
        logger.exception("SMTP email delivery failed")
        return False

    return True


def send_email_confirmation(
    to_email: str,
    verification_url: str,
    locale_code: str | None = None,
    db: Session | None = None,
) -> bool:
    subject, body, html_body = build_email_confirmation_message(
        verification_url=verification_url,
        locale_code=locale_code,
    )

    return send_email(
        to_email=to_email,
        subject=subject,
        body=body,
        html_body=html_body,
        db=db,
    )


def send_user_invitation(
    to_email: str,
    verification_url: str,
    locale_code: str | None = None,
    db: Session | None = None,
) -> bool:
    subject, body, html_body = build_user_invitation_message(
        verification_url=verification_url,
        locale_code=locale_code,
    )

    return send_email(
        to_email=to_email,
        subject=subject,
        body=body,
        html_body=html_body,
        identity="system",
        db=db,
    )


def send_password_reset(
    to_email: str,
    reset_url: str,
    locale_code: str | None = None,
    db: Session | None = None,
) -> bool:
    message = PASSWORD_RESET_TEMPLATES.get(
        locale_code or "",
        PASSWORD_RESET_TEMPLATES["en"],
    )

    return send_email(
        to_email=to_email,
        subject=message["subject"],
        body=message["body"].format(reset_url=reset_url),
        identity="system",
        db=db,
    )
