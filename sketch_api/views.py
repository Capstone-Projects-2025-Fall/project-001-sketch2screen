from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

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
