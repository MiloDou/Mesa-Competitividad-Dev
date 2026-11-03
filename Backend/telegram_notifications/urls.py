from django.urls import include, path
from rest_framework.routers import DefaultRouter

from telegram_notifications.views import TelegramLinkViewSet, TelegramProcessView, TelegramStatusView, TelegramWebhookView

router = DefaultRouter()
router.register("links", TelegramLinkViewSet, basename="telegram-link")

urlpatterns = [
    path("webhook/", TelegramWebhookView.as_view(), name="telegram-webhook"),
    path("process/", TelegramProcessView.as_view(), name="telegram-process"),
    path("status/", TelegramStatusView.as_view(), name="telegram-status"),
    path("", include(router.urls)),
]
