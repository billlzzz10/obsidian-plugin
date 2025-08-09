# Dockerfile for Obsidian AI Backend (FastAPI, Azure-ready)
FROM python:3.11-slim

# Set workdir
WORKDIR /app

# Install system dependencies and ODBC Driver 18 for SQL Server
RUN apt-get update && \
    apt-get install -y \
        build-essential=12.9 \
        gnupg=2.2.27-2+deb11u2 \
        curl=7.74.0-1.3+deb11u7 \
        unixodbc-dev=2.3.7+really2.3.6-0.1 \
    && curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt ./
COPY requirements/ ./requirements/

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt && \
    pip install -r requirements/base.txt && \
    pip install -r requirements/dev.txt || true

# Copy app code
COPY src/ ./src/
COPY config/ ./config/

# Expose port
EXPOSE 8000

# Set environment variables (can be overridden by Azure)
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Start FastAPI app with Uvicorn
CMD ["python", "-m", "src.main"]
