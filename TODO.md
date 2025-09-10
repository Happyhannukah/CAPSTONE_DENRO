# TODO: Add Dependent Region Dropdown for PENRO and CENRO in Create Account Form

## Tasks:
- [x] Update admin_activitylogs.html to add region dropdown (initially hidden)
- [x] Add JavaScript to show region dropdown when PENRO is selected
- [x] Update admin_activity_logs view in views.py to save region field
- [x] Add CENRO region options: Tagbiliran, Cebu, Argao, Talibon, Ayungon, Dumaguete
- [x] Test the form functionality

## Details:
- When role is PENRO, show region dropdown with options: Bohol, Cebu, Siquijor, Negros Oriental
- When role is CENRO, show region dropdown with options: Tagbiliran, Cebu, Argao, Talibon, Ayungon, Dumaguete
- Region field is already in User model
- Form is in DENRO/templates/ADMIN/admin_activitylogs.html
- View is admin_activity_logs in DENRO/views.py
