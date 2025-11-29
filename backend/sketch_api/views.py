from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from django.utils.decorators import method_decorator
import json
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.response import Response
from rest_framework import status
from .services.claudeClient import image_to_html_css
from .services.claudeClientVariations import generate_component_variations
import asyncio

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

    async def one_page(self, i, request):
        file_key = f"file_{i}"
        name_key = f"name_{i}"
        id_key = f"id={i}"

        up_file = request.FILES.get(file_key)
        page_name = request.POST.get(name_key, f"Page {i+1}")
        page_id = request.POST.get(id_key, f"page_{i}")

        if not up_file:
            #Skip missing files
            pass

        if up_file.size > MAX_BYTES:
            return {
                "id" : page_id,
                "html": f"<p>Error: File too large.</p>",
                "error": "File too large."
            }

        ctype = str(getattr(up_file, "content_type", "") or "")
        if not ctype.startswith("image/"):
            return {
                "id" : page_id,
                "html": f"<p>Error: Invalid file type</p>",
                "error": "Invalid file type"
            }

        #Generate HTML for this page
        try:
            image_bytes = up_file.read()
            html = await image_to_html_css(image_bytes, media_type=ctype, prompt = None)
            return {
                "id": page_id,
                "html": html
            }

        except Exception as e:
            return {
                "id": page_id,
                "html": f"<p>Error generating mockup for {page_name}: {str(e)}</p>",
                "error": "Generation failed."
            }

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
        
        futures = []

        #Processing each file
        for i in range(count):
            futures.append(self.one_page(i, request))

        loop = asyncio.new_event_loop()

        asyncio.set_event_loop(loop)

        results = loop.run_until_complete(asyncio.gather(*futures))

        if not results:
            return Response({"detail": "No valid files provided."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"results": results}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class GenerateVariationsView(APIView):
    """API endpoint to generate design variations for a selected component
       POST /api/generate-variations/"""
    
    parser_classes = [JSONParser]  # accept multipart/form-data (file upload)

    def post(self, request):

        try:
            data = request.data if hasattr(request, 'data') else json.loads(request.body)
        except json.JSONDecodeError:
            return Response(
                {"detail": "Invalid JSON body."},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Get parameters from request
        element_html = data.get("element_html")
        element_type = data.get("element_type", "component")
        custom_prompt = data.get("prompt")  # None if not provided
        count_str = data.get("count", 3)

        #Validation
        if not element_html:
            return Response(
                {"detail": "Missing required field 'element_html'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            count = int(count_str)
            if count < 1 or count > 10:
                return Response(
                    {"detail": "Count must be between 1 and 10."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        except ValueError:
            return Response(
                {"detail": "Invalid count value."},
                status=status.HTTP_400_BAD_REQUEST
            )

        #Generate Variations
        try:

            # Run async function
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            variations = loop.run_until_complete(
                generate_component_variations(
                    element_html=element_html,
                    element_type=element_type,
                    custom_prompt=custom_prompt,
                    count=count
                )
            )
            loop.close()
            
            return Response(
                {"variations": variations},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            # Log the error in production
            print(f"Error generating variations: {e}")
            return Response(
                {"detail": f"Failed to generate variations: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
