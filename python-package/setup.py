from setuptools import setup, find_packages

setup(
    name="aimpn",
    version="2.0.0",
    description="Official Python SDK & x402 Zero-Gas Micropayment Paywall Decorator for HuggingFace Spaces and AI Agents on Base Mainnet",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.25.0",
    ],
)
