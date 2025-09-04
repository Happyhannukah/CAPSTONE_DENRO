from django.contrib import messages
from django.shortcuts import redirect
from django.contrib.auth.hashers import check_password, make_password, identify_hasher
from .models import User


def login_user(request):
    if request.method == "POST":
        username = (request.POST.get("username") or "").strip()
        password = request.POST.get("password") or ""

        try:
            user = User.objects.get(username=username)

            # Detect if stored password is a Django hash
            is_hashed = True
            try:
                identify_hasher(user.password)
            except Exception:
                is_hashed = False

            # Validate password (supports hashed + legacy plain text)
            valid = (
                check_password(password, user.password)
                if is_hashed
                else (password == user.password)
            )

            if valid:
                # Upgrade legacy plain text to a secure hash
                if not is_hashed:
                    user.password = make_password(password)
                    user.save(update_fields=["password"])

                request.session["user_id"] = user.id
                request.session["username"] = user.username
                request.session["role"] = (user.role or "").strip().lower()

                role = request.session["role"]
                print(f"✅ Login success: role = '{role}'")

                # Use named URLs for redirects
                if role == "super admin":
                    return redirect("SA-dashboard")
                elif role == "admin":
                    return redirect("Admin-dashboard")
                elif role == "penro":
                    return redirect("PENRO-dashboard")
                elif role == "cenro":
                    return redirect("CENRO-dashboard")
                else:
                    messages.error(request, "Undefined role. Contact support.")
                    request.session.flush()
                    return redirect("login")
            else:
                messages.error(request, "Incorrect password.")
                return redirect("login")

        except User.DoesNotExist:
            messages.error(request, "Username not found.")
            return redirect("login")

    # Fallback (non-POST)
    return redirect("login")
