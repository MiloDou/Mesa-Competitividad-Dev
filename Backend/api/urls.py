from django.urls import include, path
from rest_framework.routers import DefaultRouter

from accounts.views import (
    LoginView, MeView, PasswordResetConfirmView, PasswordResetRequestView, PositionAssignmentViewSet,
    PositionViewSet, RefreshView, LogoutView, UserViewSet,
)
from audit.views import AuditEventViewSet
from directory.views import (
    CommissionMembershipViewSet, CommissionViewSet, InstitutionViewSet, MemberViewSet,
    PublicInstitutionViewSet, PublicMemberViewSet,
)
from meetings.views import AgreementViewSet, AttendanceViewSet, MeetingViewSet, MinutePdfView, MinuteViewSet
from notifications.views import DeviceTokenViewSet, NotificationViewSet
from portal.views import (
    ContentAssetViewSet, ContactRequestAdminViewSet, ContactRequestPublicView, EventAdminViewSet,
    PublicContentAssetView, PublicEventViewSet, PublicPublicationViewSet, PublicSiteProfileViewSet,
    PublicationAdminViewSet, SiteProfileViewSet,
)
from projects.views import (
    DocumentDownloadView, DocumentViewSet, FollowUpTopicViewSet, ProjectAssignmentViewSet, ProjectHistoryViewSet,
    ProjectViewSet, PublicProjectViewSet,
)
from voting.views import VotingViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("positions", PositionViewSet, basename="position")
router.register("position-assignments", PositionAssignmentViewSet, basename="position-assignment")
router.register("institutions", InstitutionViewSet, basename="institution")
router.register("commissions", CommissionViewSet, basename="commission")
router.register("members", MemberViewSet, basename="member")
router.register("commission-memberships", CommissionMembershipViewSet, basename="commission-membership")
router.register("projects", ProjectViewSet, basename="project")
router.register("project-history", ProjectHistoryViewSet, basename="project-history")
router.register("project-assignments", ProjectAssignmentViewSet, basename="project-assignment")
router.register("follow-up-topics", FollowUpTopicViewSet, basename="follow-up-topic")
router.register("documents", DocumentViewSet, basename="document")
router.register("meetings", MeetingViewSet, basename="meeting")
router.register("attendance", AttendanceViewSet, basename="attendance")
router.register("minutes", MinuteViewSet, basename="minute")
router.register("agreements", AgreementViewSet, basename="agreement")
router.register("votings", VotingViewSet, basename="voting")
router.register("publications", PublicationAdminViewSet, basename="publication-admin")
router.register("events", EventAdminViewSet, basename="event-admin")
router.register("media-assets", ContentAssetViewSet, basename="media-asset")
router.register("site-profile", SiteProfileViewSet, basename="site-profile")
router.register("contact-requests", ContactRequestAdminViewSet, basename="contact-request")
router.register("notifications", NotificationViewSet, basename="notification")
router.register("devices", DeviceTokenViewSet, basename="device")
router.register("audit-events", AuditEventViewSet, basename="audit-event")

public_router = DefaultRouter()
public_router.register("institutions", PublicInstitutionViewSet, basename="public-institution")
public_router.register("members", PublicMemberViewSet, basename="public-member")
public_router.register("projects", PublicProjectViewSet, basename="public-project")
public_router.register("publications", PublicPublicationViewSet, basename="public-publication")
public_router.register("events", PublicEventViewSet, basename="public-event")
public_router.register("site-profile", PublicSiteProfileViewSet, basename="public-site-profile")

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="password-reset-request"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("documents/<int:pk>/download/", DocumentDownloadView.as_view(), name="document-download"),
    path("minutes/<int:pk>/pdf/", MinutePdfView.as_view(), name="minute-pdf"),
    path("public/contact/", ContactRequestPublicView.as_view({"post": "create"}), name="contact-submit"),
    path("public/media-assets/<int:pk>/download/", PublicContentAssetView.as_view(), name="public-media-asset-download"),
    path("public/", include(public_router.urls)),
    path("", include(router.urls)),
]
