from django.shortcuts import render, redirect
from .operation import login_user

def login_view(request):
    # Always show login page on GET (useful during development)
    if request.method == "POST":
        return login_user(request)  # will redirect on success
    return render(request, "LogIn.html")

def superadmin_dashboard(request):
    return render(request, 'SUPER_ADMIN/SA_dashboard.html')

def admin_dashboard(request):
    return render(request, 'ADMIN/ADMIN_dashboard.html')

def penro_dashboard(request):
    return render(request, 'PENRO/PENRO_dashboard.html')

def cenro_dashboard(request):
    return render(request, 'CENRO/CENRO_dashboard.html')

def cenro_activitylogs(request):
    return render(request, 'CENRO/CENRO_activitylogs.html')

def cenro_reports(request):
    return render (request, 'CENRO/CENRO_reports.html')

def cenro_templates(request):
    return render (request, 'CENRO/CENRO_templates.html')

def logout_view(request):
    request.session.flush()
    return redirect("login")
