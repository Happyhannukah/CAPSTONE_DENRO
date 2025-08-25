from django.urls import path
from django.shortcuts import redirect
from . import views
# DENR/urls.py
from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from .views import UserViewSet, records_page

# router = DefaultRouter()
# router.register("users", UserViewSet, basename="user")

# urlpatterns = [
#     path("", records_page, name="records_page"),
#     path("records/", records_page, name="records_page"),
#     path("api/", include(router.urls)),
# ]

# urlpatterns = [
#     path('', lambda request: redirect('login')),
#     path('login/', views.login_view, name='login'),
#     path('logout/', views.logout_view, name='logout'),

#     # path('sa/dashboard/', views.superadmin_dashboard, name='SA-dashboard'),
#     # DENRO/urls.py
# path("custom-admin/dashboard/", views.admin_dashboard, name="Admin-dashboard"),


#     path('admin/dashboard/', views.admin_dashboard, name='Admin-dashboard'),

#     path('penro/dashboard/', views.penro_dashboard, name='PENRO-dashboard'),


#     path('cenro/dashboard/', views.cenro_dashboard, name='CENRO-dashboard'),
#     path('cenro/activitylogs/', views.cenro_activitylogs, name='CENRO-activitylogs'),
#     path('cenro/reports/', views.cenro_reports, name='CENRO-reports'),
#     path('cenro/templates/', views.cenro_templates, name='CENRO-templates'),


# ]
urlpatterns = [
    path('', lambda request: redirect('login')),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path("register/", views.register_view, name="register"),
    path("admin/approve-users/", views.approve_users, name="approve-users"),
    path("admin/notifications/<int:pk>/read/", views.mark_notification_read, name="mark_notification_read"),


    # Super Admin
    path('sa/dashboard/', views.superadmin_dashboard, name='SA-dashboard'),

    # ✅ Custom Admin (avoid conflict with Django's /admin/)
    path("custom-admin/dashboard/", views.admin_dashboard, name="Admin-dashboard"),

    # PENRO
    path('penro/dashboard/', views.penro_dashboard, name='PENRO-dashboard'),

    # CENRO
    path('cenro/dashboard/', views.cenro_dashboard, name='CENRO-dashboard'),
    path('cenro/activitylogs/', views.cenro_activitylogs, name='CENRO-activitylogs'),
    path('cenro/reports/', views.cenro_reports, name='CENRO-reports'),
    path('cenro/templates/', views.cenro_templates, name='CENRO-templates'),
]
