FROM python:3.8.5

WORKDIR /app

COPY requirements.txt /app/

RUN set -e; \
    pip -q install --upgrade pip && \
    pip -q install --no-cache-dir -r requirements.txt && \
    pip check

copy . /app/


CMD ["./run-prod.sh"]
