# TODO List for Copying PENRO Sidebar Design to CENRO

- [x] Edit `DENRO/templates/includes/sidenav/sidenav_cenro.html` to match PENRO structure: Change to `<div class="sidebar">`, add `<h2>DENRO</h2>`, use direct `<a>` links for CENRO URLs (Dashboard, Reports, Activity Logs, Templates, Profile, Logout), remove icons and ul structure.

# TODO List for Creating Evaluator Sidebar

- [x] Create `DENRO/templates/includes/sidenav/sidenav_evaluator.html` with PENRO design: `<div class="sidebar">`, `<h2>DENRO</h2>`, links for Dashboard, Reports, Profile, Logout.
- [x] Fix URL in sidenav_evaluator.html: Change 'evaluator_reports' to 'CENRO_reports' to use existing reports view.
- [x] Create `DENRO/templates/EVALUATOR/EVALUATOR_dashboard.html` with dashboard template including evaluator sidebar.
- [x] Add `evaluator_dashboard` view in `views.py` with context for stats, users, notifications, logs.
- [x] Add URL pattern for `evaluator_dashboard` in `urls.py`.
- [x] Update login redirection in `login_view` and `verify_2fa` to redirect EVALUATOR to `evaluator_dashboard`.
