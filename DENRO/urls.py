from django.urls import path
from . import views
from django.shortcuts import redirect


# redirect root to login
def root_redirect(request):
    return redirect("login")


urlpatterns = [
    path("", root_redirect, name="root"),
    # Auth
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("register/", views.register_view, name="register"),
    # Dashboards
    path("super-admin/dashboard/", views.superadmin_dashboard, name="SA-dashboard"),
    path("custom-admin/dashboard/", views.admin_dashboard, name="admin_dashboard"),
    path("penro/dashboard/", views.penro_dashboard, name="PENRO_dashboard"),
    path("cenro/dashboard/", views.cenro_dashboard, name="CENRO_dashboard"),
    # CENRO sub-pages
    path("cenro/activitylogs/", views.cenro_activitylogs, name="CENRO_activitylogs"),
    path("cenro/reports/", views.cenro_reports, name="CENRO_reports"),
    path("cenro/templates/", views.cenro_templates, name="CENRO_templates"),
    # Admin Approvals
    path("custom-admin/approve-users/", views.approve_users, name="approve_users"),
    path("custom-admin/reports/", views.admin_reports, name="admin_reports"),
    # Notifications
    path(
        "notification/<int:pk>/read/",
        views.mark_notification_read,
        name="mark_notification_read",
    ),
    path("custom-admin/activity-logs/", views.admin_activity_logs, name="admin_activitylogs"),
    path("activitylogs/user/<int:user_id>/", views.user_activity_detail, name="user_activity_detail"),
    path("cenro/activitylogs/", views.cenro_activitylogs, name="CENRO_activitylogs"),
    path("api/welcome/", views.welcome_api, name="welcome_api"),



]
