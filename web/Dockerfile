FROM nikolaik/python-nodejs:python3.7-nodejs10	
RUN apt-get update && apt-get install -y \ 
    python3-tk


RUN rm -rf /app
RUN mkdir /app
WORKDIR /app           
COPY . /app

RUN npm install
EXPOSE 8083

CMD BUILD_ENV=docker node app.js
