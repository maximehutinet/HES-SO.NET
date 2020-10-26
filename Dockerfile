FROM python:3.7
ENV PYTHONUNBUFFERED 1
RUN mkdir /app

WORKDIR /app

COPY [ "./web_app/requirements.txt", "/app/" ]

RUN pip install -r requirements.txt

ENTRYPOINT [ "./start_app.sh", "-d", "app" ]
