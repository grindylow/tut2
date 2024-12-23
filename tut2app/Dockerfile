FROM python:3
WORKDIR /app
COPY . .

RUN apt update
RUN apt install -y pipx
#RUN apt install python3 python3-pip -y

RUN pipx install poetry
ENV PATH="$PATH:/root/.local/bin"
RUN poetry install --with=runtime

ENV TUT2_MONGODB_HOST=mongo
ENV TUT2_MONGODB_PORT=27017
ENV TUT2_MONGODB_ADMIN_USER=root
ENV TUT2_MONGODB_ADMIN_PASSWORD=example1
ENV TUT2_TUT2RW_USER_NAME=myGrill

ENV PYTHONUNBUFFERED=1

EXPOSE 5000

CMD ["/app/docker_entrypoint.sh"]

#ENTRYPOINT []
