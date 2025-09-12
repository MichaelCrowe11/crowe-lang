"""
CroweLang - Proprietary Quantitative Trading DSL
Copyright (c) 2024 Michael Benjamin Crowe. All Rights Reserved.
"""

from setuptools import setup, find_packages
import os

# Read the README for long description
with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

# Read requirements
with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="crowelang",
    version="1.0.0",
    author="Michael Benjamin Crowe",
    author_email="michael.crowe@crowelang.com",
    description="Professional quantitative trading DSL for strategy development and execution",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/MichaelCrowe11/crowe-lang",
    project_urls={
        "Documentation": "https://crowelang.com/docs",
        "Bug Tracker": "https://github.com/MichaelCrowe11/crowe-lang/issues",
        "Pricing": "https://crowelang.com/pricing",
        "Support": "https://crowelang.com/support",
    },
    packages=find_packages(where="python"),
    package_dir={"": "python"},
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Financial and Insurance Industry",
        "Intended Audience :: Developers",
        "Topic :: Office/Business :: Financial :: Investment",
        "Topic :: Software Development :: Compilers",
        "License :: Other/Proprietary License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=requirements if os.path.exists("requirements.txt") else [
        "numpy>=1.20.0",
        "pandas>=1.3.0",
        "pydantic>=2.0.0",
        "click>=8.0.0",
        "requests>=2.28.0",
        "PyYAML>=6.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=22.0.0",
            "mypy>=1.0.0",
            "flake8>=5.0.0",
        ],
        "pro": [
            "crowelang-pro",  # Professional features (separate package)
        ],
    },
    entry_points={
        "console_scripts": [
            "crowelang=crowelang.cli:main",
            "crowe=crowelang.cli:main",
        ],
    },
    include_package_data=True,
    package_data={
        "crowelang": [
            "templates/*.crowe",
            "runtime/*.py",
            "docs/*.md",
        ],
    },
    zip_safe=False,
    license="Proprietary",
    keywords="trading quantitative finance strategy dsl compiler crowelang algotrading",
)