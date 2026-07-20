from app.services.email_templates.branded import build_branded_action_email


EMAIL_CONFIRMATION_TEMPLATES = {
    "en": {
        "subject": "Verify your LeaseMate email",
        "body": (
            "Welcome to LeaseMate.\n\n"
            "Please verify your email using this link:\n"
            "{verification_url}\n\n"
            "If you did not create this account, you can ignore this email."
        ),
        "title": "Verify your email",
        "intro": "Welcome to LeaseMate. Open the link below to verify your email address.",
        "action": "Verify email",
        "fallback": "If the button does not work, copy and open this link:",
        "footer": "This email is for account verification and security. Do not forward verification links.",
    },
    "ja": {
        "subject": "LeaseMate のメールアドレスを確認してください",
        "body": (
            "LeaseMate へようこそ。\n\n"
            "次のリンクからメールアドレスを確認してください:\n"
            "{verification_url}\n\n"
            "このアカウントを作成していない場合は、このメールを無視してください。"
        ),
        "title": "メールアドレスを確認",
        "intro": "LeaseMate へようこそ。下のリンクからメールアドレスを確認してください。",
        "action": "メールアドレスを確認",
        "fallback": "ボタンが動作しない場合は、このリンクをコピーして開いてください:",
        "footer": "このメールはアカウント確認とセキュリティのためのものです。確認リンクを転送しないでください。",
    },
    "zh-Hant-TW": {
        "subject": "請驗證你的 LeaseMate 電子郵件",
        "body": (
            "歡迎使用 LeaseMate。\n\n"
            "請使用以下連結驗證你的電子郵件:\n"
            "{verification_url}\n\n"
            "如果你沒有建立此帳戶，可以忽略這封信。"
        ),
        "title": "驗證你的電子郵件",
        "intro": "歡迎使用 LeaseMate。請開啟下方連結完成電子郵件驗證。",
        "action": "驗證電子郵件",
        "fallback": "如果按鈕無法使用，請複製並開啟此連結:",
        "footer": "此郵件用於帳戶驗證與安全。請勿轉寄驗證連結。",
    },
    "zh-Hant-HK": {
        "subject": "請驗證你嘅 LeaseMate 電郵",
        "body": (
            "歡迎使用 LeaseMate。\n\n"
            "請用以下連結驗證你嘅電郵:\n"
            "{verification_url}\n\n"
            "如果你冇建立呢個帳戶，可以忽略呢封電郵。"
        ),
        "title": "驗證你嘅電郵",
        "intro": "歡迎使用 LeaseMate。請開啟下方連結完成電郵驗證。",
        "action": "驗證電郵",
        "fallback": "如果按鈕無法使用，請複製並開啟此連結:",
        "footer": "此電郵用於帳戶驗證同安全。請勿轉寄驗證連結。",
    },
    "th": {
        "subject": "ยืนยันอีเมล LeaseMate ของคุณ",
        "body": (
            "ยินดีต้อนรับสู่ LeaseMate\n\n"
            "โปรดยืนยันอีเมลของคุณด้วยลิงก์นี้:\n"
            "{verification_url}\n\n"
            "ถ้าคุณไม่ได้สร้างบัญชีนี้ คุณสามารถละเว้นอีเมลนี้ได้"
        ),
        "title": "ยืนยันอีเมลของคุณ",
        "intro": "ยินดีต้อนรับสู่ LeaseMate เปิดลิงก์ด้านล่างเพื่อยืนยันอีเมลของคุณ",
        "action": "ยืนยันอีเมล",
        "fallback": "หากปุ่มใช้งานไม่ได้ ให้คัดลอกและเปิดลิงก์นี้:",
        "footer": "อีเมลนี้ใช้สำหรับการยืนยันบัญชีและความปลอดภัย โปรดอย่าส่งต่อลิงก์ยืนยัน",
    },
}


USER_INVITATION_TEMPLATES = {
    "en": {
        "subject": "Your LeaseMate account is ready",
        "body": (
            "Welcome to LeaseMate.\n\n"
            "Please verify your email using this link:\n"
            "{verification_url}\n\n"
            "This link will sign you in. LeaseMate will ask you to set your own password."
        ),
        "title": "Your LeaseMate account is ready",
        "intro": "An administrator created a LeaseMate account for you. Open the link below to verify your email and sign in.",
        "action": "Verify email and sign in",
        "fallback": "If the button does not work, copy and open this link:",
        "footer": "This email is for account verification and security. Do not forward verification links.",
    },
    "ja": {
        "subject": "LeaseMate アカウントの準備ができました",
        "body": (
            "LeaseMate へようこそ。\n\n"
            "次のリンクからメールアドレスを確認してください:\n"
            "{verification_url}\n\n"
            "このリンクからログインできます。LeaseMate でご自身のパスワードを設定してください。"
        ),
        "title": "LeaseMate アカウントの準備ができました",
        "intro": "管理者があなたの LeaseMate アカウントを作成しました。下のリンクからメールアドレスを確認してログインしてください。",
        "action": "確認してログイン",
        "fallback": "ボタンが動作しない場合は、このリンクをコピーして開いてください:",
        "footer": "このメールはアカウント確認とセキュリティのためのものです。確認リンクを転送しないでください。",
    },
    "zh-Hant-TW": {
        "subject": "你的 LeaseMate 帳戶已建立",
        "body": (
            "歡迎使用 LeaseMate。\n\n"
            "請使用以下連結驗證你的電子郵件:\n"
            "{verification_url}\n\n"
            "此連結會讓你登入。LeaseMate 會要求你設定自己的密碼。"
        ),
        "title": "你的 LeaseMate 帳戶已建立",
        "intro": "管理員已為你建立 LeaseMate 帳戶。請開啟下方連結驗證電子郵件並登入。",
        "action": "驗證並登入",
        "fallback": "如果按鈕無法使用，請複製並開啟此連結:",
        "footer": "此郵件用於帳戶驗證與安全。請勿轉寄驗證連結。",
    },
    "zh-Hant-HK": {
        "subject": "你嘅 LeaseMate 帳戶已建立",
        "body": (
            "歡迎使用 LeaseMate。\n\n"
            "請用以下連結驗證你嘅電郵:\n"
            "{verification_url}\n\n"
            "呢個連結會幫你登入。LeaseMate 會要求你設定自己嘅密碼。"
        ),
        "title": "你嘅 LeaseMate 帳戶已建立",
        "intro": "管理員已為你建立 LeaseMate 帳戶。請開啟下方連結驗證電郵並登入。",
        "action": "驗證並登入",
        "fallback": "如果按鈕無法使用，請複製並開啟此連結:",
        "footer": "此電郵用於帳戶驗證同安全。請勿轉寄驗證連結。",
    },
    "th": {
        "subject": "บัญชี LeaseMate ของคุณพร้อมแล้ว",
        "body": (
            "ยินดีต้อนรับสู่ LeaseMate\n\n"
            "โปรดยืนยันอีเมลของคุณด้วยลิงก์นี้:\n"
            "{verification_url}\n\n"
            "ลิงก์นี้จะเข้าสู่ระบบให้คุณ และ LeaseMate จะขอให้คุณตั้งรหัสผ่านของคุณเอง"
        ),
        "title": "บัญชี LeaseMate ของคุณพร้อมแล้ว",
        "intro": "ผู้ดูแลสร้างบัญชี LeaseMate ให้คุณแล้ว เปิดลิงก์ด้านล่างเพื่อยืนยันอีเมลและเข้าสู่ระบบ",
        "action": "ยืนยันอีเมลและเข้าสู่ระบบ",
        "fallback": "หากปุ่มใช้งานไม่ได้ ให้คัดลอกและเปิดลิงก์นี้:",
        "footer": "อีเมลนี้ใช้สำหรับการยืนยันบัญชีและความปลอดภัย โปรดอย่าส่งต่อลิงก์ยืนยัน",
    },
}


PASSWORD_RESET_TEMPLATES = {
    "en": {
        "subject": "Reset your LeaseMate password",
        "body": (
            "We received a request to reset your LeaseMate password.\n\n"
            "Use this link to set a new password:\n"
            "{reset_url}\n\n"
            "If you did not request this, you can ignore this email."
        ),
    },
    "ja": {
        "subject": "LeaseMate のパスワードを再設定してください",
        "body": (
            "LeaseMate のパスワード再設定リクエストを受け付けました。\n\n"
            "次のリンクから新しいパスワードを設定してください:\n"
            "{reset_url}\n\n"
            "このリクエストに心当たりがない場合は、このメールを無視してください。"
        ),
    },
    "zh-Hant-TW": {
        "subject": "重設你的 LeaseMate 密碼",
        "body": (
            "我們收到重設 LeaseMate 密碼的要求。\n\n"
            "請使用以下連結設定新密碼:\n"
            "{reset_url}\n\n"
            "如果這不是你提出的要求，可以忽略這封信。"
        ),
    },
    "zh-Hant-HK": {
        "subject": "重設你嘅 LeaseMate 密碼",
        "body": (
            "我哋收到重設 LeaseMate 密碼嘅要求。\n\n"
            "請用以下連結設定新密碼:\n"
            "{reset_url}\n\n"
            "如果唔係你提出嘅要求，可以忽略呢封電郵。"
        ),
    },
    "th": {
        "subject": "รีเซ็ตรหัสผ่าน LeaseMate ของคุณ",
        "body": (
            "เราได้รับคำขอรีเซ็ตรหัสผ่าน LeaseMate ของคุณ\n\n"
            "ใช้ลิงก์นี้เพื่อตั้งรหัสผ่านใหม่:\n"
            "{reset_url}\n\n"
            "หากคุณไม่ได้ส่งคำขอนี้ คุณสามารถละเว้นอีเมลนี้ได้"
        ),
    },
}


def get_email_confirmation_template(locale_code: str | None) -> dict[str, str]:
    return EMAIL_CONFIRMATION_TEMPLATES.get(
        locale_code or "",
        EMAIL_CONFIRMATION_TEMPLATES["en"],
    )


def build_email_confirmation_message(
    *,
    verification_url: str,
    locale_code: str | None = None,
) -> tuple[str, str, str]:
    template = get_email_confirmation_template(locale_code)
    plain_text = template["body"].format(verification_url=verification_url)
    html = build_branded_action_email(
        title=template["title"],
        intro=template["intro"],
        action_label=template["action"],
        action_url=verification_url,
        fallback_instruction=template["fallback"],
        footer_note=template["footer"],
    )
    return template["subject"], plain_text, html


def get_user_invitation_template(locale_code: str | None) -> dict[str, str]:
    return USER_INVITATION_TEMPLATES.get(
        locale_code or "",
        USER_INVITATION_TEMPLATES["en"],
    )


def build_user_invitation_message(
    *,
    verification_url: str,
    locale_code: str | None = None,
) -> tuple[str, str, str]:
    template = get_user_invitation_template(locale_code)
    plain_text = template["body"].format(verification_url=verification_url)
    html = build_branded_action_email(
        title=template["title"],
        intro=template["intro"],
        action_label=template["action"],
        action_url=verification_url,
        fallback_instruction=template["fallback"],
        footer_note=template["footer"],
    )
    return template["subject"], plain_text, html
