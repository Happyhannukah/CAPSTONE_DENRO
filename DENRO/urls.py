from django.urls import path
from django.shortcuts import redirect
from . import views

urlpatterns = [
    path('', lambda request: redirect('login')),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    path('sa/dashboard/', views.superadmin_dashboard, name='SA-dashboard'),

    path('admin/dashboard/', views.admin_dashboard, name='Admin-dashboard'),

    path('penro/dashboard/', views.penro_dashboard, name='PENRO-dashboard'),


    path('cenro/dashboard/', views.cenro_dashboard, name='CENRO-dashboard'),
    path('cenro/activitylogs/', views.cenro_activitylogs, name='CENRO-activitylogs'),
    path('cenro/reports/', views.cenro_reports, name='CENRO-reports'),
    path('cenro/templates/', views.cenro_templates, name='CENRO-templates'),


]
