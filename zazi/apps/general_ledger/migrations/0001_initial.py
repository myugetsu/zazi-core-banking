# Generated by Django 3.0.4 on 2020-03-29 09:35

from decimal import Decimal
from django.db import migrations, models
import django.db.models.deletion
import zazi.core.utils


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='GLAccount',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=50)),
                ('code', models.CharField(max_length=50, unique=True)),
                ('account_type', models.PositiveIntegerField(choices=[(1, 'Asset'), (2, 'Liability'), (3, 'Equity/Capital'), (4, 'Revenue/Income'), (5, 'Expense')])),
            ],
            options={
                'db_table': 'gl_account',
                'ordering': ['code'],
            },
        ),
        migrations.CreateModel(
            name='GLPeriodClosure',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('closure_id', models.CharField(default=zazi.core.utils.generate_id, max_length=25)),
                ('period_start', models.DateTimeField(null=True)),
                ('period_end', models.DateTimeField()),
                ('previous_period', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='general_ledger.GLPeriodClosure')),
            ],
            options={
                'db_table': 'gl_period_closure',
            },
        ),
        migrations.CreateModel(
            name='GLTransactionEntry',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('entry_id', models.CharField(default=zazi.core.utils.generate_id, max_length=25)),
                ('entry_type', models.PositiveSmallIntegerField(choices=[(0, 'DEBIT'), (1, 'CREDIT')], null=True)),
                ('balance_bf', models.DecimalField(decimal_places=4, default=Decimal('0.0'), max_digits=18)),
                ('balance', models.DecimalField(decimal_places=4, default=Decimal('0.0'), max_digits=18)),
                ('entry_date', models.DateTimeField(null=True)),
                ('closure_group', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='transaction_entries', to='general_ledger.GLPeriodClosure')),
                ('gl_account', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='general_ledger.GLAccount')),
            ],
            options={
                'db_table': 'gl_transaction_entry',
            },
        ),
    ]
