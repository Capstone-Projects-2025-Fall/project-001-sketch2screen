import pytest
from django.test import RequestFactory
from django.http import JsonResponse, HttpResponse
import json

from pytest_mock import mocker
from views import test_api, generate_mockup, frontend
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
        response = test_api(request)

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['status'] == 'success'

    def test_api_returns_correct_message(self, factory):
        """Test that test_api returns the correct message."""
        request = factory.get('/api/test/')
        response = test_api(request)

        data = json.loads(response.content)
        assert data['message'] == 'Backend is connected!'

    def test_api_returns_request_method_get(self, factory):
        """Test that test_api returns the correct request method for GET."""
        request = factory.get('/api/test/')
        response = test_api(request)

        data = json.loads(response.content)
        assert data['method'] == 'GET'
    
    def test_api_returns_request_method_post(self, factory):
        """Test that test_api returns the correct request method for POST."""
        request = factory.post('/api/test/')
        response = test_api(request)

        data = json.loads(response.content)
        assert data['method'] == 'POST'
    
    def test_api_response_is_json(self, factory):
        """Test that test_api response is valid JSON."""
        request = factory.get('/api/test/')
        response = test_api(request)

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
    
class TestFrontend:
    """Tests for the frontend view function."""
    @pytest.fixture
    def factory(self):
        return RequestFactory()
    
    def test_frontend_renders_template(self, factory, mocker):
        #Mock the render function to verify it's called correctly
        mock_render = mocker.patch('views.render')
        mock_render.return_value = mocker.Mock()

        request = factory.get('/')
        frontend(request)

        mock_render.assert_called_once_with(request, 'frontend/src/index.html')
    
    def test_frontend_returns_render_response(self, factory):
        #Test that frontend view returns the result from render
        expected_response = HttpResponse("test content")
        mock_render = mocker.patch('views.render', return_value = expected_response)

        request = factory.get('/')
        response = frontend(request)
        
        assert response == expected_response

    def test_frontend_accepts_get_requests(self, factory, mocker):
        #Test that frontend view accepts GET requests
        mock_render = mocker.patch('views.render')
        request = factory.get('/')

        frontend(request)
        assert mock_render.called
    
    