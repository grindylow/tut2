FROM python:3.13
WORKDIR /app

RUN apt update
RUN apt install -y pipx
#RUN apt install python3 python3-pip -y

RUN pipx install poetry
ENV PATH="$PATH:/root/.local/bin"
# only copy the requirements for now to ensure caching as pure dependencies will change less often
# see, e.g., https://stackoverflow.com/questions/53835198/integrating-python-poetry-with-docker
COPY poetry.lock pyproject.toml ./
RUN poetry install --with=runtime

# now copy the actual application
COPY . .
ENV TUT2_MONGODB_HOST=mongo
ENV TUT2_MONGODB_PORT=27017
ENV TUT2_MONGODB_ADMIN_USER=root
ENV TUT2_MONGODB_ADMIN_PASSWORD=example1
ENV TUT2_TUT2RW_USER_NAME=myGrill

ENV PYTHONUNBUFFERED=1

EXPOSE 5000

CMD ["/app/docker_entrypoint.sh"]

#ENTRYPOINT []
