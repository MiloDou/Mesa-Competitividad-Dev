from django.db import connection
from django.db.utils import DatabaseError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = []

    @extend_schema(responses={200: inline_serializer(name="HealthStatus", fields={"status": serializers.CharField(), "database": serializers.CharField()}), 503: inline_serializer(name="HealthStatusUnavailable", fields={"status": serializers.CharField(), "database": serializers.CharField()})})
    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except DatabaseError:
            return Response({"status": "unhealthy", "database": "unavailable"}, status=503)
        return Response({"status": "ok", "database": "ok"})
