from django.db import models

class Machine(models.Model):
    machine_id = models.CharField(max_length=50, unique=True)
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('maintenance', 'Maintenance'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    def __str__(self):
        return f"Machine {self.machine_id} - {self.status}"
