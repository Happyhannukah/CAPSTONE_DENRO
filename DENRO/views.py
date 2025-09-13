# DENRO/views.py
from datetime import timedelta, datetime
import json
import logging
import random

from django.shortcuts import render, redirect, get_object_or_404
from django.core.mail import send_mail
from django.http import JsonResponse
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.hashers import make_password
from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.utils.timezone import now
from django.views.decorators.cache import cache_control

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
    note = get_object_or_404(Notification, pk=pk, user=request.user)
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

        if User.objects.filter(email=email).exists():
            messages.error(request, "Email already exists")
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

        # Send notification to admins about new registration
        for admin in User.objects.filter(role__in=['ADMIN', 'SUPER_ADMIN']):
            Notification.objects.create(
                user=admin, message=f"New {role} registered: {username}"
            )

        messages.success(request, "Your account is pending approval by Admin.")
        return redirect("login")

    return render(request, "Register.html")


# ----------------- Approve Users -----------------
def is_admin(user):
    return getattr(user, "role", None) in ("ADMIN", "SUPER_ADMIN")


def is_superadmin(user):
    return getattr(user, "role", None) == "SUPER_ADMIN"


def is_penro(user):
    return getattr(user, "role", None) == "PENRO"


def is_cenro(user):
    return getattr(user, "role", None) == "CENRO"


def is_evaluator(user):
    return getattr(user, "role", None) == "EVALUATOR"


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

    # Base querysets
    pending_users = User.objects.filter(
        is_approved=False, is_rejected=False, is_deactivated=False
    )
    approved_users = User.objects.filter(is_approved=True, is_deactivated=False)
    rejected_users = User.objects.filter(is_rejected=True)
    deactivated_users = User.objects.filter(is_deactivated=True)

    # Filters
    q = request.GET.get("q")
    role = request.GET.get("role")
    dfrom = request.GET.get("from")
    dto = request.GET.get("to")

    if q:
        pending_users = pending_users.filter(
            Q(username__icontains=q) | Q(email__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q)
        )
        approved_users = approved_users.filter(
            Q(username__icontains=q) | Q(email__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q)
        )
        rejected_users = rejected_users.filter(
            Q(username__icontains=q) | Q(email__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q)
        )
        deactivated_users = deactivated_users.filter(
            Q(username__icontains=q) | Q(email__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q)
        )
    if role:
        pending_users = pending_users.filter(role=role)
        approved_users = approved_users.filter(role=role)
        rejected_users = rejected_users.filter(role=role)
        deactivated_users = deactivated_users.filter(role=role)
    if dfrom:
        pending_users = pending_users.filter(date_joined__date__gte=dfrom)
        approved_users = approved_users.filter(date_joined__date__gte=dfrom)
        rejected_users = rejected_users.filter(date_joined__date__gte=dfrom)
        deactivated_users = deactivated_users.filter(date_joined__date__gte=dfrom)
    if dto:
        pending_users = pending_users.filter(date_joined__date__lte=dto)
        approved_users = approved_users.filter(date_joined__date__lte=dto)
        rejected_users = rejected_users.filter(date_joined__date__lte=dto)
        deactivated_users = deactivated_users.filter(date_joined__date__lte=dto)

    notifications, unread_count = get_unread_notifications(request)

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

    # Base querysets
    pending_reports = EnumeratorsReport.objects.filter(status="PENDING").select_related(
        "enumerator", "pa", "profile"
    )
    accepted_reports = EnumeratorsReport.objects.filter(status="ACCEPTED").select_related(
        "enumerator", "pa", "profile"
    )
    declined_reports = EnumeratorsReport.objects.filter(status="DECLINED").select_related(
        "enumerator", "pa", "profile"
    )

    # Filters
    dfrom = request.GET.get("from")
    dto = request.GET.get("to")

    if dfrom:
        pending_reports = pending_reports.filter(report_date__gte=dfrom)
        accepted_reports = accepted_reports.filter(report_date__gte=dfrom)
        declined_reports = declined_reports.filter(report_date__gte=dfrom)
    if dto:
        pending_reports = pending_reports.filter(report_date__lte=dto)
        accepted_reports = accepted_reports.filter(report_date__lte=dto)
        declined_reports = declined_reports.filter(report_date__lte=dto)

    # Get last login locations for CENRO users
    cenro_users = User.objects.filter(role='CENRO', is_approved=True, is_deactivated=False)
    cenro_locations = []
    for user in cenro_users:
        last_location_log = ActivityLog.objects.filter(
            user=user, action='LOCATION_UPDATE'
        ).order_by('-created_at').first()
        if last_location_log and last_location_log.details:
            try:
                parts = last_location_log.details.split(': ')
                if len(parts) == 2:
                    coords = parts[1].split(', ')
                    if len(coords) == 2:
                        lat = float(coords[0])
                        lon = float(coords[1])
                        cenro_locations.append({
                            'id': user.id,
                            'username': user.username,
                            'role': user.role,
                            'lat': lat,
                            'lon': lon,
                            'last_update': last_location_log.created_at,
                        })
            except ValueError:
                pass

    notifications, unread_count = get_unread_notifications(request)

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
        "pending_reports": EnumeratorsReport.objects.filter(status="PENDING").count(),
        "accepted_reports": EnumeratorsReport.objects.filter(status="ACCEPTED").count(),
        "declined_reports": EnumeratorsReport.objects.filter(status="DECLINED").count(),
    }


def get_recent_users(limit=5):
    return User.objects.order_by("-date_joined")[:limit]


def get_unread_notifications(request):
    notifications = Notification.objects.filter(user=request.user, is_read=False).order_by("-created_at")
    return notifications, notifications.count()


# ----------------- Admin Dashboard -----------------
@login_required
def admin_dashboard(request):
    stats = get_dashboard_stats()
    users = get_recent_users()
    notifications, unread_count = get_unread_notifications(request)

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

            # Directly log in the user
            login(request, user)
            ActivityLog.objects.create(
                user=user,
                action="LOGIN",
                details=f"Logged in from {request.META.get('REMOTE_ADDR', 'unknown')}",
                ip_address=request.META.get("REMOTE_ADDR"),
            )
            # Log location update on login (default to Cebu coordinates if no location provided)
            ActivityLog.objects.create(
                user=user,
                action="LOCATION_UPDATE",
                details="Location updated: 10.3157, 123.8854",  # Default Cebu coordinates
                ip_address=request.META.get("REMOTE_ADDR"),
            )

            # Redirect based on role
            if user.role == "SUPER_ADMIN":
                return redirect("SA-dashboard")
            elif user.role == "ADMIN":
                return redirect("admin_dashboard")
            elif user.role == "PENRO":
                return redirect("PENRO_dashboard")
            elif user.role == "CENRO":
                return redirect("CENRO_dashboard")
            elif user.role == "EVALUATOR":
                return redirect("evaluator_dashboard")
        else:
            return render(request, "LogIn.html", {"error": "Invalid username or password"})

    return render(request, "LogIn.html")


# ----------------- Verify 2FA -----------------
def verify_2fa(request):
    if request.method == "POST":
        code = request.POST.get("code")
        stored_code = request.session.get('2fa_code')
        user_id = request.session.get('2fa_user_id')
        expires = request.session.get('2fa_expires')

        if expires and datetime.now().timestamp() > expires:
            messages.error(request, "Verification code has expired. Please login again.")
            return redirect("login")

        if code == stored_code and user_id:
            user = User.objects.get(id=user_id)
            login(request, user)
            ActivityLog.objects.create(
                user=user,
                action="LOGIN",
                details=f"Logged in from {request.META.get('REMOTE_ADDR', 'unknown')}",
                ip_address=request.META.get("REMOTE_ADDR"),
            )
            # Log location update on login (default to Cebu coordinates if no location provided)
            ActivityLog.objects.create(
                user=user,
                action="LOCATION_UPDATE",
                details="Location updated: 10.3157, 123.8854",  # Default Cebu coordinates
                ip_address=request.META.get("REMOTE_ADDR"),
            )
            # Clear session
            del request.session['2fa_code']
            del request.session['2fa_user_id']
            del request.session['2fa_expires']

            # Redirect based on role
            if user.role == "SUPER_ADMIN":
                return redirect("SA-dashboard")
            elif user.role == "ADMIN":
                return redirect("admin_dashboard")
            elif user.role == "PENRO":
                return redirect("PENRO_dashboard")
            elif user.role == "CENRO":
                return redirect("CENRO_dashboard")
            elif user.role == "EVALUATOR":
                return redirect("evaluator_dashboard")
        else:
            messages.error(request, "Invalid verification code.")
            return redirect("login")

    return render(request, "verify_2fa.html")


# ----------------- User Profile -----------------
@login_required
def user_profile(request):
    if request.method == "POST":
        # Update profile info
        new_email = request.POST.get("email", request.user.email)
        if new_email != request.user.email and User.objects.filter(email=new_email).exists():
            messages.error(request, "Email already exists")
            return redirect("user_profile")

        request.user.email = new_email
        request.user.phone_number = request.POST.get("phone_number", request.user.phone_number)
        request.user.region = request.POST.get("region", request.user.region)
        request.user.profile_pic = request.POST.get("profile_pic", request.user.profile_pic)

        # Handle password change if provided
        old_password = request.POST.get("old_password")
        new_password = request.POST.get("new_password")
        confirm_password = request.POST.get("confirm_password")

        password_changed = False
        if old_password and new_password and confirm_password:
            if not request.user.check_password(old_password):
                messages.error(request, "Old password is incorrect.")
                return redirect("user_profile")

            if new_password != confirm_password:
                messages.error(request, "New passwords do not match.")
                return redirect("user_profile")

            if len(new_password) < 8:
                messages.error(request, "New password must be at least 8 characters long.")
                return redirect("user_profile")

            request.user.set_password(new_password)
            password_changed = True

        request.user.save()

        ActivityLog.objects.create(
            user=request.user,
            action="UPDATE",
            details="Updated profile information" + (" and changed password" if password_changed else ""),
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        messages.success(request, "Profile updated successfully." + (" Password changed." if password_changed else ""))
        return redirect("user_profile")

    notifications, unread_count = get_unread_notifications(request)

    return render(request, "user_profile.html", {
        "user": request.user,
        "notifications": notifications,
        "unread_count": unread_count,
    })


# ----------------- Change Password -----------------
@login_required
def change_password(request):
    if request.method == "POST":
        old_password = request.POST.get("old_password")
        new_password = request.POST.get("new_password")
        confirm_password = request.POST.get("confirm_password")

        if not request.user.check_password(old_password):
            messages.error(request, "Old password is incorrect.")
            return redirect("change_password")

        if new_password != confirm_password:
            messages.error(request, "New passwords do not match.")
            return redirect("change_password")

        if len(new_password) < 8:
            messages.error(request, "New password must be at least 8 characters long.")
            return redirect("change_password")

        request.user.set_password(new_password)
        request.user.save()

        ActivityLog.objects.create(
            user=request.user,
            action="UPDATE",
            details="Changed password",
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        messages.success(request, "Password changed successfully.")
        return redirect("change_password")

    notifications, unread_count = get_unread_notifications(request)

    return render(request, "change_password.html", {
        "user": request.user,
        "notifications": notifications,
        "unread_count": unread_count,
    })


# ----------------- Admin Activity Logs -----------------
@login_required
def admin_activity_logs(request):
    notifications, unread_count = get_unread_notifications(request)

    # Handle manual account creation
    if request.method == "POST" and request.POST.get("action") == "create_account":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        role = request.POST.get("role")
        first_name = request.POST.get("first_name")
        last_name = request.POST.get("last_name")
        gender = request.POST.get("gender")
        id_number = request.POST.get("id_number")
        region = request.POST.get("region") if role in ["PENRO", "CENRO"] else None

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists")
        elif User.objects.filter(email=email).exists():
            messages.error(request, "Email already exists")
        elif User.objects.filter(id_number=id_number).exists():
            messages.error(request, "ID Number already exists")
        else:
            user = User.objects.create(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                gender=gender,
                role=role,
                password=make_password(password),
                id_number=id_number,
                region=region,
                is_approved=False,
            )

            # Send notification to admins about new account created
            for admin in User.objects.filter(role__in=['ADMIN', 'SUPER_ADMIN']):
                Notification.objects.create(
                    user=admin, message=f"New {role} account created: {username} - Pending approval"
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
@cache_control(no_cache=True, no_store=True, must_revalidate=True)
@user_passes_test(is_superadmin)
def superadmin_dashboard(request):
    users = User.objects.all()
    return render(request, "SUPER_ADMIN/SA_dashboard.html", {"users": users})


@login_required
@cache_control(no_cache=True, no_store=True, must_revalidate=True)
@user_passes_test(is_penro)
def penro_dashboard(request):
    stats = get_dashboard_stats()
    users = User.objects.filter(role__in=['PENRO', 'EVALUATOR'], last_login__isnull=False).order_by('-last_login')[:5]
    notifications, unread_count = get_unread_notifications(request)

    # Get last login locations for PENRO and EVALUATOR (excluding current user)
    penro_evaluator_users = User.objects.filter(role__in=['PENRO', 'EVALUATOR'], is_approved=True, is_deactivated=False).exclude(id=request.user.id)
    user_locations = []
    for user in penro_evaluator_users:
        last_location_log = ActivityLog.objects.filter(
            user=user, action='LOCATION_UPDATE'
        ).order_by('-created_at').first()
        if last_location_log and last_location_log.details:
            # Parse "Location updated: lat, lon"
            try:
                parts = last_location_log.details.split(': ')
                if len(parts) == 2:
                    coords = parts[1].split(', ')
                    if len(coords) == 2:
                        lat = float(coords[0])
                        lon = float(coords[1])
                        user_locations.append({
                            'id': user.id,
                            'username': user.username,
                            'role': user.role,
                            'lat': lat,
                            'lon': lon,
                            'last_update': last_location_log.created_at,
                        })
            except ValueError:
                pass

    # Get current user's last location
    current_user_location = None
    last_location_log = ActivityLog.objects.filter(
        user=request.user, action='LOCATION_UPDATE'
    ).order_by('-created_at').first()
    if last_location_log and last_location_log.details:
        # Parse "Location updated: lat, lon"
        try:
            parts = last_location_log.details.split(': ')
            if len(parts) == 2:
                coords = parts[1].split(', ')
                if len(coords) == 2:
                    lat = float(coords[0])
                    lon = float(coords[1])
                    current_user_location = {
                        'lat': lat,
                        'lon': lon,
                        'last_update': last_location_log.created_at,
                    }
        except ValueError:
            pass

    logs_qs = ActivityLog.objects.filter(user__role__in=['PENRO', 'EVALUATOR']).select_related("user").order_by("-created_at")

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
        "PENRO/PENRO_dashboard.html",
        {
            "stats": stats,
            "users": users,
            "user_locations": user_locations,
            "current_user_location": current_user_location,
            "notifications": notifications,
            "unread_count": unread_count,
            "logs": page_obj.object_list,
            "page_obj": page_obj,
        },
    )


@login_required
@cache_control(no_cache=True, no_store=True, must_revalidate=True)
@user_passes_test(is_cenro)
def cenro_dashboard(request):
    stats = get_dashboard_stats()
    users = User.objects.filter(role__in=['CENRO', 'EVALUATOR'], last_login__isnull=False).order_by('-last_login')[:5]
    notifications, unread_count = get_unread_notifications(request)

    # Get last login locations for CENRO and EVALUATOR (excluding current user)
    cenro_evaluator_users = User.objects.filter(role__in=['CENRO', 'EVALUATOR'], is_approved=True, is_deactivated=False).exclude(id=request.user.id)
    user_locations = []
    for user in cenro_evaluator_users:
        last_location_log = ActivityLog.objects.filter(
            user=user, action='LOCATION_UPDATE'
        ).order_by('-created_at').first()
        if last_location_log and last_location_log.details:
            # Parse "Location updated: lat, lon"
            try:
                parts = last_location_log.details.split(': ')
                if len(parts) == 2:
                    coords = parts[1].split(', ')
                    if len(coords) == 2:
                        lat = float(coords[0])
                        lon = float(coords[1])
                        user_locations.append({
                            'id': user.id,
                            'username': user.username,
                            'role': user.role,
                            'lat': lat,
                            'lon': lon,
                            'last_update': last_location_log.created_at,
                        })
            except ValueError:
                pass

    # Get current user's last location
    current_user_location = None
    last_location_log = ActivityLog.objects.filter(
        user=request.user, action='LOCATION_UPDATE'
    ).order_by('-created_at').first()
    if last_location_log and last_location_log.details:
        # Parse "Location updated: lat, lon"
        try:
            parts = last_location_log.details.split(': ')
            if len(parts) == 2:
                coords = parts[1].split(', ')
                if len(coords) == 2:
                    lat = float(coords[0])
                    lon = float(coords[1])
                    current_user_location = {
                        'lat': lat,
                        'lon': lon,
                        'last_update': last_location_log.created_at,
                    }
        except ValueError:
            pass

    logs_qs = ActivityLog.objects.filter(user__role='EVALUATOR').select_related("user").order_by("-created_at")

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
        "CENRO/CENRO_dashboard.html",
        {
            "stats": stats,
            "users": users,
            "user_locations": user_locations,
            "current_user_location": current_user_location,
            "notifications": notifications,
            "unread_count": unread_count,
            "logs": page_obj.object_list,
            "page_obj": page_obj,
        },
    )


@login_required
@cache_control(no_cache=True, no_store=True, must_revalidate=True)
@user_passes_test(is_evaluator)
def evaluator_dashboard(request):
    stats = get_dashboard_stats()
    users = User.objects.filter(role__in=['CENRO', 'EVALUATOR'], last_login__isnull=False).order_by('-last_login')[:5]
    notifications, unread_count = get_unread_notifications(request)

    # Get current user's last location
    user_location = None
    last_location_log = ActivityLog.objects.filter(
        user=request.user, action='LOCATION_UPDATE'
    ).order_by('-created_at').first()
    if last_location_log and last_location_log.details:
        # Parse "Location updated: lat, lon"
        try:
            parts = last_location_log.details.split(': ')
            if len(parts) == 2:
                coords = parts[1].split(', ')
                if len(coords) == 2:
                    lat = float(coords[0])
                    lon = float(coords[1])
                    user_location = {
                        'lat': lat,
                        'lon': lon,
                        'last_update': last_location_log.created_at,
                    }
        except ValueError:
            pass

    logs_qs = ActivityLog.objects.filter(user__role__in=['CENRO', 'EVALUATOR']).select_related("user").order_by("-created_at")

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
        "EVALUATOR/EVALUATOR_dashboard.html",
        {
            "stats": stats,
            "users": users,
            "notifications": notifications,
            "unread_count": unread_count,
            "logs": page_obj.object_list,
            "page_obj": page_obj,
            "user_location": user_location,
        },
    )


@login_required
@user_passes_test(is_cenro)
def cenro_activitylogs(request):
    notifications, unread_count = get_unread_notifications(request)

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
    return render(request, "CENRO/CENRO_activitylogs.html", context)


@login_required
def cenro_reports(request):
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

    # Base querysets
    pending_reports = EnumeratorsReport.objects.filter(status="PENDING").select_related(
        "enumerator", "pa", "profile"
    )
    accepted_reports = EnumeratorsReport.objects.filter(status="ACCEPTED").select_related(
        "enumerator", "pa", "profile"
    )
    declined_reports = EnumeratorsReport.objects.filter(status="DECLINED").select_related(
        "enumerator", "pa", "profile"
    )

    # Filters
    dfrom = request.GET.get("from")
    dto = request.GET.get("to")

    if dfrom:
        pending_reports = pending_reports.filter(report_date__gte=dfrom)
        accepted_reports = accepted_reports.filter(report_date__gte=dfrom)
        declined_reports = declined_reports.filter(report_date__gte=dfrom)
    if dto:
        pending_reports = pending_reports.filter(report_date__lte=dto)
        accepted_reports = accepted_reports.filter(report_date__lte=dto)
        declined_reports = declined_reports.filter(report_date__lte=dto)

    # Get last login locations for CENRO users
    cenro_users = User.objects.filter(role='CENRO', is_approved=True, is_deactivated=False)
    cenro_locations = []
    for user in cenro_users:
        last_location_log = ActivityLog.objects.filter(
            user=user, action='LOCATION_UPDATE'
        ).order_by('-created_at').first()
        if last_location_log and last_location_log.details:
            try:
                parts = last_location_log.details.split(': ')
                if len(parts) == 2:
                    coords = parts[1].split(', ')
                    if len(coords) == 2:
                        lat = float(coords[0])
                        lon = float(coords[1])
                        cenro_locations.append({
                            'id': user.id,
                            'username': user.username,
                            'role': user.role,
                            'lat': lat,
                            'lon': lon,
                            'last_update': last_location_log.created_at,
                        })
            except ValueError:
                pass

    # Get last login locations for CENRO and EVALUATOR (excluding current user)
    cenro_evaluator_users = User.objects.filter(role__in=['CENRO', 'EVALUATOR'], is_approved=True, is_deactivated=False).exclude(id=request.user.id)
    user_locations = []
    for user in cenro_evaluator_users:
        last_location_log = ActivityLog.objects.filter(
            user=user, action='LOCATION_UPDATE'
        ).order_by('-created_at').first()
        if last_location_log and last_location_log.details:
            try:
                parts = last_location_log.details.split(': ')
                if len(parts) == 2:
                    coords = parts[1].split(', ')
                    if len(coords) == 2:
                        lat = float(coords[0])
                        lon = float(coords[1])
                        user_locations.append({
                            'id': user.id,
                            'username': user.username,
                            'role': user.role,
                            'lat': lat,
                            'lon': lon,
                            'last_update': last_location_log.created_at,
                        })
            except ValueError:
                pass

    notifications, unread_count = get_unread_notifications(request)

    return render(
        request,
        "CENRO/CENRO_reports.html",
        {
            "pending_reports": pending_reports,
            "accepted_reports": accepted_reports,
            "declined_reports": declined_reports,
            "user_locations": user_locations,
            "notifications": notifications,
            "unread_count": unread_count,
        },
    )


@login_required
def cenro_templates(request):
    return render(request, "CENRO/CENRO_templates.html")


# ----------------- PENRO Create Account -----------------
@login_required
def penro_create_account(request):
    notifications, unread_count = get_unread_notifications(request)

    # Handle manual account creation
    if request.method == "POST" and request.POST.get("action") == "create_account":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        role = request.POST.get("role")
        first_name = request.POST.get("first_name")
        last_name = request.POST.get("last_name")
        gender = request.POST.get("gender")
        id_number = request.POST.get("id_number")
        region = request.POST.get("region")

        if role not in ["CENRO", "EVALUATOR"]:
            messages.error(request, "Invalid role selected")
        elif not username:
            messages.error(request, "Username is required")
        elif User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists")
        elif not email:
            messages.error(request, "Email is required")
        elif User.objects.filter(email=email).exists():
            messages.error(request, "Email already exists")
        elif not id_number:
            messages.error(request, "ID Number is required")
        elif User.objects.filter(id_number=id_number).exists():
            messages.error(request, "ID Number already exists")
        else:
            try:
                user = User.objects.create(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    gender=gender,
                    role=role,
                    password=make_password(password),
                    id_number=id_number,
                    region=region,
                    is_approved=False,
                )

                # Send notification to admins about new account created
                for admin in User.objects.filter(role__in=['ADMIN', 'SUPER_ADMIN']):
                    Notification.objects.create(
                        user=admin, message=f"New {role} account created: {username} - Pending approval"
                    )

                ActivityLog.objects.create(
                    user=request.user,
                    action="CREATE",
                    details=f"Created account for {username} ({role}) - ID: {id_number}",
                    ip_address=request.META.get("REMOTE_ADDR"),
                )

                messages.success(request, f"Account for {username} created successfully. It is pending approval by the admin.")
                return redirect("penro_create_account")
            except Exception as e:
                messages.error(request, f"Error creating account: {str(e)}")
                return redirect("penro_create_account")

    return render(request, "PENRO/PENRO_create_account.html", {
        "notifications": notifications,
        "unread_count": unread_count,
    })


# ----------------- PENRO Reports -----------------
@login_required
def penro_reports(request):
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

    # Base querysets
    pending_reports = EnumeratorsReport.objects.filter(status="PENDING").select_related(
        "enumerator", "pa", "profile"
    )
    accepted_reports = EnumeratorsReport.objects.filter(status="ACCEPTED").select_related(
        "enumerator", "pa", "profile"
    )
    declined_reports = EnumeratorsReport.objects.filter(status="DECLINED").select_related(
        "enumerator", "pa", "profile"
    )

    # Filters
    dfrom = request.GET.get("from")
    dto = request.GET.get("to")

    if dfrom:
        pending_reports = pending_reports.filter(report_date__gte=dfrom)
        accepted_reports = accepted_reports.filter(report_date__gte=dfrom)
        declined_reports = declined_reports.filter(report_date__gte=dfrom)
    if dto:
        pending_reports = pending_reports.filter(report_date__lte=dto)
        accepted_reports = accepted_reports.filter(report_date__lte=dto)
        declined_reports = declined_reports.filter(report_date__lte=dto)

    # Get last login locations for CENRO users
    cenro_users = User.objects.filter(role='CENRO', is_approved=True, is_deactivated=False)
    cenro_locations = []
    for user in cenro_users:
        last_location_log = ActivityLog.objects.filter(
            user=user, action='LOCATION_UPDATE'
        ).order_by('-created_at').first()
        if last_location_log and last_location_log.details:
            try:
                parts = last_location_log.details.split(': ')
                if len(parts) == 2:
                    coords = parts[1].split(', ')
                    if len(coords) == 2:
                        lat = float(coords[0])
                        lon = float(coords[1])
                        cenro_locations.append({
                            'id': user.id,
                            'username': user.username,
                            'role': user.role,
                            'lat': lat,
                            'lon': lon,
                            'last_update': last_location_log.created_at,
                        })
            except ValueError:
                pass

    # Get current user's last location
    current_user_location = None
    last_location_log = ActivityLog.objects.filter(
        user=request.user, action='LOCATION_UPDATE'
    ).order_by('-created_at').first()
    if last_location_log and last_location_log.details:
        try:
            parts = last_location_log.details.split(': ')
            if len(parts) == 2:
                coords = parts[1].split(', ')
                if len(coords) == 2:
                    lat = float(coords[0])
                    lon = float(coords[1])
                    current_user_location = {
                        'lat': lat,
                        'lon': lon,
                        'last_update': last_location_log.created_at,
                    }
        except ValueError:
            pass

    notifications, unread_count = get_unread_notifications(request)

    return render(
        request,
        "PENRO/PENRO_reports.html",
        {
            "pending_reports": pending_reports,
            "accepted_reports": accepted_reports,
            "declined_reports": declined_reports,
            "cenro_locations": cenro_locations,
            "current_user_location": current_user_location,
            "notifications": notifications,
            "unread_count": unread_count,
        },
    )


# ----------------- PENRO Activity Logs -----------------
@login_required
def penro_activity_logs(request):
    notifications, unread_count = get_unread_notifications(request)

    logs_qs = ActivityLog.objects.filter(user__role__in=['CENRO', 'EVALUATOR']).select_related("user").order_by("-created_at")

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
    return render(request, "PENRO/PENRO_activitylogs.html", context)


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


# ----------------- Update Location API -----------------
@login_required
def update_location(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            latitude = data.get('latitude')
            longitude = data.get('longitude')

            if latitude and longitude:
                # Log the location update
                ActivityLog.objects.create(
                    user=request.user,
                    action="LOCATION_UPDATE",
                    details=f"Location updated: {latitude}, {longitude}",
                    ip_address=request.META.get("REMOTE_ADDR"),
                )
                return JsonResponse({"status": "success", "message": "Location updated successfully"})
            else:
                return JsonResponse({"status": "error", "message": "Invalid coordinates"}, status=400)
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=500)
    return JsonResponse({"status": "error", "message": "Method not allowed"}, status=405)


# ----------------- Welcome API -----------------
def welcome_api(request):
    logging.info(f"Request received: {request.method} {request.path}")
    return JsonResponse({"message": "Welcome to DENRO API!"})


# ----------------- CSRF Failure -----------------
def csrf_failure(request, reason=""):
    return render(request, '403.html', status=403)


# ----------------- Forbidden Access -----------------
def forbidden_view(request, exception=None):
    response = render(request, '403.html', status=403)
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    return response


# ----------------- Forbidden Access -----------------
def forbidden_view(request, exception=None):
    response = render(request, '403.html', status=403)
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    return response


# ----------------- Forbidden Access -----------------
def forbidden_view(request, exception=None):
    response = render(request, '403.html', status=403)
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    return response
