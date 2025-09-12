"""
CroweLang - Proprietary Quantitative Trading DSL
Copyright (c) 2024 Michael Benjamin Crowe. All Rights Reserved.
"""

__version__ = "1.0.0"
__author__ = "Michael Benjamin Crowe"
__license__ = "Proprietary"

import os

def verify_license():
    """Check for valid license"""
    key = os.environ.get("CROWELANG_LICENSE_KEY")
    if not key:
        print("CroweLang: Free tier active. Visit https://crowelang.com/pricing")
        return False
    return True

# Verify on import
verify_license()

__all__ = ["compile_strategy", "parse", "Runtime"]
