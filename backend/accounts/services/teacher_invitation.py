import secrets
import string
from django.conf import settings
from .email_service import send_email


def _generate_password(length=12) -> str:
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def send_teacher_invitation(teacher, password, frontend_url=None):
    base_url = (frontend_url or settings.FRONTEND_URL).rstrip('/')
    login_url = f'{base_url}/login'

    html_body = f"""
<p>Dear {teacher.name},</p>
<p>Your ResultHub teacher account has been created.</p>
<p><a href="{login_url}" style="display:inline-block;padding:12px 24px;background:#1a73e8;color:#fff;text-decoration:none;border-radius:6px;">Log In Now</a></p>
<p><b>Email:</b> {teacher.email}<br/>
<b>Password:</b> {password}</p>
<p>Please change your password after logging in.</p>
<p>Regards,<br/>ResultHub</p>
"""

    return send_email(
        to=teacher.email,
        subject='Welcome to ResultHub — Teacher Login',
        html_body=html_body,
    )


def resend_teacher_invitation(teacher, frontend_url=None):
    password = _generate_password()
    teacher.set_password(password)
    teacher.save(update_fields=['password'])
    return send_teacher_invitation(teacher, password, frontend_url)
