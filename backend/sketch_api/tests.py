import pytest
from django.test import RequestFactory
from django.http import JsonResponse
import json
from views import test_api, generate_mockup
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
    
    