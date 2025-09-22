from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
import json
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from .services.claudeClient import image_to_html_css

MAX_BYTES = 10 * 1024 * 1024  # 10MB max upload

@csrf_exempt
def test_api(request):
    """Simple test endpoint to verify frontend-backend connection"""
    return JsonResponse({
        'status': 'success',
        'message': 'Backend is connected!',
        'method': request.method
    })

@csrf_exempt  
def generate_mockup(request):
    """Placeholder for sketch-to-mockup generation"""
    if request.method == 'POST':
        return JsonResponse({
            'status': 'success',
            'message': 'Generate button clicked - AI processing would happen here',
            'mockup_id': 'mock_123'
        })
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def frontend(request):
    return render(request, 'frontend/src/index.html')

class GenerateView(APIView):
    parser_classes = [MultiPartParser]  # accept multipart/form-data (file upload)

    def post(self, request):
        # File field must be named "file" (matches your FormData)
        up = request.FILES.get("file")
        if not up:
            return Response({"detail": "Missing file field 'file'."}, status=status.HTTP_400_BAD_REQUEST)

        if up.size > MAX_BYTES:
            return Response({"detail": "File too large."}, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

        ctype = str(getattr(up, "content_type", "") or "")
        if not ctype.startswith("image/"):
            return Response({"detail": "Only images are supported."}, status=status.HTTP_400_BAD_REQUEST)

        # Optional free-text prompt (if you add it on the frontend later)
        prompt = request.POST.get("prompt") or None

        try:
            image_bytes = up.read()                  # raw PNG bytes from the upload
            html = image_to_html_css(image_bytes, media_type=ctype, prompt=prompt)
            return Response({"html": html}, status=status.HTTP_200_OK)
        except Exception:
            # In production, log details to your logger/Sentry
            return Response({"detail": "Generation failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)