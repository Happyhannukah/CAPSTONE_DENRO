from django.shortcuts import render, redirect
from .operation import login_user
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import User
from .serializers import UserSerializer
from .permissions import IsSuperAdmin, IsAdminOrSuperAdmin
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from .models import User, EnumeratorsReport   # make sure naa ni sa imong models.py
from django.contrib.auth import login
from django.contrib import messages
from django.shortcuts import render, redirect
from .models import User
from django.contrib.auth.hashers import make_password
from django.contrib.auth.decorators import user_passes_test
from .models import Notification
from django.shortcuts import get_object_or_404, redirect

@login_required
def mark_notification_read(request, pk):
    note = get_object_or_404(Notification, pk=pk)
    note.is_read = True
    note.save()
    return redirect("Admin-dashboard")

def register_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        role = request.POST.get("role")
        first_name = request.POST.get("first_name")
        last_name = request.POST.get("last_name")

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists")
            return redirect("register")

        user = User.objects.create(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            password=make_password(password),
            is_approved=False,  # pending by default
        )

        # 🔔 Create a notification for Admins
        Notification.objects.create(
            user=user,
            message=f"New {role} registered: {username}"
        )

        messages.success(request, "Your account is pending approval by Admin.")
        return redirect("login")

    return render(request, "Register.html")

# Helper: check if admin
def is_admin(user):
    return user.role == "ADMIN" or user.role == "SUPER_ADMIN"

@user_passes_test(is_admin)
def approve_users(request):
    if request.method == "POST":
        user_id = request.POST.get("user_id")
        action = request.POST.get("action")
        try:
            user = User.objects.get(id=user_id)
            if action == "approve":
                user.is_approved = True
                user.save()
            elif action == "reject":
                user.delete()
        except User.DoesNotExist:
            pass

    # Show all pending users
    pending_users = User.objects.filter(is_approved=False)
    return render(request, "ADMIN/approve_users.html", {"pending_users": pending_users})

def register_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        role = request.POST.get("role")  # dropdown for roles
        first_name = request.POST.get("first_name")
        last_name = request.POST.get("last_name")

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists")
            return redirect("register")

        user = User.objects.create(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            password=make_password(password),  # hash password
              is_approved=False
        )

        login(request, user)  # auto-login after register (optional)
        messages.success(request, "Account created successfully!")
        return redirect("login")

    return render(request, "Register.html")

# @login_required
# def admin_dashboard(request):
#     stats = {
#         "total_users": User.objects.filter(is_approved=True).count(),
#         "admins": User.objects.filter(role="ADMIN", is_approved=True).count(),
#         "penros": User.objects.filter(role="PENRO", is_approved=True).count(),
#         "cenros": User.objects.filter(role="CENRO", is_approved=True).count(),
#         "evaluators": User.objects.filter(role="EVALUATOR", is_approved=True).count(),
#     }

#     users = User.objects.filter(is_approved=True).order_by("-date_joined")[:5]

#     # ✅ Notifications
#     notifications = Notification.objects.filter(is_read=False).order_by("-created_at")
#     unread_count = notifications.count()
#     print("STATS:", stats)

#     # ✅ Only one return (correct template path)
#     return render(request, "ADMIN/ADMIN_dashboard.html", {
#         "stats": stats,
#         "users": users,
#         "notifications": notifications,
#         "unread_count": unread_count,
#     })
# @login_required
# def admin_dashboard(request):
#     stats = {
#         "total_users": User.objects.filter(is_approved=True).count(),
#         "admins": User.objects.filter(role=User.RoleChoices.ADMIN, is_approved=True).count(),
#         "penros": User.objects.filter(role=User.RoleChoices.PENRO, is_approved=True).count(),
#         "cenros": User.objects.filter(role=User.RoleChoices.CENRO, is_approved=True).count(),
#         "evaluators": User.objects.filter(role=User.RoleChoices.EVALUATOR, is_approved=True).count(),
#     }

#     users = User.objects.filter(is_approved=True).order_by("-date_joined")[:5]

#     notifications = Notification.objects.filter(is_read=False).order_by("-created_at")
#     unread_count = notifications.count()

#     print("STATS:", stats)  # debug

#     return render(request, "ADMIN/ADMIN_dashboard.html", {
#         "stats": stats,
#         "users": users,
#         "notifications": notifications,
#         "unread_count": unread_count,
#     })


# from django.contrib.auth.decorators import login_required
# from django.shortcuts import render
# from .models import User, Notification

# @login_required
# def admin_dashboard(request):
#     stats = {
#         "admins": User.objects.filter(role=User.RoleChoices.ADMIN).count(),
#         "penros": User.objects.filter(role=User.RoleChoices.PENRO).count(),
#         "cenros": User.objects.filter(role=User.RoleChoices.CENRO).count(),
#         "evaluators": User.objects.filter(role=User.RoleChoices.EVALUATOR).count(),
#     }

#     # Show the 5 most recent users, regardless of approval status
#     users = User.objects.order_by("-date_joined")[:5]

#     notifications = Notification.objects.filter(is_read=False).order_by("-created_at")
#     unread_count = notifications.count()

#     return render(request, "ADMIN/ADMIN_dashboard.html", {
#         "stats": stats,
#         "users": users,
#         "notifications": notifications,
#         "unread_count": unread_count,
#     })


# @login_required
# def admin_dashboard(request):
#     stats = {
#         "admins": User.objects.filter(role=User.RoleChoices.ADMIN).count(),
#         "penros": User.objects.filter(role=User.RoleChoices.PENRO).count(),
#         "cenros": User.objects.filter(role=User.RoleChoices.CENRO).count(),
#         "evaluators": User.objects.filter(role=User.RoleChoices.EVALUATOR).count(),
#     }

#     # Show the 5 most recent users, regardless of approval status
#     users = User.objects.order_by("-date_joined")[:5]

#     notifications = Notification.objects.filter(is_read=False).order_by("-created_at")
#     unread_count = notifications.count()

#     return render(request, "ADMIN/ADMIN_dashboard.html", {
#         "stats": stats,
#         "users": users,
#         "notifications": notifications,
#         "unread_count": unread_count,
#     })

# @login_required
# def admin_dashboard(request):
#     # DEBUGGING — check user counts directly
#     print("ALL USERS:", User.objects.all().count())
#     print("ADMINS:", User.objects.filter(role="ADMIN").count())
#     print("PENRO:", User.objects.filter(role="PENRO").count())
#     print("CENRO:", User.objects.filter(role="CENRO").count())
#     print("EVALUATOR:", User.objects.filter(role="EVALUATOR").count())

#     stats = {
#         "admins": User.objects.filter(role="ADMIN").count(),
#         "penros": User.objects.filter(role="PENRO").count(),
#         "cenros": User.objects.filter(role="CENRO").count(),
#         "evaluators": User.objects.filter(role="EVALUATOR").count(),
#     }

#     users = User.objects.order_by("-date_joined")[:5]

#     notifications = Notification.objects.filter(is_read=False).order_by("-created_at")
#     unread_count = notifications.count()

#     return render(request, "ADMIN/ADMIN_dashboard.html", {
#         "stats": stats,
#         "users": users,
#         "notifications": notifications,
#         "unread_count": unread_count,
#     })

@login_required
def admin_dashboard(request):
    stats = {
        "admins": User.objects.filter(role="ADMIN").count(),
        "penros": User.objects.filter(role="PENRO").count(),
        "cenros": User.objects.filter(role="CENRO").count(),
        "evaluators": User.objects.filter(role="EVALUATOR").count(),
    }

    # Load recent users (optional: keep or remove approval filter)
    users = User.objects.order_by("-date_joined")[:5]

    # Notifications
    notifications = Notification.objects.filter(is_read=False).order_by("-created_at")
    unread_count = notifications.count()

    # Debug (optional)
    print("STATS:", stats)

    return render(request, "ADMIN/ADMIN_dashboard.html", {
        "stats": stats,
        "users": users,
        "notifications": notifications,
        "unread_count": unread_count,
    })

def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request, username=username, password=password)

        if user is not None:
            if not user.is_approved:
                messages.error(request, "Your account is pending approval by Admin.")
                return redirect("login")

            


            #  Redirect based on role
            if user.role == "SUPER_ADMIN":
                return redirect("SA-dashboard")
            elif user.role == "ADMIN":
                return redirect("Admin-dashboard")
            elif user.role == "PENRO":
                return redirect("PENRO-dashboard")
            elif user.role == "CENRO":
                return redirect("CENRO-dashboard")
            elif user.role == "EVALUATOR":
                return redirect("EVALUATOR-dashboard")
        else:
            # login failed
            return render(request, "LogIn.html", {"error": "Invalid username or password"})

    return render(request, "LogIn.html")


# def login_view(request):
#     # Always show login page on GET (useful during development)
#     if request.method == "POST":
#         response = login_user(request)  # <-- handles auth
#         if request.user.is_authenticated:
#             role = request.user.role
#             if role == "SUPER_ADMIN":
#                 return redirect("SA-dashboard")
#             elif role == "ADMIN":
#                 return redirect("Admin-dashboard")
#             elif role == "PENRO":
#                 return redirect("PENRO-dashboard")
#             elif role == "CENRO":
#                 return redirect("CENRO-dashboard")
#             elif role == "EVALUATOR":
#                 return redirect("EVALUATOR-dashboard")
#         return response
#     return render(request, "LogIn.html")

@login_required
def superadmin_dashboard(request):
    users = User.objects.all()
    return render(request, "SUPER_ADMIN/SA_dashboard.html", {"users": users})


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

# def records_page(request):
#     records = Denr.objects.all()
#     return render(request, "ADMIN.html", {"records": records})

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated & IsAdminOrSuperAdmin]

    def get_permissions(self):
        if self.action in ["create", "destroy"]:  # only super admin
            return [IsSuperAdmin()]
        return super().get_permissions()
