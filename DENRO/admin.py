# from django.contrib import admin
# from .models import User
# # Register your models here.
# admin.site.register(User)


# # @admin.register(User)
# # class UserAdmin(admin.ModelAdmin):
# #     list_display = ("username", "email", "role", "is_staff", "is_superuser")
# #     list_filter = ("role", "is_staff", "is_superuser")
# #     search_fields = ("username", "email")

# from django.contrib import admin
# from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
# from .models import User

# @admin.register(User)
# class UserAdmin(BaseUserAdmin):
#     # Fields to show in the list view
#     list_display = ("username", "email", "role", "is_staff", "is_superuser")
#     list_filter = ("role", "is_staff", "is_superuser")
#     search_fields = ("username", "email")

#     fieldsets = (
#         (None, {"fields": ("username", "password")}),
#         ("Personal info", {"fields": ("first_name", "last_name", "email", "gender", "phone_number", "region", "profile_pic")}),
#         ("Permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
#         ("Important dates", {"fields": ("last_login", "date_joined")}),
#     )

#     add_fieldsets = (
#         (None, {
#             "classes": ("wide",),
#             "fields": ("username", "email", "password1", "password2", "role"),
#         }),
#     )

#     ordering = ("username",)
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        "username",
        "email",
        "role",
        "is_staff",
        "is_superuser",
        "is_approved",
    )  # 👈 added
    list_filter = ("role", "is_staff", "is_superuser", "is_approved")  # 👈 added
    search_fields = ("username", "email")

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            "Personal info",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "email",
                    "gender",
                    "phone_number",
                    "region",
                    "profile_pic",
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "role",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "is_approved",
                    "groups",
                    "user_permissions",
                )
            },
        ),  # 👈 added is_approved
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "email",
                    "password1",
                    "password2",
                    "role",
                    "is_approved",
                ),  # 👈 added is_approved
            },
        ),
    )

    ordering = ("username",)
