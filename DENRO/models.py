from django.db import models


class User(models.Model):
    class GenderChoices(models.TextChoices):
        MALE = 'Male'
        FEMALE = 'Female'
        OTHER = 'Other'

    class RoleChoices(models.TextChoices):
        SUPER_ADMIN = 'Super Admin'
        ADMIN = 'Admin'
        PENRO = 'PENRO'
        CENRO = 'CENRO'
        EVALUATOR = 'Evaluator'

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=6, choices=GenderChoices.choices)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    region = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=RoleChoices.choices)
    username = models.CharField(max_length=50, unique=True)
    password = models.CharField(max_length=255)
    profile_pic = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return (
            f"E-ID: {self.id}, Firstname: {self.first_name}, Lastname: {self.last_name}, "
            f"Gender: {self.gender}, Cp.no.: {self.phone_number}, Region: {self.region}, "
            f"Role: {self.role}, Username: {self.username}, Password: ********, "
            f"Profile: {self.profile_pic}"
        )


class GeoTaggedImage(models.Model):
    image = models.CharField(max_length=255)
    qr_code = models.CharField(max_length=255, unique=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    location = models.CharField(max_length=255)
    captured_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='captured_images')
    captured_at = models.DateTimeField(auto_now_add=True)


class EvaluatorsTrackRoute(models.Model):
    pointer = models.ForeignKey(GeoTaggedImage, on_delete=models.CASCADE)
    captured_by = models.ForeignKey(User, on_delete=models.CASCADE)


class ProtectedArea(models.Model):
    name = models.CharField(max_length=255)


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
    latitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    area_covered = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    pa_management_zone = models.CharField(max_length=100, blank=True, null=True)
    establishment_status = models.CharField(max_length=100, blank=True, null=True)
    easement = models.BooleanField(default=False)


class TypeOfEstablishment(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)


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


class AttestationNotation(models.Model):
    attested_by_name = models.CharField(max_length=255, blank=True, null=True)
    attested_by_position = models.CharField(max_length=100, blank=True, null=True)
    attested_by_signature = models.CharField(max_length=255, blank=True, null=True)

    noted_by_name = models.CharField(max_length=255, blank=True, null=True)
    noted_by_position = models.CharField(max_length=100, blank=True, null=True)
    noted_by_signature = models.CharField(max_length=255, blank=True, null=True)


class EnumeratorsReport(models.Model):
    report_date = models.DateField()
    pa = models.ForeignKey(ProtectedArea, on_delete=models.CASCADE)
    profile = models.ForeignKey(LeasedPropertyProfile, on_delete=models.CASCADE)
    establishment = models.ForeignKey(TypeOfEstablishment, on_delete=models.CASCADE)
    lgu_permit = models.ForeignKey(PermitsLGU, on_delete=models.SET_NULL, blank=True, null=True)
    denr_emb = models.ForeignKey(PermitsDENREMB, on_delete=models.SET_NULL, blank=True, null=True)
    attestation = models.ForeignKey(AttestationNotation, on_delete=models.SET_NULL, blank=True, null=True)
    enumerator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enumerator_reports')
    informant = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='informant_reports')
    geo_tag_image = models.ForeignKey(GeoTaggedImage, on_delete=models.SET_NULL, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
