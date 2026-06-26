"""
Custom exception handler that adds error_type to 401 responses.
This allows the frontend to differentiate between token expiry and auth failures.
"""

from rest_framework.views import exception_handler
from rest_framework.exceptions import (
    AuthenticationFailed,
    PermissionDenied,
    NotAuthenticated,
)
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


def custom_exception_handler(exc, context):
    """
    Custom exception handler that adds error_type to authentication errors.

    Error types:
    - token_expired: JWT token has expired
    - invalid_token: JWT token is invalid/malformed
    - invalid_credentials: Wrong username/password
    - permission_denied: User lacks required permissions
    - not_authenticated: No authentication provided
    - authentication_failed: Generic authentication failure
    """

    response = exception_handler(exc, context)

    if response is None:
        return response

    error_str = str(exc).lower()

    if isinstance(exc, InvalidToken):
        response.data['error_type'] = 'invalid_token'
        if 'expired' in error_str:
            response.data['error_type'] = 'token_expired'

    elif isinstance(exc, TokenError):
        response.data['error_type'] = 'token_error'
        if 'expired' in error_str:
            response.data['error_type'] = 'token_expired'

    elif isinstance(exc, NotAuthenticated):
        response.data['error_type'] = 'not_authenticated'

    elif isinstance(exc, AuthenticationFailed):
        response.data['error_type'] = 'invalid_credentials'
        if 'token' in error_str or 'expired' in error_str:
            response.data['error_type'] = 'token_expired'
        elif 'invalid' in error_str and 'token' in error_str:
            response.data['error_type'] = 'invalid_token'

    elif isinstance(exc, PermissionDenied):
        response.data['error_type'] = 'permission_denied'

    if response.status_code == 401 and 'error_type' not in response.data:
        if 'expired' in error_str:
            response.data['error_type'] = 'token_expired'
        elif 'invalid' in error_str:
            response.data['error_type'] = 'invalid_token'
        else:
            response.data['error_type'] = 'authentication_failed'

    return response
