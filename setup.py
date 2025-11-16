from setuptools import setup, find_packages

setup(
    name="dsa-interviewer",
    version="1.0.0",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    install_requires=[
        "fastapi>=0.115.0",
        "uvicorn[standard]>=0.32.0",
        "python-dotenv>=1.0.0",
        "pydantic>=2.10.0",
        "pydantic-settings>=2.6.0",
        "chromadb>=0.5.0",
        "sentence-transformers>=3.3.0",
        "requests>=2.32.0",
        "redis>=5.2.0",
    ],
    extras_require={
        "dev": [
            "pytest>=8.3.0",
            "pytest-asyncio>=0.24.0",
            "pytest-cov>=6.0.0",
            "httpx>=0.28.0",
            "black>=24.10.0",
            "ruff>=0.8.0",
            "mypy>=1.13.0",
        ]
    },
    python_requires=">=3.9",
)