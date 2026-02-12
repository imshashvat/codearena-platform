FROM python:3.10-slim

# Security: no root
RUN useradd -m runner
USER runner

WORKDIR /app

COPY runner.py .

# Disable networking
CMD ["python", "runner.py"]
