class ErrorTypeMiddleware:
    """
    Catches all 401/403 responses (including manual Response() returns)
    and ensures they have an error_type field.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if response.status_code in (401, 403) and hasattr(response, 'data'):
            if 'error_type' not in response.data:
                if response.status_code == 401:
                    response.data['error_type'] = 'authentication_failed'
                else:
                    response.data['error_type'] = 'permission_denied'

        return response
