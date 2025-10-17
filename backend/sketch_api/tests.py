import pytest
from django.test import RequestFactory
from channels.testing import WebsocketCommunicator

from django.http import JsonResponse, HttpResponse
import json
from django.shortcuts import render
from channels.routing import URLRouter

from .views import api_test, generate_mockup, frontend, GenerateView
from .consumers import SketchConsumer
from .urls import urlpatterns

from rest_framework.test import APIRequestFactory
from django.core.files.uploadedfile import SimpleUploadedFile
# Create your tests here.

class TestTestApi:
    """Tests for the test_api view"""

    @pytest.fixture
    def factory(self):
        """Provides a RequestFactory instance."""
        return RequestFactory()

    def test_api_returns_success_status(self, factory):
        """Test that test_api returns a success status."""
        request = factory.get('/api/test/')
        response = api_test(request)

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['status'] == 'success'

    def test_api_returns_correct_message(self, factory):
        """Test that test_api returns the correct message."""
        request = factory.get('/api/test/')
        response = api_test(request)

        data = json.loads(response.content)
        assert data['message'] == 'Backend is connected!'

    def test_api_returns_request_method_get(self, factory):
        """Test that test_api returns the correct request method for GET."""
        request = factory.get('/api/test/')
        response = api_test(request)

        data = json.loads(response.content)
        assert data['method'] == 'GET'
    
    def test_api_returns_request_method_post(self, factory):
        """Test that test_api returns the correct request method for POST."""
        request = factory.post('/api/test/')
        response = api_test(request)

        data = json.loads(response.content)
        assert data['method'] == 'POST'
    
    def test_api_response_is_json(self, factory):
        """Test that test_api response is valid JSON."""
        request = factory.get('/api/test/')
        response = api_test(request)

        assert isinstance(response, JsonResponse)
        assert response['Content-Type'] == 'application/json'
    
class TestGenerateMockup:
    """Tests for the generate_mockup view function"""
    # This function creates a setup and the tears it down after the test is done.
    @pytest.fixture
    def factory(self):
        """Provides a RequestFactory instance."""
        return RequestFactory()
    
    def test_generate_mockup_post_returns_success(self, factory):
        """Test that generate_mockup returns success on POST."""
        request = factory.post('/api/generate-mockup/')
        response = generate_mockup(request)

        data = json.loads(response.content)
        assert 'AI processing would happen here' in data['message']
    
    def test_generate_mockup_post_returns_mockup_id(self, factory):

        request = factory.post('/api/generate-mockup/')
        response = generate_mockup(request)

        data = json.loads(response.content)
        assert data['mockup_id'] == 'mock_123'

    def test_generate_mockup_get_returns_error(self, factory):
        request = factory.get('/api/generate-mockup/')
        response = generate_mockup(request)

        assert response.status_code == 405
    
    def test_generate_mockup_put_returns_error(self, factory):
        """Test that PUT method returns 405 error."""
        request = factory.put('/api/generate-mockup/')
        response = generate_mockup(request)

        assert response.status_code == 405

class TestFrontend:
    """Tests for the frontend view function."""
    @pytest.fixture
    def factory(self):
        return RequestFactory()
    
    def test_frontend_renders_template(self, factory, mocker):
        #Mock the render function to verify it's called correctly
        mock_render = mocker.patch('backend.sketch_api.views.render')
        mock_render.return_value = HttpResponse("<html>Test</html>")

        request = factory.get('/')
        frontend(request)

        mock_render.assert_called_once_with(request, 'frontend/src/index.html')
    
    def test_frontend_returns_render_response(self, factory, mocker):
        #Test that frontend view returns the result from render
        expected_response = HttpResponse("test content")
        mock_render = mocker.patch('backend.sketch_api.views.render', return_value = expected_response)

        request = factory.get('/')
        response = frontend(request)
        
        assert response == expected_response

    def test_frontend_accepts_get_requests(self, factory, mocker):
        #Test that frontend view accepts GET requests
        mock_render = mocker.patch('backend.sketch_api.views.render')
        request = factory.get('/')

        frontend(request)
        assert mock_render.called
    
class TestGenerateView:
    """Tests for the GenerateView APIView class"""
    @pytest.fixture
    def factory(self):
        return APIRequestFactory()
    
    @pytest.fixture
    def mock_image_file(self):
        """Fixture to provide a mock image file for testing"""
        return SimpleUploadedFile(
            "test_image.png",
            b"fake image content",
            content_type="image/png"
        )
    
    @pytest.fixture
    def large_image_file(self):
        """Fixture to provide a large mock image file for testing"""
        large_file = b"x" * (11 * 1024 *1024)
        return SimpleUploadedFile(
            "large_image.png",
            large_file,
            content_type="image/png"
        )

    @pytest.fixture
    def non_image_file(self):
        """Fixture to provide a non-image file for testing"""
        return SimpleUploadedFile(
            "test.txt",
            b"just some text content",
            content_type="application/pdf"
        )
    
    def test_generate_view_missing_file(self, factory):
        """Test taht missing file field returns 400 error"""
        request = factory.post('/api/generate/')
        view = GenerateView.as_view()
        response = view(request)

        assert response.status_code == 400
        assert "Missing file field" in response.data['detail']

    def test_generate_view_file_too_large(self, factory, large_image_file):
        # Test that uploading a file larger than 10MB returns 413 error
        request = factory.post('/api/generate/', {'file': large_image_file}, format = 'multipart')
        view = GenerateView.as_view()
        response = view(request)
        
        assert response.status_code == 413
        assert "File too large" in response.data['detail']
        
    def test_generate_view_non_image_file(self, factory, non_image_file):
        # Non image files would return 400 error
        request = factory.post('/api/generate/', {'file': non_image_file}, format = 'multipart')
        view = GenerateView.as_view()
        response = view(request)

        assert response.status_code == 400
        assert "Only images are supported" in response.data['detail']
    
    def test_generate_view_successful_generation(self, factory, mock_image_file, mocker):
        #Test successful image processing and HTML generation
        mock_html = "<html><body>Generated HTML</body></html>"
        # Import views module first, then patch the function on it
        from backend.sketch_api import views
        mock_convertor = mocker.patch.object(views, 'image_to_html_css', return_value=mock_html)

        request = factory.post('/api/generate/', {'file': mock_image_file}, format='multipart')
        view = GenerateView.as_view()
        response = view(request)

        assert response.status_code == 200
        assert response.data['html'] == mock_html
        mock_convertor.assert_called_once()

    def test_generate_view_with_prompt(self, factory, mock_image_file, mocker):
        """Test that optional prompt parameter is passed correctly"""
        
        mock_converter = mocker.patch('backend.sketch_api.views.image_to_html_css', return_value="<html></html>")
        
        request = factory.post(
            '/api/generate/',
            {'file': mock_image_file, 'prompt': 'Make it modern'},
            format='multipart'
        )
        view = GenerateView.as_view()
        response = view(request)
        
        # Verify prompt was passed to the converter
        call_args = mock_converter.call_args
        assert call_args[1]['prompt'] == 'Make it modern'


    def test_generate_view_handles_conversion_exception(self, factory, mock_image_file, mocker):
        # Test to ensure exceptions during conversion return 500 error
        mock_convertor = mocker.patch('sketch_api.views.image_to_html_css', side_effect=Exception("Conversion failed"))
        request = factory.post('/api/generate/', {'file': mock_image_file}, format='multipart')
        view = GenerateView.as_view()
        response = view(request)

        assert response.status_code == 500
        assert "Generation failed" in response.data['detail']
    
    def test_generate_view_accepts_different_image_types(self, factory, mocker):
        """Test that different image content types are accepted"""
        
        mock_convertor = mocker.patch('backend.sketch_api.views.image_to_html_css', return_value="<html></html>")

        #Test with JPEG
        jpeg_file = SimpleUploadedFile(
            "test.jpg",
            b"fake jpeg",
            content_type="image/jpeg"
        )
        request = factory.post('/api/generate/', {'file': jpeg_file}, format='multipart')
        view = GenerateView.as_view()
        response = view(request)

        assert response.status_code == 200

@pytest.mark.asyncio
class TestCollaboration:
    @pytest.fixture
    def ws_application(self):
        return URLRouter(urlpatterns)

    @pytest.fixture
    def basic_connection(self, ws_application):
        return WebsocketCommunicator(ws_application, "/ws/collab/123/")

    async def test_connects(self, basic_connection):
        connected, _ = await basic_connection.connect()
        assert connected

    async def test_echo_response_scene_update(self, basic_connection):
        await basic_connection.connect()

        await basic_connection.send_to(text_data=json.dumps({
            "action": "scene_update",
            "sketchID": 123,
            "sketchData": "sample data"
        }))

        response = json.loads(await basic_connection.receive_from())

        assert response["action"] == "scene_update"
        assert response["sketchID"] == 123
        assert response["sketchData"] == "sample data"

    async def test_echo_response_page_update(self, basic_connection):
        await basic_connection.connect()

        await basic_connection.send_to(text_data=json.dumps({
            "action": "page_update",
            "sketchID": 123,
            "pageName": "sample page name"
        }))

        response = json.loads(await basic_connection.receive_from())

        assert response["action"] == "page_update"
        assert response["sketchID"] == 123
        assert response["pageName"] == "sample page name"
