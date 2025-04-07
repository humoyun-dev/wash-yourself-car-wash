from django.db import models

class Service(models.Model):
    service_name = models.CharField(max_length=100)
    price_per_minute = models.DecimalField(max_digits=10, decimal_places=2)
    icon = models.CharField(max_length=100, help_text="Icon class name, e.g. 'fa-solid fa-car'")

    def __str__(self):
        return f"{self.service_name} - {self.price_per_minute} UZS/min"
