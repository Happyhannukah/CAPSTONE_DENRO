from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth import get_user_model
from django.conf import settings

# User = get_user_model()




class ActivityAction(models.TextChoices):
    LOGIN   = "LOGIN", "Login"
    LOGOUT  = "LOGOUT", "Logout"
    CREATE  = "CREATE", "Create"
    UPDATE  = "UPDATE", "Update"
    DELETE  = "DELETE", "Delete"
    APPROVE = "APPROVE", "Approve"
    REJECT  = "REJECT", "Reject"
    ERROR   = "ERROR", "Error"
    REPORT_CENRO = "REPORT_CENRO", "CENRO Report"
    REPORT_PENRO = "REPORT_PENRO", "PENRO Report"

class ActivityLog(models.Model):
    user        = models.ForeignKey(
        settings.AUTH_USER_MODEL,              # ✅ use the string via settings
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="activity_logs",
    )
    action      = models.CharField(max_length=16, choices=ActivityAction.choices)
    details     = models.TextField(blank=True, null=True)
    ip_address  = models.GenericIPAddressField(blank=True, null=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["action"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        u = self.user.username if self.user else "Anonymous"
        return f"[{self.created_at:%Y-%m-%d %H:%M:%S}] {u} {self.action}"






class User(AbstractUser):
    class RoleChoices(models.TextChoices):
        SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
        ADMIN = "ADMIN", "Admin"
        PENRO = "PENRO", "PENRO"
        CENRO = "CENRO", "CENRO"
        EVALUATOR = "EVALUATOR", "Evaluator"

    email = models.EmailField()
    role = models.CharField(
        max_length=20, choices=RoleChoices.choices, default=RoleChoices.ADMIN
    )
    is_approved = models.BooleanField(default=False)
    is_rejected = models.BooleanField(default=False)
    is_deactivated = models.BooleanField(default=False)

    # Optional profile fields
    gender = models.CharField(max_length=10, choices=[('Male', 'Male'), ('Female', 'Female')], blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    region = models.CharField(max_length=100, blank=True, null=True)
    profile_pic = models.CharField(max_length=255, blank=True, null=True)
    id_number = models.CharField(max_length=50, blank=True, null=True, unique=True)

    def __str__(self):
        return f"{self.username} ({self.role}) - Approved: {self.is_approved}"


class GeoTaggedImage(models.Model):
    image = models.CharField(max_length=255)
    qr_code = models.CharField(max_length=255, unique=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    location = models.CharField(max_length=255)
    captured_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="captured_images"
    )
    captured_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image {self.id} - {self.location}"


class EvaluatorsTrackRoute(models.Model):
    pointer = models.ForeignKey(GeoTaggedImage, on_delete=models.CASCADE)
    captured_by = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"Route by {self.captured_by}"


class ProtectedArea(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class LeasedPropertyProfile(models.Model):
    report_date = models.DateField()
    proponent_name = models.CharField(max_length=255)
    contact_no = models.CharField(max_length=50, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    lot_status = models.CharField(max_length=100, blank=True, null=True)
    land_classification_status = models.CharField(max_length=100, blank=True, null=True)
    title_no = models.IntegerField(blank=True, null=True)
    lot_no = models.IntegerField(blank=True, null=True)
    lot_owner = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.DecimalField(
        max_digits=10, decimal_places=7, blank=True, null=True
    )
    longitude = models.DecimalField(
        max_digits=10, decimal_places=7, blank=True, null=True
    )
    area_covered = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )
    pa_management_zone = models.CharField(max_length=100, blank=True, null=True)
    establishment_status = models.CharField(max_length=100, blank=True, null=True)
    easement = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.proponent_name} - {self.location}"


class TypeOfEstablishment(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class PermitsLGU(models.Model):
    mayors_permit = models.BooleanField(default=False)
    mp_number = models.IntegerField(blank=True, null=True)
    mpdi = models.DateField(blank=True, null=True)
    mped = models.DateField(blank=True, null=True)

    business_permit = models.BooleanField(default=False)
    bp_number = models.IntegerField(blank=True, null=True)
    bpdi = models.DateField(blank=True, null=True)
    bped = models.DateField(blank=True, null=True)

    building_permit = models.BooleanField(default=False)
    bldg_number = models.IntegerField(blank=True, null=True)
    bldgdi = models.DateField(blank=True, null=True)
    bldged = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"Permits LGU #{self.id}"


class PermitsDENREMB(models.Model):
    pamb_resolution = models.BooleanField(default=False)
    pamb_resolution_no = models.IntegerField(blank=True, null=True)
    pamb_di = models.DateField(blank=True, null=True)

    sapa = models.BooleanField(default=False)
    sapa_no = models.IntegerField(blank=True, null=True)
    sapa_di = models.DateField(blank=True, null=True)

    pacbrma = models.BooleanField(default=False)
    pacbrma_no = models.IntegerField(blank=True, null=True)
    pacbrma_di = models.DateField(blank=True, null=True)

    ecc = models.BooleanField(default=False)
    ecc_no = models.IntegerField(blank=True, null=True)
    ecc_di = models.DateField(blank=True, null=True)

    discharge_permit = models.BooleanField(default=False)
    dp_no = models.IntegerField(blank=True, null=True)
    dp_di = models.DateField(blank=True, null=True)

    permit_to_operate = models.BooleanField(default=False)
    pto_no = models.IntegerField(blank=True, null=True)
    pto_di = models.DateField(blank=True, null=True)

    emb_rp = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"DENR EMB Permits #{self.id}"


class AttestationNotation(models.Model):
    attested_by_name = models.CharField(max_length=255, blank=True, null=True)
    attested_by_position = models.CharField(max_length=100, blank=True, null=True)
    attested_by_signature = models.CharField(max_length=255, blank=True, null=True)

    noted_by_name = models.CharField(max_length=255, blank=True, null=True)
    noted_by_position = models.CharField(max_length=100, blank=True, null=True)
    noted_by_signature = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Attestation #{self.id}"


class EnumeratorsReport(models.Model):
    class StatusChoices(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        DECLINED = "DECLINED", "Declined"

    report_date = models.DateField()
    pa = models.ForeignKey(ProtectedArea, on_delete=models.CASCADE)
    profile = models.ForeignKey(LeasedPropertyProfile, on_delete=models.CASCADE)
    establishment = models.ForeignKey(TypeOfEstablishment, on_delete=models.CASCADE)
    lgu_permit = models.ForeignKey(
        PermitsLGU, on_delete=models.SET_NULL, blank=True, null=True
    )
    denr_emb = models.ForeignKey(
        PermitsDENREMB, on_delete=models.SET_NULL, blank=True, null=True
    )
    attestation = models.ForeignKey(
        AttestationNotation, on_delete=models.SET_NULL, blank=True, null=True
    )
    enumerator = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="enumerator_reports"
    )
    informant = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="informant_reports",
    )
    geo_tag_image = models.ForeignKey(
        GeoTaggedImage, on_delete=models.SET_NULL, blank=True, null=True
    )
    status = models.CharField(
        max_length=10,
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING,
    )
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Report {self.id} - {self.report_date}"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # kinsa nag-register
    message = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)  # para ma-mark read once nakita

    def __str__(self):
        return f"Notification for {self.user.username} - {self.message}"
