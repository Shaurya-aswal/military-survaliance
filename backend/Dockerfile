FROM python:3.10-slim

# Add this line to disable log buffering
ENV PYTHONUNBUFFERED=1

WORKDIR /app
# ... (keep your existing COPY and RUN commands) ...

# Update your CMD to include debug logging
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860", "--log-level", "debug"]

# 1. Use Python 3.10 Slim (Smaller & Faster)
FROM python:3.10-slim

# 2. Set working directory
WORKDIR /app

# 3. Install system dependencies for OpenCV (Fixes "libGL.so" errors)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 4. Copy requirements first (Docker caching)
COPY requirements.txt .

# 5. Install Python dependencies (No cache to save space)
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# 6. Copy ALL files (Code + Models)
# Hugging Face has ALREADY downloaded your .pt files at this stage.
# This command simply moves them from the build context into the container.
COPY . .

# 7. Create a non-root user (STRICT REQUIREMENT for Spaces)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# 8. Expose the port Hugging Face expects
EXPOSE 7860

# 9. Start the app
# Ensure your python file is named 'main.py' and the app instance is 'app'
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]