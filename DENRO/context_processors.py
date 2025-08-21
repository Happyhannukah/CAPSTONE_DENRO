# yourapp/context_processors.py
from __future__ import annotations

import re
from typing import Dict, Tuple, Any


def _normalize_role(raw: Any) -> str:
    """
    Normalize any role value (e.g. 'Super Admin', 'super admin', 'PENRO')
    into an uppercase code without spaces/punctuation, e.g.:
      'Super Admin' -> 'SUPERADMIN'
      'admin'       -> 'ADMIN'
      'penro'       -> 'PENRO'
    """
    if raw is None:
        return ""
    text = str(raw).upper()
    # Keep only letters to make 'SUPER ADMIN' => 'SUPERADMIN'
    return re.sub(r"[^A-Z]", "", text)


def nav_templates(request) -> Dict[str, str]:
    """
    Provide template paths for the current user's top/side navigation,
    based on their role. These keys become available in all templates:

      - top_nav_template
      - side_nav_template
      - user_role          (normalized code, e.g. 'SUPERADMIN')

    Usage in base.html:
        {% include side_nav_template %}
        {% include top_nav_template %}

    Resolution order for role:
      1) request.user.profile.role (if present)
      2) request.user.role         (custom user model)
      3) request.session['role']   (string saved at login)
      4) 'GUEST' (fallback)
    """

    # Try multiple places to find the role without raising AttributeError
    role_from_profile = getattr(getattr(request.user, "profile", None), "role", None)
    role_from_user = getattr(request.user, "role", None)
    role_from_session = request.session.get("role")  # e.g. "super admin"

    # Pick first non-empty source; default to 'GUEST'
    raw_role = role_from_profile or role_from_user or role_from_session or "GUEST"

    # Normalize to a compact uppercase code (e.g., 'SUPERADMIN')
    role_code = _normalize_role(raw_role)

    # Map normalized codes to include template paths
    # Adjust these paths if you store the partials in a different folder.
    mapping: Dict[str, Tuple[str, str]] = {
        # SUPER ADMIN
        "SUPERADMIN": (
            "includes/topnav/topnav_superadmin.html",
            "includes/sidenav/sidenav_superadmin.html",
        ),
        # ADMIN
        "ADMIN": (
            "includes/topnav/topnav_admin.html",
            "includes/sidenav/sidenav_admin.html",
        ),
        # PENRO
        "PENRO": (
            "includes/topnav/topnav_penro.html",
            "includes/sidenav/sidenav_penro.html",
        ),
        # CENRO
        "CENRO": (
            "includes/topnav/topnav_cenro.html",
            "includes/sidenav/sidenav_cenro.html",
        ),
        # EVALUATOR (only if/when you add these partials)
        "EVALUATOR": (
            "includes/topnav/topnav_evaluator.html",
            "includes/sidenav/sidenav_evaluator.html",
        ),
        # GUEST / default fallback (shows Admin style by default)
        "GUEST": (
            "includes/topnav/topnav_admin.html",
            "includes/sidenav/sidenav_admin.html",
        ),
    }

    top, side = mapping.get(role_code, mapping["GUEST"])

    return {
        "top_nav_template": top,
        "side_nav_template": side,
        "user_role": role_code,
    }
