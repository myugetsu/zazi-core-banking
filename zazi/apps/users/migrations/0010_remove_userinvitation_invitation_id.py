# Generated by Django 2.2.3 on 2019-12-22 14:00

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0009_auto_20191222_1656'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='userinvitation',
            name='invitation_id',
        ),
    ]
