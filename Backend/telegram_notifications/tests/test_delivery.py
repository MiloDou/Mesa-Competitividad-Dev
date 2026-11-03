from datetime import timedelta
from unittest.mock import Mock, patch

import requests
from django.test import TestCase, override_settings
from django.utils import timezone
from urllib3.exceptions import MaxRetryError, NewConnectionError

from accounts.models import User
from telegram_notifications import delivery
from telegram_notifications.contracts import Message, load_hook, record_event
from telegram_notifications.models import DeliveryJob, TelegramLink

POST = "telegram_notifications.client.requests.post"


def telegram_response(ok=True, error_code=None, description="", retry_after=None):
    body = {"ok": True, "result": {"message_id": 77}} if ok else {"ok": False, "error_code": error_code, "description": description}
    if retry_after:
        body["parameters"] = {"retry_after": retry_after}
    return Mock(json=Mock(return_value=body), status_code=200 if ok else error_code)


def render(job):
    return Message(f"Aviso {job.event.resource_id}", [("Ver", "https://example.test/reuniones/1")])


@override_settings(TELEGRAM_BOT_TOKEN="123:test")
class DeliveryTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        password = "Long-Unique-Passphrase-2026!"
        cls.user = User.objects.create_user("one@example.test", password, first_name="Una", last_name="Cuenta")
        cls.second = User.objects.create_user("two@example.test", password, first_name="Dos", last_name="Cuenta")
        cls.link = TelegramLink.objects.create(user=cls.user, chat_id=7001, status=TelegramLink.Status.ACTIVE, consent_at=timezone.now())
        TelegramLink.objects.create(user=cls.second, chat_id=7002, status=TelegramLink.Status.ACTIVE, consent_at=timezone.now())

    def setUp(self):
        record_event("meeting.created", "meeting", 1, "", [self.user])

    def job(self):
        return DeliveryJob.objects.get(user=self.user)

    def deliver(self, response=None, side_effect=None):
        with patch(POST, return_value=response or telegram_response(), side_effect=side_effect) as post:
            counts = delivery.deliver_due(render)
        return counts, post

    def test_successful_delivery_stores_message_id(self):
        counts, post = self.deliver()
        job = self.job()
        self.assertEqual(counts, {"sent": 1})
        self.assertEqual((job.status, job.telegram_message_id, job.attempts), ("sent", 77, 1))
        self.assertIsNone(job.lock_token)
        payload = post.call_args.kwargs["json"]
        self.assertEqual((payload["chat_id"], payload["text"]), (7001, "Aviso 1"))
        self.assertEqual(payload["reply_markup"]["inline_keyboard"], [[{"text": "Ver", "url": "https://example.test/reuniones/1"}]])

    def test_double_claim_never_delivers_twice(self):
        self.assertEqual(len(delivery.claim()), 1)
        self.assertEqual(delivery.claim(), [])
        counts, post = self.deliver()
        self.assertEqual((counts, post.call_count), ({}, 0))

    def test_stale_lock_requeues_or_marks_uncertain(self):
        record_event("meeting.created", "meeting", 2, "", [self.user])
        past = timezone.now() - timedelta(minutes=5)
        DeliveryJob.objects.update(status="sending", locked_until=past)
        DeliveryJob.objects.filter(event__resource_id="2").update(send_started_at=past)
        self.assertEqual(delivery.recover_stale(), {"requeued": 1, "uncertain": 1})
        self.assertEqual(sorted(DeliveryJob.objects.values_list("event__resource_id", "status")), [("1", "pending"), ("2", "uncertain")])
        DeliveryJob.objects.update(status="sending", locked_until=timezone.now() + timedelta(minutes=1), send_started_at=None)
        self.assertEqual(delivery.recover_stale(), {"requeued": 0, "uncertain": 0})

    def test_rate_limit_reschedules_and_stops_batch(self):
        record_event("meeting.created", "meeting", 1, "", [self.second])
        counts, post = self.deliver(telegram_response(False, 429, "Too Many Requests", retry_after=30))
        self.assertEqual((counts, post.call_count), ({"rate_limited": 1, "released": 1}, 1))
        self.assertEqual(list(DeliveryJob.objects.values_list("status", "attempts", "send_started_at")), [("pending", 0, None)] * 2)
        first = DeliveryJob.objects.filter(run_after__gt=timezone.now() + timedelta(seconds=25))
        self.assertEqual(first.count(), 1)

    def test_blocked_chat_blocks_link(self):
        counts, _ = self.deliver(telegram_response(False, 403, "Forbidden: bot was blocked by the user"))
        self.assertEqual(counts, {"blocked": 1})
        self.assertEqual((self.job().status, TelegramLink.objects.get(pk=self.link.pk).status), ("cancelled", "blocked"))

    def test_connection_error_retries_with_backoff_until_failed(self):
        error = requests.ConnectionError(MaxRetryError(None, "/", NewConnectionError(None, "sin red")))
        counts, _ = self.deliver(side_effect=error)
        job = self.job()
        self.assertEqual((counts, job.status, job.attempts), ({"retry": 1}, "pending", 1))
        self.assertAlmostEqual((job.run_after - timezone.now()).total_seconds(), 60, delta=5)

        DeliveryJob.objects.update(attempts=delivery.MAX_ATTEMPTS - 1, run_after=timezone.now())
        counts, _ = self.deliver(side_effect=error)
        self.assertEqual((counts, self.job().status), ({"failed": 1}, "failed"))

    def test_server_error_is_retried(self):
        counts, _ = self.deliver(telegram_response(False, 502, "Bad Gateway"))
        self.assertEqual((counts, self.job().status), ({"retry": 1}, "pending"))

    def test_read_timeout_or_drop_after_sending_is_uncertain(self):
        for error in (requests.ReadTimeout(), requests.ConnectionError("Connection aborted.")):
            DeliveryJob.objects.update(status="pending", run_after=timezone.now())
            counts, _ = self.deliver(side_effect=error)
            self.assertEqual((counts, self.job().status), ({"uncertain": 1}, "uncertain"))

    def test_policy_none_paused_link_and_old_job_cancel_without_sending(self):
        with patch(POST) as post:
            self.assertEqual(delivery.deliver_due(lambda job: None), {"cancelled": 1})
            self.assertEqual(self.job().cancel_reason, "No autorizado por la política")

            DeliveryJob.objects.update(status="pending")
            TelegramLink.objects.filter(pk=self.link.pk).update(status=TelegramLink.Status.PAUSED)
            self.assertEqual(delivery.deliver_due(render), {"cancelled": 1})
            self.assertEqual(self.job().cancel_reason, "Vínculo no activo")

            DeliveryJob.objects.update(status="pending", run_after=timezone.now() - timedelta(hours=25))
            TelegramLink.objects.filter(pk=self.link.pk).update(status=TelegramLink.Status.ACTIVE)
            self.assertEqual(delivery.deliver_due(render), {"expired": 1})
        post.assert_not_called()

    def test_policy_error_fails_job(self):
        with patch(POST) as post, self.assertLogs("telegram_notifications.delivery", "ERROR"):
            self.assertEqual(delivery.deliver_due(Mock(side_effect=RuntimeError)), {"failed": 1})
        post.assert_not_called()

    def test_missing_policy_hook_sends_nothing(self):
        self.assertIsNone(load_hook("modulo_inexistente", "authorize_and_render"))
        with patch.object(delivery, "load_hook", return_value=None), patch(POST) as post:
            self.assertIn("skipped", delivery.deliver_due())
        post.assert_not_called()
        self.assertEqual(self.job().status, "pending")

    def test_time_budget_releases_remaining_jobs(self):
        with patch.object(delivery, "TIME_BUDGET_SECONDS", -1):
            counts, post = self.deliver()
        self.assertEqual((counts, post.call_count, self.job().status), ({"released": 1}, 0, "pending"))
