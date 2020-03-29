# Generated by Django 3.0.4 on 2020-03-29 09:35

from decimal import Decimal
from django.db import migrations, models
import django.db.models.deletion
import zazi.apps.loan.enums
import zazi.core.utils


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0015_resetpincode'),
    ]

    operations = [
        migrations.CreateModel(
            name='LoanAccount',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('account_id', models.CharField(default=zazi.core.utils.generate_id, max_length=25)),
                ('amount_disbursed', models.DecimalField(blank=True, decimal_places=4, default=Decimal('0.0'), max_digits=18)),
                ('date_disbursed', models.DateTimeField(blank=True, null=True)),
                ('last_repayment_date', models.DateTimeField(blank=True, null=True)),
                ('last_interest_accrual_date', models.DateTimeField(blank=True, null=True)),
                ('last_balance_update_date', models.DateTimeField(null=True)),
                ('status', models.PositiveSmallIntegerField(choices=[(0, 'CLEAN'), (1, 'PENDING_DISBURSEMENT'), (2, 'DISBURSED'), (3, 'ACTIVE'), (4, 'PAID_OFF'), (5, 'IN_ARREARS'), (6, 'DEFAULTED'), (7, 'WRITTEN_OFF'), (8, 'DORMANT'), (9, 'CLOSED')], default=zazi.apps.loan.enums.LoanStatus['PENDING_DISBURSEMENT'])),
                ('is_active', models.BooleanField(default=False)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='LoanProduct',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=25)),
                ('product_id', models.CharField(default=zazi.core.utils.generate_id, max_length=25, null=True)),
                ('payment_platform', models.PositiveSmallIntegerField(choices=[(1, 'MPESA'), (2, 'PESA_LINK'), (3, 'AIRTEL')])),
                ('product_type', models.PositiveSmallIntegerField(choices=[(1, 'REVOLVING_LOAN'), (2, 'TERM_LOAN')])),
                ('max_loan_limit', models.DecimalField(decimal_places=4, default=0, max_digits=18)),
                ('interest_method', models.PositiveSmallIntegerField(choices=[(1, 'REDUCING_BALANCE')])),
                ('interest_rate', models.PositiveSmallIntegerField(default=0)),
                ('interest_rate_accrual_schedule', models.PositiveSmallIntegerField(choices=[(1, 'DAILY'), (2, 'WEEKLY'), (3, 'MONTHLY')])),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='LoanTransaction',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('transaction_id', models.CharField(default=zazi.core.utils.generate_id, max_length=30, unique=True)),
                ('transaction_type', models.PositiveSmallIntegerField(choices=[(1, 'LOAN_DISBURSAL'), (2, 'LOAN_REPAYMENT'), (3, 'INTEREST_ACCRUAL'), (4, 'PENALTY_ACCRUAL'), (5, 'FEES_ACCRUAL'), (6, 'LOAN_LIABILITY')], null=True)),
                ('amount', models.DecimalField(decimal_places=2, default=Decimal('0.0'), max_digits=7)),
                ('initiated_at', models.DateTimeField(null=True)),
                ('processed_at', models.DateTimeField(null=True)),
                ('posted_at', models.DateTimeField(null=True)),
                ('status', models.PositiveSmallIntegerField(choices=[(1, 'PENDING_PROCESSING'), (2, 'PROCESSED'), (3, 'POSTED_TO_LOANS_LEDGER')], null=True)),
                ('loan_account', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='loan_transactions', to='loan.LoanAccount')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='LoanProfile',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('profile_id', models.CharField(default=zazi.core.utils.generate_id, max_length=25)),
                ('effective_loan_limit', models.DecimalField(decimal_places=4, default=0, max_digits=18)),
                ('status', models.PositiveSmallIntegerField(choices=[(0, 'CLEAN'), (1, 'PERFORMING'), (2, 'DELINQUENT'), (3, 'BLACKLISTED'), (4, 'SUSPENDED')])),
                ('user_account', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='loan_profile', to='users.UserAccount')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='LoanApplication',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('application_id', models.CharField(default=zazi.core.utils.generate_id, max_length=25)),
                ('payment_platform', models.PositiveSmallIntegerField(choices=[(1, 'MPESA'), (2, 'PESA_LINK'), (3, 'AIRTEL')])),
                ('amount', models.DecimalField(decimal_places=2, max_digits=7)),
                ('applied_at', models.DateTimeField()),
                ('approved', models.NullBooleanField()),
                ('approved_at', models.DateTimeField(null=True)),
                ('approved_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='users.UserAccount')),
                ('loan_profile', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='loan.LoanProfile')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='LoanAccountBalance',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('entry_id', models.CharField(default=zazi.core.utils.generate_id, max_length=25)),
                ('principal_paid_bf', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('interest_paid_bf', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('fees_paid_bf', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('penalties_paid_bf', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('principal_due_bf', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('interest_accrued_bf', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('fees_accrued_bf', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('penalties_accrued_bf', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('liability_credit_balance_bf', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('liability_debit_balance_bf', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('principal_paid', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('interest_paid', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('fees_paid', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('penalties_paid', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('principal_due', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('interest_accrued', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('fees_accrued', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('penalties_accrued', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('liability_credit_balance', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('liability_debit_balance', models.DecimalField(blank=True, decimal_places=2, default=Decimal('0.0'), max_digits=18)),
                ('balance_as_at', models.DateTimeField(null=True)),
                ('is_current', models.NullBooleanField()),
                ('loan_account', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='account_balances', to='loan.LoanAccount')),
                ('previous_balance', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='loan.LoanAccountBalance')),
            ],
            options={
                'db_table': 'loan_account_balance',
            },
        ),
        migrations.AddField(
            model_name='loanaccount',
            name='loan_profile',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='loan_accounts', to='loan.LoanProfile'),
        ),
        migrations.AddField(
            model_name='loanaccount',
            name='product',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='loan.LoanProduct'),
        ),
    ]