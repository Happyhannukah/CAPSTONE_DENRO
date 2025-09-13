import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CAPSTONE_DENRO.settings')
django.setup()

from DENRO.models import User, ActivityLog

cenro_users = User.objects.filter(role='CENRO', is_approved=True, is_deactivated=False)
print('CENRO users:', list(cenro_users.values('username')))
for user in cenro_users:
    logs = ActivityLog.objects.filter(user=user, action='LOCATION_UPDATE').order_by('-created_at').first()
    print(f'{user.username}: {logs.details if logs else None}')
