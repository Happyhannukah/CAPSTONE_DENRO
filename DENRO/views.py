# DENRO/views.py
from datetime import timedelta
import json
import logging

from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.hashers import make_password
from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.utils.timezone import now

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import User, Notification, ActivityLog, EnumeratorsReport
from django.contrib.auth import get_user_model

User = get_user_model()

from .serializers import UserSerializer
from .permissions import IsSuperAdmin, IsAdminOrSuperAdmin


# ----------------- Notifications -----------------
@login_required
def mark_notification_read(request, pk):
    note = get_object_or_404(Notification, pk=pk)
    note.is_read = True
    note.save()
    return redirect("admin_dashboard")


# ----------------- Registration -----------------
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

        Notification.objects.create(
            user=user, message=f"New {role} registered: {username}"
        )

        messages.success(request, "Your account is pending approval by Admin.")
        return redirect("login")

    return render(request, "Register.html")


# ----------------- Approve Users -----------------
def is_admin(user):
    return getattr(user, "role", None) in ("ADMIN", "SUPER_ADMIN")


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
                ActivityLog.objects.create(
                    user=request.user,
                    action="APPROVE",
                    details=f"Approved user {user.username}",
                    ip_address=request.META.get("REMOTE_ADDR"),
                )
            elif action == "reject":
                user.is_rejected = True
                user.save()
                ActivityLog.objects.create(
                    user=request.user,
                    action="REJECT",
                    details=f"Rejected user {user.username}",
                    ip_address=request.META.get("REMOTE_ADDR"),
                )
            elif action == "deactivate":
                user.is_deactivated = True
                user.save()
            elif action == "reapprove":
                user.is_rejected = False
                user.is_approved = True
                user.save()
            elif action == "reject_approved":
                user.is_rejected = True
                user.is_approved = False
                user.save()
            elif action == "deactivate_rejected":
                user.is_rejected = False
                user.is_deactivated = True
                user.save()
        except User.DoesNotExist:
            pass

    pending_users = User.objects.filter(
        is_approved=False, is_rejected=False, is_deactivated=False
    )
    approved_users = User.objects.filter(is_approved=True, is_deactivated=False)
    rejected_users = User.objects.filter(is_rejected=True)
    deactivated_users = User.objects.filter(is_deactivated=True)
    notifications, unread_count = get_unread_notifications()

    return render(
        request,
        "ADMIN/approve_users.html",
        {
            "pending_users": pending_users,
            "approved_users": approved_users,
            "rejected_users": rejected_users,
            "deactivated_users": deactivated_users,
            "notifications": notifications,
            "unread_count": unread_count,
        },
    )


# ----------------- Admin Reports -----------------
@user_passes_test(is_admin)
def admin_reports(request):
    if request.method == "POST":
        report_id = request.POST.get("report_id")
        action = request.POST.get("action")
        try:
            report = EnumeratorsReport.objects.get(id=report_id)
            if action == "accept":
                report.status = "ACCEPTED"
                report.save()
                ActivityLog.objects.create(
                    user=request.user,
                    action="APPROVE",
                    details=f"Accepted report {report_id} by {report.enumerator.username}",
                    ip_address=request.META.get("REMOTE_ADDR"),
                )
            elif action == "decline":
                report.status = "DECLINED"
                report.save()
                ActivityLog.objects.create(
                    user=request.user,
                    action="REJECT",
                    details=f"Declined report {report_id} by {report.enumerator.username}",
                    ip_address=request.META.get("REMOTE_ADDR"),
                )
        except EnumeratorsReport.DoesNotExist:
            pass

    pending_reports = EnumeratorsReport.objects.filter(status="PENDING").select_related(
        "enumerator", "pa", "profile"
    )
    accepted_reports = EnumeratorsReport.objects.filter(status="ACCEPTED").select_related(
        "enumerator", "pa", "profile"
    )
    declined_reports = EnumeratorsReport.objects.filter(status="DECLINED").select_related(
        "enumerator", "pa", "profile"
    )

    notifications, unread_count = get_unread_notifications()

    return render(
        request,
        "ADMIN/admin_reports.html",
        {
            "pending_reports": pending_reports,
            "accepted_reports": accepted_reports,
            "declined_reports": declined_reports,
            "notifications": notifications,
            "unread_count": unread_count,
        },
    )


# ----------------- Helper Functions -----------------
def get_dashboard_stats():
    return {
        "admins": User.objects.filter(role="ADMIN", is_approved=True, is_deactivated=False).count(),
        "penros": User.objects.filter(role="PENRO", is_approved=True, is_deactivated=False).count(),
        "cenros": User.objects.filter(role="CENRO", is_approved=True, is_deactivated=False).count(),
        "evaluators": User.objects.filter(role="EVALUATOR", is_approved=True, is_deactivated=False).count(),
        "approved_users": User.objects.filter(is_approved=True, is_deactivated=False).count(),
        "pending_users": User.objects.filter(is_approved=False, is_rejected=False, is_deactivated=False).count(),
        "rejected_users": User.objects.filter(is_rejected=True).count(),
        "deactivated_users": User.objects.filter(is_deactivated=True).count(),
    }


def get_recent_users(limit=5):
    return User.objects.order_by("-date_joined")[:limit]


def get_unread_notifications():
    notifications = Notification.objects.filter(is_read=False).order_by("-created_at")
    return notifications, notifications.count()


# ----------------- Admin Dashboard -----------------
@login_required
def admin_dashboard(request):
    stats = get_dashboard_stats()
    users = get_recent_users()
    notifications, unread_count = get_unread_notifications()

    logs_qs = ActivityLog.objects.all().select_related("user").order_by("-created_at")

    # Filters
    q = request.GET.get("q")
    role = request.GET.get("role")
    action = request.GET.get("action")
    dfrom = request.GET.get("from")
    dto = request.GET.get("to")

    if q:
        logs_qs = logs_qs.filter(
            Q(user__username__icontains=q) | Q(details__icontains=q) | Q(action__icontains=q)
        )
    if role:
        logs_qs = logs_qs.filter(user__role=role)
    if action:
        logs_qs = logs_qs.filter(action=action)
    if dfrom:
        logs_qs = logs_qs.filter(created_at__date__gte=dfrom)
    if dto:
        logs_qs = logs_qs.filter(created_at__date__lte=dto)

    paginator = Paginator(logs_qs, 20)
    page_obj = paginator.get_page(request.GET.get("page") or 1)

    return render(
        request,
        "ADMIN/ADMIN_dashboard.html",
        {
            "stats": stats,
            "users": users,
            "notifications": notifications,
            "unread_count": unread_count,
            "logs": page_obj.object_list,
            "page_obj": page_obj,
        },
    )


# ----------------- Login -----------------
def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request, username=username, password=password)

        if user is not None:
            if not user.is_approved:
                messages.error(request, "Your account is pending approval by Admin.")
                return redirect("login")
            if user.is_rejected:
                messages.error(request, "Your account has been rejected.")
                return redirect("login")
            if user.is_deactivated:
                messages.error(request, "Your account has been deactivated.")
                return redirect("login")

            login(request, user)
            ActivityLog.objects.create(
                user=user,
                action="LOGIN",
                details=f"Logged in from {request.META.get('REMOTE_ADDR', 'unknown')}",
                ip_address=request.META.get("REMOTE_ADDR"),
            )
            if user.role == "SUPER_ADMIN":
                return redirect("SA-dashboard")
            elif user.role == "ADMIN":
                return redirect("admin_dashboard")
            elif user.role == "PENRO":
                return redirect("PENRO-dashboard")
            elif user.role == "CENRO":
                return redirect("CENRO-dashboard")
            elif user.role == "EVALUATOR":
                return redirect("EVALUATOR-dashboard")
        else:
            return render(request, "LogIn.html", {"error": "Invalid username or password"})

    return render(request, "LogIn.html")


# ----------------- User Profile -----------------
@login_required
def user_profile(request):
    if request.method == "POST":
        request.user.first_name = request.POST.get("first_name", request.user.first_name)
        request.user.last_name = request.POST.get("last_name", request.user.last_name)
        request.user.email = request.POST.get("email", request.user.email)
        request.user.gender = request.POST.get("gender", request.user.gender)
        request.user.phone_number = request.POST.get("phone_number", request.user.phone_number)
        request.user.region = request.POST.get("region", request.user.region)
        request.user.profile_pic = request.POST.get("profile_pic", request.user.profile_pic)
        request.user.id_number = request.POST.get("id_number", request.user.id_number)
        request.user.save()

        ActivityLog.objects.create(
            user=request.user,
            action="UPDATE",
            details="Updated profile information",
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        messages.success(request, "Profile updated successfully.")
        return redirect("user_profile")

    return render(request, "user_profile.html", {"user": request.user})


# ----------------- Admin Activity Logs -----------------
@login_required
def admin_activity_logs(request):
    notifications, unread_count = get_unread_notifications()

    # Handle manual account creation
    if request.method == "POST" and request.POST.get("action") == "create_account":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        role = request.POST.get("role")
        first_name = request.POST.get("first_name")
        last_name = request.POST.get("last_name")
        id_number = request.POST.get("id_number")

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists")
        elif User.objects.filter(id_number=id_number).exists():
            messages.error(request, "ID Number already exists")
        else:
            user = User.objects.create(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role,
                password=make_password(password),
                id_number=id_number,
                is_approved=False,
            )

            Notification.objects.create(
                user=user, message=f"New {role} registered: {username} - Pending approval"
            )

            ActivityLog.objects.create(
                user=request.user,
                action="CREATE",
                details=f"Created account for {username} ({role}) - ID: {id_number}",
                ip_address=request.META.get("REMOTE_ADDR"),
            )

            messages.success(request, f"Account for {username} created successfully")
            return redirect("admin_activitylogs")

    logs_qs = ActivityLog.objects.all().select_related("user").order_by("-created_at")

    # Filters
    q = request.GET.get("q")
    role = request.GET.get("role")
    action = request.GET.get("action")
    dfrom = request.GET.get("from")
    dto = request.GET.get("to")
    if q:
        logs_qs = logs_qs.filter(
            Q(user__username__icontains=q) | Q(details__icontains=q) | Q(action__icontains=q)
        )
    if role:
        logs_qs = logs_qs.filter(user__role=role)
    if action:
        logs_qs = logs_qs.filter(action=action)
    if dfrom:
        logs_qs = logs_qs.filter(created_at__date__gte=dfrom)
    if dto:
        logs_qs = logs_qs.filter(created_at__date__lte=dto)

    paginator = Paginator(logs_qs, 20)
    page_obj = paginator.get_page(request.GET.get("page") or 1)

    metrics = {
        "total_events": logs_qs.count(),
        "unique_users": logs_qs.values("user_id").distinct().count(),
        "errors": logs_qs.filter(action="ERROR").count(),
        "this_week": logs_qs.filter(created_at__gte=now() - timedelta(days=7)).count(),
    }

    total_events_breakdown = dict(logs_qs.values_list("action").annotate(c=Count("id")))
    unique_user_ids = logs_qs.values("user_id").distinct()
    unique_users_breakdown = dict(
        logs_qs.filter(user_id__in=[u["user_id"] for u in unique_user_ids])
        .values_list("action")
        .annotate(c=Count("id"))
    )
    errors_breakdown = dict(
        logs_qs.filter(action="ERROR").values_list("details").annotate(c=Count("id"))
    )
    this_week_qs = logs_qs.filter(created_at__gte=now() - timedelta(days=7))
    this_week_breakdown = dict(this_week_qs.values_list("action").annotate(c=Count("id")))

    context = {
        "logs": page_obj.object_list,
        "page_obj": page_obj,
        "metrics": metrics,
        "action_counts_json": json.dumps(total_events_breakdown),
        "popup_data": {
            "total_events": total_events_breakdown,
            "unique_users": unique_users_breakdown,
            "errors": errors_breakdown,
            "this_week": this_week_breakdown,
        },
        "notifications": notifications,
        "unread_count": unread_count,
    }
    return render(request, "ADMIN/admin_activitylogs.html", context)


# ----------------- Dashboards -----------------
@login_required
def superadmin_dashboard(request):
    users = User.objects.all()
    return render(request, "SUPER_ADMIN/SA_dashboard.html", {"users": users})


@login_required
def penro_dashboard(request):
    return render(request, "PENRO/PENRO_dashboard.html")


@login_required
def cenro_dashboard(request):
    return render(request, "CENRO/CENRO_dashboard.html")


@login_required
def cenro_activitylogs(request):
    return render(request, "CENRO/cenro_activitylogs.html")


@login_required
def cenro_reports(request):
    return render(request, "CENRO/cenro_reports.html")


@login_required
def cenro_templates(request):
    return render(request, "CENRO/CENRO_templates.html")


# ----------------- Logout -----------------
def logout_view(request):
    request.session.flush()
    return redirect("login")


# ----------------- API -----------------
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get_permissions(self):
        if self.action in ["create", "destroy"]:
            return [IsSuperAdmin()]
        return super().get_permissions()


# ----------------- User Activity Detail -----------------
@login_required
def user_activity_detail(request, user_id):
    user = get_object_or_404(User, id=user_id)
    logs = ActivityLog.objects.filter(user=user).order_by("-created_at")[:20]

    # Return JSON if AJAX request
    if request.headers.get("Accept") == "application/json":
        logs_data = []
        for log in logs:
            logs_data.append({
                "id": log.id,
                "action": log.action,
                "details": log.details,
                "created_at": log.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "ip_address": log.ip_address,
            })
        return JsonResponse({
            "user": {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
            "logs": logs_data,
        })

    # Otherwise render template
    return render(
        request,
        "ADMIN/user_activity_detail.html",
        {"user": user, "logs": logs},
    )


# ----------------- Welcome API -----------------
def welcome_api(request):
    logging.info(f"Request received: {request.method} {request.path}")
    return JsonResponse({"message": "Welcome to DENRO API!"})
