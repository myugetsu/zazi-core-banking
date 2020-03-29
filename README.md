![Zazi header](https://zazi-assets.s3.us-east-1.amazonaws.com/zazi.png)

# Zazi OpenBanking Platform (Community Edition)

Zazi is a minimalistic open-source core/open banking platform, built on top of Django, built for developers, for digital SACCOs and FinTech startups. Automate all your payment needs with our simple to use API.

Supported payment providers: 
M-Pesa 

Proposed payment providers to support: 
Airtel Money
T-Kash
Equitel
Vooma
PesaLink


## Philosophy

Many startups/engineers find it painful to create the backend technology around their payment wallets/gateways in a way it can communicate to Bankers/Financial Analysts as it requires deep banking domain knowledge.

We see this as a niche market to help reach their targets.

Zazi gives you full control over all your users' data, while letting anyone easily perform powerful analytics.

It can be used for:
1. Mpesa Loans backend (Disbursal & Repayment)
2. Mpesa Proxy
3. Digital cash management

Features we want to add:
1. User management
2. API Layer (Django Rest Framework)
2. API Management UI
3. Financial Reports; {Balance Sheet, PL Statement, General/Loan Journal}
4. Complete the loan lifecycle
5. Savings Product

We are aware that alternatives exists; Mojaloop(https://mojaloop.io/), Mifos(https://mifos.org/), Mambu(http://mambu.com/) etc., but most of the alternatives are either too complicated, expensive or do not solve a minimalist's need.

## Architecture

A core banking platform puts at its center the Customer, thus, the tendency to be a CRM, but this is more of a transactional/analytical platform. This platform is meant to interface with other cloud platforms in a Microservices manner.

We put at the center the usefulness of Django settings modules to separate the project into multiple Microservices. 

The various modules/apps bundled at this point are:
1. *Banking:* {for bank balances, integration with external payment platforms}
2. *General Ledger:* Keep track of balances of all major modules as the source of truth.
3. *Identity:* Keep track of the user details collected from various modules under one place.
4. *Loan:* Keep track of all loan accounts and possible
5. *Loan Ledger:* An Accounting submodule that builds on top of loans module to track transactions and their resulting effects on the balances.
6. *Mpesa:* Built on top of mpesa-py(https://github.com/Arlus/mpesa-py/) to provide an interface to M-Pesa payments
7. *Mpesa Loan:* Builds on top of the Mpesa module and Loan module providing a link between the two modules
8. *Mpesa Proxy:* Allows you to expose a proxy on the public subnet without exposing the whole zazi instance; redirects the requests to your instance of zazi.
9. *SMS:* A module to send and receive SMS...

The Architecture is quite solid, leaving you to focus on how to secure it.

## Why ZAZI?

Zazi is the only <strong>product-focused</strong> open source core banking platform, with a strong focus on M-Pesa.


## Development (Mac)

### Running backend (Django)

1. Make sure you have python 3 installed `python3 --version`
2. Make sure you have postgres installed `brew install postgres`
3. Start postgres, run `brew services start postgresql`
4. Open `postgres` database:
```
CREATE ROLE zazi WITH LOGIN ENCRYPTED PASSWORD 'zazi';
CREATE DATABASE ZAZI owner zazi;
ALTER USER tujisort CREATEDB;
ALTER USER zazi CREATEDB;
```
5. Navigate into the correct folder `cd zazi-core-banking`
6. Run `python3 -m venv env` (creates virtual environment in current direction called 'env')
7. Run `source env/bin/activate` (activates virtual environment)
8. Run `pip install -r requirements.txt`. If you have problems with this step (TLS/SSL error), then run `~ brew update && brew upgrade` followed by `python3 -m pip install --upgrade pip`, then retry the requirements.txt install.
9. Create the environment file; `cp zazi/settings/.env.example zazi/settings/.env`
9. Run migrations `python3 manage.py migrate`
10. Run `python3 manage.py runserver`


## Open source / Paid

This repo is entirely [MIT licensed](/LICENSE). We charge for things like user permissioning and auditability, a/b testing and dedicated support. Please email onesmus.mukewa@strathmore.edu and we will gladly help with your implementation.

## Contributors

[//]: contributor-faces
<a href="https://github.com/kanarelo"><img src="https://lh3.googleusercontent.com/-dBP-MEEYWBo/AAAAAAAAAAI/AAAAAAAAAAA/BNaDPKkcWow/s72-c-k/photo.jpg" title="kanarelo" width="20" height="20"></a>

We seriously want to put your face here...