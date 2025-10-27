from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from django.utils.decorators import method_decorator
import json
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from .services.claudeClient import image_to_html_css

MAX_BYTES = 10 * 1024 * 1024  # 10MB max upload

@csrf_exempt
def api_test(request):
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

@method_decorator(csrf_exempt, name="dispatch")
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
        except Exception as e:
            # In production, log details to your logger/Sentry
            return Response({"detail": "Generation failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name = "dispatch")
class GenerateMultiView(APIView):
    """API endpoint to generate multiple mockup pages from  uploaded sketch images"""
    parser_classes = [MultiPartParser]  # accept multipart/form-data (file upload)

    def post(self, request):
        #Get count of files
        count_str = request.POST.get("count")
        if not count_str:
            return Response({"detail": "Missing 'count' field."}, status=status.HTTP_400_BAD_REQUEST)
        

        try: 
            count = int(count_str)

        except ValueError:
            return Response({"detail": "Invalid count value"}, status=status.HTTP_400_BAD_REQUEST)  

        if count <= 0 or count > 20:
            return Response ({"detail": "Count must be between 1 and 20"}, status=status.HTTP_400_BAD_REQUEST)
        
        results = []

        #Processing each file
        for i in range(count):
            file_key = f"file_{i}"
            name_key = f"name_{i}"
            id_key = f"id={i}"

            up_file = request.FILES.get(file_key)
            page_name = request.POST.get(name_key, f"Page {i+1}")
            page_id = request.POST.get(id_key, f"page_{i}")

            if not up_file:
                #Skip missing files
                continue

            if up_file.size > MAX_BYTES:
                results.append({
                    "id" : page_id,
                    "html": f"<p>Error: File too large.</p>",
                    "error": "File too large."
                })
                continue

            ctype = str(getattr(up_file, "content_type", "") or "")
            if not ctype.startswith("image/"):
                results.append({
                    "id" : page_id,
                    "html": f"<p>Error: Invalid file type</p>",
                    "error": "Invalid file type"
                })
                continue

            #Generate HTML for this page
            try:
                image_bytes = up_file.read()
                html = image_to_html_css(image_bytes, media_type=ctype, prompt = None)
                results.append({
                    "id": page_id,
                    "html": html
                })

            except Exception as e:
                results.append({
                    "id": page_id,
                    "html": f"<p>Error generating mockup for {page_name}: {str(e)}</p>",
                    "error": "Generation failed."
                })
        if not results:
            return Response({"detail": "No valid files provided."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"results": results}, status=status.HTTP_200_OK)
