FROM satijalab/seurat:4.1.0

# Ubuntu dependency found at /rocker_scripts/install_tidyverse.sh
RUN NCPUS=${NCPUS:-1}
RUN set -e
RUN apt-get -q  update && apt install -y software-properties-common
RUN add-apt-repository -y ppa:deadsnakes/ppa
# RUN apt-get remove -y python3.8 && apt-get remove -y --auto-remove python3.8

RUN apt-get -q  update && apt-get -y --no-install-recommends install \
	libxml2-dev \
	libcairo2-dev \
	libgit2-dev \
	default-libmysqlclient-dev \
	libpq-dev \
	libsasl2-dev \
	libsqlite3-dev \
	libssh2-1-dev \
	unixodbc-dev \
	python3.7 \
	python3-pip \
	python3-tk \
    python3.7-distutils \
	vim

RUN rm /usr/bin/python3
RUN ln -s /usr/bin/python3.7 /usr/bin/python3

# Found more libraries need to be installed during my debugging
RUN apt-get -y --no-install-recommends install \
	libbz2-dev \
	liblzma-dev \
	libsodium-dev \
	libhiredis-dev
	
# Install CRAN dependencies
RUN install2.r --error --skipinstalled -r $CRAN \
	ggseqlogo \
	ggplot2
	    
RUN pip install --no-cache-dir numpy scipy biopython  h5py==2.10.0  tensorflow==1.13.1  keras==2.2.4  matplotlib  Flask  Flask-WTF==1.0.0 flask_cors  flask-restful  python-dotenv setuptools==59.6.0  flasgger  flask_script  flask_migrate  protobuf==3.20.1 pymongo celery==5.2.3 flower==1.0.0 redis==4.1.4 pytest==7.0.1 importlib-metadata==4.13.0 zmail gevent requests biopython

WORKDIR /
RUN wget ftp://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/2.9.0/ncbi-blast-2.9.0+-x64-linux.tar.gz
RUN tar zxvpf ncbi-blast-2.9.0+-x64-linux.tar.gz
RUN rm ncbi-blast-2.9.0+-x64-linux.tar.gz
ENV PATH "$PATH:/ncbi-blast-2.9.0+/bin"

# RUN rm -rf /app
# RUN mkdir /app
# WORKDIR /app  
WORKDIR /usr/src/app         

COPY . .
# CMD [ "flask", "run"]
EXPOSE 5000
EXPOSE 5555

# CMD ["python3", "app.py"]
