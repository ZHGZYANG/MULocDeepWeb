This is the folder you can run MULocDeep locally, we will keep the version the same as the webserver.
## Installation
  - Installation has been tested in Windows, Linux and Mac OS X with Python 3.7.4. 
  - Keras version: 2.3.0
  - For predicting, GPU is not required. 
  - Users need to install the NCBI Blast+ for the PSSM. The download link is https://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/. The version we tested is 2.9.0. The database can be downloaed at https://drive.google.com/drive/folders/19gbmtZAz1kyR76YS-cvXSJAzWJdSJniq?usp=sharing. Put the downloaded 'db' folder in the same folder as other files.
## predict command
python3 predict.py -input ./{fasta file path} -output ./{result dir} --no-att
## predict using BLOSUM62 (BLOSUM62 is pre-calculated, so the running timie using it is fast)
python3 predict.py -input ./{fasta file path} -output ./{result dir} --no-att -existPSSM ./{a path that doesn't exist}
