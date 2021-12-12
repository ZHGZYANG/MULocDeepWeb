FROM nikolaik/python-nodejs:python3.7-nodejs10	
RUN apt-get update && apt-get install -y \ 
    python3-tk
RUN python3 -m pip install numpy scipy && python3 -m pip install biopython && python3 -m pip install h5py==2.10.0 && python3 -m pip install tensorflow==1.13.1 && python3 -m pip install keras==2.2.4 && python3 -m pip install matplotlib
RUN wget ftp://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/2.9.0/ncbi-blast-2.9.0+-x64-linux.tar.gz
RUN tar zxvpf ncbi-blast-2.9.0+-x64-linux.tar.gz
RUN rm ncbi-blast-2.9.0+-x64-linux.tar.gz
ENV PATH "$PATH:/ncbi-blast-2.9.0+/bin"

RUN rm -rf /app
RUN mkdir /app
WORKDIR /app           

COPY . /app
RUN npm install
EXPOSE 8083

CMD BUILD_ENV=docker node app.js
