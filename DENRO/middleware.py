from django.core.exceptions import PermissionDenied
from django.urls import reverse

class AuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # List of paths that do not require authentication
        exempt_paths = [
            reverse('login'),
            reverse('register'),
            reverse('root'),
            '/static/',
            '/media/',
        ]

        if not request.user.is_authenticated:
            if not any(request.path.startswith(path) for path in exempt_paths):
                raise PermissionDenied("You must be logged in to access this page.")

        response = self.get_response(request)
        return response
