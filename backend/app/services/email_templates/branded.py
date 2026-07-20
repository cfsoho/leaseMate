from datetime import datetime
from html import escape


def build_branded_action_email(
    *,
    title: str,
    intro: str,
    action_label: str,
    action_url: str,
    footer_note: str,
    fallback_instruction: str,
    extra_paragraphs: list[str] | None = None,
) -> str:
    escaped_title = escape(title)
    escaped_intro = escape(intro)
    escaped_action_label = escape(action_label)
    escaped_action_url = escape(action_url)
    escaped_footer_note = escape(footer_note)
    escaped_fallback_instruction = escape(fallback_instruction)
    escaped_extra_paragraphs = [
        f"<p>{escape(paragraph)}</p>" for paragraph in (extra_paragraphs or [])
    ]
    year = datetime.now().year

    html = f"""\
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body {{
        margin: 0;
        background: #f8fafc;
        color: #0f172a;
        font-family: Arial, Helvetica, sans-serif;
      }}
      .wrap {{
        max-width: 560px;
        margin: 0 auto;
        padding: 32px 18px;
      }}
      .card {{
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 28px;
      }}
      .brand {{
        display: flex;
        align-items: center;
        margin-bottom: 28px;
      }}
      .brand-mark {{
        display: inline-block;
        width: 44px;
        height: 44px;
        line-height: 44px;
        border-radius: 10px;
        background: #020617;
        color: #ffffff;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 0;
        text-align: center;
        vertical-align: middle;
      }}
      .brand-name {{
        margin-left: 15px;
        padding-top: 3px;
        font-size: 25px;
        font-weight: 700;
      }}
      h1 {{
        margin: 0 0 12px;
        font-size: 24px;
        line-height: 1.25;
      }}
      p {{
        margin: 0 0 16px;
        color: #475569;
        font-size: 14px;
        line-height: 1.6;
      }}
      .button {{
        display: inline-block;
        margin: 10px 0 18px;
        padding: 12px 18px;
        border-radius: 8px;
        background: #020617;
        color: #ffffff !important;
        font-size: 14px;
        font-weight: 700;
        text-decoration: none;
      }}
      .url {{
        word-break: break-all;
        color: #334155;
        font-size: 12px;
      }}
      .footer {{
        margin-top: 18px;
        color: #64748b;
        font-size: 12px;
        line-height: 1.5;
      }}
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="brand">
          <div class="brand-mark">LM</div>
          <div class="brand-name">LeaseMate</div>
        </div>
        <h1>{escaped_title}</h1>
        <p>{escaped_intro}</p>
        {"".join(escaped_extra_paragraphs)}
        <a class="button" href="{escaped_action_url}">{escaped_action_label}</a>
        <p>{escaped_fallback_instruction}</p>
        <p class="url">{escaped_action_url}</p>
      </div>
      <div class="footer">
        &copy; LeaseMate {year}. {escaped_footer_note}
      </div>
    </div>
  </body>
</html>
"""
    return html
