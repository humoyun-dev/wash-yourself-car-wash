from django.contrib import admin
from .models import Service

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('service_name', 'price_per_minute', 'icon')
    search_fields = ('service_name', 'icon')
    list_filter = ('price_per_minute',)
