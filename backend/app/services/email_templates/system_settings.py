from app.services.email_templates.branded import build_branded_action_email


SYSTEM_EMAIL_VERIFICATION_TEMPLATES = {
    "en": {
        "subject": "Verify LeaseMate email settings",
        "title": "Verify {account_label}",
        "intro": "LeaseMate sent this message to confirm this SMTP account can send system email.",
        "extra": "Both no-reply and system SMTP accounts must be verified before LeaseMate can be used.",
        "action": "Verify this SMTP account",
        "fallback": "If the button does not work, copy and open this link:",
        "footer": "This email is for system setup and account security. Do not forward verification links.",
        "plain": (
            "LeaseMate sent this email to confirm the {account_label} works.\n\n"
            "Open this link to verify this SMTP account:\n"
            "{verification_url}\n\n"
            "Both no-reply and system SMTP accounts must be verified before LeaseMate can be used.\n"
            "If you did not request this test, ignore this email."
        ),
    },
    "ja": {
        "subject": "LeaseMate のメール設定を確認してください",
        "title": "{account_label} を確認",
        "intro": "このメールは、この SMTP アカウントからシステムメールを送信できることを確認するために LeaseMate から送信されました。",
        "extra": "LeaseMate を利用するには、no-reply と system の両方の SMTP アカウントを確認する必要があります。",
        "action": "この SMTP アカウントを確認",
        "fallback": "ボタンが動作しない場合は、このリンクをコピーして開いてください:",
        "footer": "このメールはシステム設定とアカウント保護のためのものです。確認リンクを転送しないでください。",
        "plain": (
            "LeaseMate が {account_label} の動作確認メールを送信しました。\n\n"
            "次のリンクからこの SMTP アカウントを確認してください:\n"
            "{verification_url}\n\n"
            "LeaseMate を利用するには、no-reply と system の両方の SMTP アカウントを確認する必要があります。\n"
            "このテストに心当たりがない場合は、このメールを無視してください。"
        ),
    },
    "zh-Hant-TW": {
        "subject": "驗證 LeaseMate 電子郵件設定",
        "title": "驗證 {account_label}",
        "intro": "LeaseMate 寄出這封信，是為了確認此 SMTP 帳戶可以寄送系統郵件。",
        "extra": "no-reply 與 system 兩個 SMTP 帳戶都必須完成驗證，LeaseMate 才能開始使用。",
        "action": "驗證此 SMTP 帳戶",
        "fallback": "如果按鈕無法使用，請複製並開啟此連結:",
        "footer": "此郵件用於系統設定與帳戶安全。請勿轉寄驗證連結。",
        "plain": (
            "LeaseMate 寄出這封信，是為了確認 {account_label} 可以正常使用。\n\n"
            "請開啟以下連結驗證此 SMTP 帳戶:\n"
            "{verification_url}\n\n"
            "no-reply 與 system 兩個 SMTP 帳戶都必須完成驗證，LeaseMate 才能開始使用。\n"
            "如果你沒有要求此測試，可以忽略這封信。"
        ),
    },
    "zh-Hant-HK": {
        "subject": "驗證 LeaseMate 電郵設定",
        "title": "驗證 {account_label}",
        "intro": "LeaseMate 寄出呢封電郵，係為咗確認此 SMTP 帳戶可以寄送系統電郵。",
        "extra": "no-reply 同 system 兩個 SMTP 帳戶都必須完成驗證，LeaseMate 先可以開始使用。",
        "action": "驗證此 SMTP 帳戶",
        "fallback": "如果按鈕無法使用，請複製並開啟此連結:",
        "footer": "此電郵用於系統設定同帳戶安全。請勿轉寄驗證連結。",
        "plain": (
            "LeaseMate 寄出呢封電郵，係為咗確認 {account_label} 可以正常使用。\n\n"
            "請開啟以下連結驗證此 SMTP 帳戶:\n"
            "{verification_url}\n\n"
            "no-reply 同 system 兩個 SMTP 帳戶都必須完成驗證，LeaseMate 先可以開始使用。\n"
            "如果你冇要求此測試，可以忽略呢封電郵。"
        ),
    },
    "th": {
        "subject": "ยืนยันการตั้งค่าอีเมล LeaseMate",
        "title": "ยืนยัน {account_label}",
        "intro": "LeaseMate ส่งอีเมลนี้เพื่อยืนยันว่าบัญชี SMTP นี้สามารถส่งอีเมลระบบได้",
        "extra": "ต้องยืนยันบัญชี SMTP ทั้ง no-reply และ system ก่อนจึงจะใช้งาน LeaseMate ได้",
        "action": "ยืนยันบัญชี SMTP นี้",
        "fallback": "หากปุ่มใช้งานไม่ได้ ให้คัดลอกและเปิดลิงก์นี้:",
        "footer": "อีเมลนี้ใช้สำหรับการตั้งค่าระบบและความปลอดภัยของบัญชี โปรดอย่าส่งต่อลิงก์ยืนยัน",
        "plain": (
            "LeaseMate ส่งอีเมลนี้เพื่อยืนยันว่า {account_label} ใช้งานได้\n\n"
            "เปิดลิงก์นี้เพื่อยืนยันบัญชี SMTP:\n"
            "{verification_url}\n\n"
            "ต้องยืนยันบัญชี SMTP ทั้ง no-reply และ system ก่อนจึงจะใช้งาน LeaseMate ได้\n"
            "หากคุณไม่ได้ขอทดสอบนี้ คุณสามารถละเว้นอีเมลนี้ได้"
        ),
    },
}


def _template_for_locale(locale_code: str | None) -> dict[str, str]:
    return SYSTEM_EMAIL_VERIFICATION_TEMPLATES.get(
        locale_code or "",
        SYSTEM_EMAIL_VERIFICATION_TEMPLATES["en"],
    )


def build_system_email_verification_message(
    *,
    account_label: str,
    verification_url: str,
    locale_code: str | None = None,
) -> tuple[str, str, str]:
    template = _template_for_locale(locale_code)
    title = template["title"].format(account_label=account_label)
    plain_text = template["plain"].format(
        account_label=account_label,
        verification_url=verification_url,
    )
    html = build_branded_action_email(
        title=title,
        intro=template["intro"],
        extra_paragraphs=[template["extra"]],
        action_label=template["action"],
        action_url=verification_url,
        fallback_instruction=template["fallback"],
        footer_note=template["footer"],
    )
    return template["subject"], plain_text, html
