![Zazi header](https://zazi-assets.s3.us-east-1.amazonaws.com/zazi.png)

# Zazi OpenBanking Platform (Community Edition)

Zazi is a minimalistic open-source core/open banking platform, built for developers, for digital SACCOs and FinTech startups. Automate all your payment needs with our simple to use API.

## Quick start

Join the [PostHog Users Slack](https://join.slack.com/t/zaziusers/shared_invite/enQtOTY0MzU5NjAwMDY3LTc2MWQ0OTZlNjhkODk3ZDI3NDVjMDE1YjgxY2I4ZjI4MzJhZmVmNjJkN2NmMGJmMzc2N2U3Yjc3ZjI5NGFlZDQ) if you need help, want to chat, or are thinking of a new feature idea.

## Features

- **Event-based** analytics at a user level - see which users are doing what in your application.
- **Complete control** over your data - host it yourself.
- **Automatically capture** clicks and page views to do analyze what your users are doing **retroactively**.
- Libraries for **[JS](https://github.com/PostHog/zazi/wiki/JS-integration), [Python](https://github.com/PostHog/zazi/wiki/python-integration), [Ruby](https://github.com/PostHog/zazi/wiki/ruby-integration), [Node](https://github.com/PostHog/zazi/wiki/node-integration), [Go](https://github.com/PostHog/zazi/wiki/Go-integration)** + API for anything else.
- Beautiful **graphs, funnels, user cohorts, user paths and dashboards**.
- Super easy deploy using **Docker** or **Heroku**.

## Philosophy

Many startups/engineers find it painful to create the backend technology around their payment wallets/gateways in a way it can communicate to Bankers/Financial Analysts as it requires deep banking domain knowledge.

We see this as a niche market to help reach their targets.

Zazi gives you full control over all your users' data, while letting anyone easily perform powerful analytics.

## Why ZAZI?

Zazi is the only <strong>product-focused</strong> open source core banking platform, with a strong focus on Kenyan Payment platforms.


## Development

### Running backend (Django)

1. Make sure you have python 3 installed `python3 --version`
2. Make sure you have postgres installed `brew install postgres`
3. Start postgres, run `brew services start postgresql`
4. Create Database `createdb zazi`
5. Navigate into the correct folder `cd zazi`
6. Run `python3 -m venv env` (creates virtual environment in current direction called 'env')
7. Run `source env/bin/activate` (activates virtual environment)
8. Run `pip install -r requirements.txt`. If you have problems with this step (TLS/SSL error), then run `~ brew update && brew upgrade` followed by `python3 -m pip install --upgrade pip`, then retry the requirements.txt install.
9. Run migrations `DEBUG=1 python3 manage.py migrate`
10. Run `DEBUG=1 python3 manage.py runserver`
11. Run the tests and frontend

### Running backend tests

`bin/tests`

### Running frontend (React)

If at any point, you get "command not found: nvm", you need to install nvm, then use that to install node.

1. Make sure you are running Django above in a separate terminal
2. Now run `bin/start-frontend`
3. To see some data on the frontend, you should go to the `http://localhost:8000/demo` and play around with it, so you can see some data on dashboard

## Open source / Paid

This repo is entirely [MIT licensed](/LICENSE). We charge for things like user permissioning and auditability, a/b testing and dedicated support. Please email onesmus.mukewa@strathmore.edu and we will gladly help with your implementation.

## Contributors

[//]: contributor-faces
<a href="https://github.com/kanarelo"><img src="https://lh3.googleusercontent.com/-dBP-MEEYWBo/AAAAAAAAAAI/AAAAAAAAAAA/BNaDPKkcWow/s72-c-k/photo.jpg" title="ellmh" width="80" height="80"></a>

We seriously want to put your face here...