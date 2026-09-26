FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/project/src

WORKDIR /app
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY ml_dataset_final.csv ./ml_dataset_final.csv
COPY project ./project

EXPOSE 8090
CMD ["uvicorn", "api_server:app", "--app-dir", "/app/project/src", "--host", "0.0.0.0", "--port", "8090"]
