# 🚀 PyPI OIDC Trusted Publishing Guide (Automated 100%)
**Publish `aimpn` Python SDK globally without storing passwords or tokens in GitHub!**

---

## 🌟 What is Trusted Publishing?
PyPI Trusted Publishing uses OpenID Connect (OIDC) to securely exchange short-lived tokens between GitHub Actions and PyPI. Once configured, whenever we push a release or trigger a workflow on GitHub, our package is built and deployed directly to PyPI (`pip install aimpn`) automatically!

---

## 📋 3-Step Activation Guide

### Step 1: Open PyPI Publishing Settings
Go to [https://pypi.org/manage/account/publishing/](https://pypi.org/manage/account/publishing/) and log in.
Click **"Add a new pending publisher"** and choose **GitHub**.

### Step 2: Fill in 4 Parameters
Copy and paste these exact values into PyPI:
* **PyPI Project Name:** `aimpn`
* **GitHub Owner:** `tdpeta754-design`
* **GitHub Repository Name:** `ai-micropayment-network`
* **Workflow filename:** `publish-pypi.yml`
* **Environment name:** *(Leave completely blank)*

Click **"Add"** on PyPI.

### Step 3: Trigger the First Publish!
We have already created `.github/workflows/publish-pypi.yml` and pushed it to GitHub!
Now you can publish to PyPI in either of two ways:
1. **Option A (Manual Click on GitHub):** Go to our GitHub repo -> click **Actions** tab -> select **"🐍 Publish aimpn to PyPI"** on the left -> click **"Run workflow"** button on the right!
2. **Option B (Create Release Tag):** Create a new GitHub Release tagged `v2.0.0`. GitHub Actions will automatically trigger and publish the package!

---
*For interactive 1-click copy buttons, open `pypi_auto_publisher.html` in your browser.*
