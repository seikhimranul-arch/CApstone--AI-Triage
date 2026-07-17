#!/usr/bin/env python3
import subprocess
import sys

# Install dependencies
deps = ["google-generativeai", "pydantic", "python-dotenv", "pytest", "ruff"]
for dep in deps:
    print(f"Installing {dep}...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", dep])

print("\nAll dependencies installed successfully!")
print("\nTesting imports...")
for dep in deps:
    try:
        __import__(dep.replace('-', '_'))
        print(f"✓ {dep} - OK")
    except ImportError as e:
        print(f"✗ {dep} - Failed: {e}")
        sys.exit(1)

print("\nDependencies verified!")