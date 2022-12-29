import os
import time, hashlib
import requests
import json
from Bio import SeqIO
from celery.result import AsyncResult
from flask import Flask, Blueprint, jsonify, abort, request, url_for
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from project.server.tasks import create_task


main_blueprint = Blueprint("main", __name__,)

# MongoDB connection
client = MongoClient(os.environ.get("MONGODB_URL",'mongodb://mulocdeepdb:65528'))
db = client.mulocdeep2
jobInfo = db.jobinfos
userInfo = db.userinfos
    
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER")
OUTPUT_FOLDER = os.getenv("OUTPUT_FOLDER")
MAX_CONTENT_LENGTH = os.getenv("MAX_CONTENT_LENGTH")
MAXCAPACITY = int(os.getenv("MAXCAPACITY"))
ALLOWED_EXTENSIONS = {'txt', 'fa'}


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
        
           
def get_unique_id(ipAddress):
    m = hashlib.md5((ipAddress + str(time.perf_counter())).encode("utf-8"))
    job_id = m.hexdigest()
    
    filepath = UPLOAD_FOLDER + '/' + job_id + '.fa'
    output_dir = OUTPUT_FOLDER + '/' + job_id
    
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    return job_id, filepath, output_dir


def get_protain_info(filepath):
    f = open(filepath)
    sequence = f.read()
    f.close()   
    fileSize = os.path.getsize(filepath)
    proteins = len(sequence.strip().split('>')) - 1
    return sequence, fileSize, proteins


def get_geolocation(ipAddress):
    response = requests.get("http://ip-api.com/json/" + ipAddress + "?lang=EN").content.decode("utf-8")
    geolocation = json.loads(response)
    return geolocation['lat'], geolocation['lon']


def is_fasta(filename):
    with open(filename, "r") as handle:
        fasta = SeqIO.parse(handle, "fasta")
        return any(fasta)  # False when `fasta` is empty, i.e. wasn't a FASTA file


@main_blueprint.route("/tasks/predict_sequences", methods=["POST"])
def predict_sequences():
    # Get the real remote IP
    if request.headers.getlist("X-Forwarded-For"):
        ipAddress = request.headers.getlist("X-Forwarded-For")[0]
    else:
        ipAddress = request.remote_addr
    sequences = request.form.get('sequences')
    
    if sequences == None or len(sequences.strip()) == 0:
        return jsonify({'error': 'Query can not be empty!'}), 400
    
    job_nickname = request.form.get('nickName')
    email = request.form.get('email')
    mode = request.form.get('mode_type')
    # mode = "PSSM"
    species = request.form.get('species_type')
    # species = "fungi"
    submittedTime = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
    initialStatus = 'Queued'
    job_id, filepath, output_dir = get_unique_id(ipAddress)
    # lat, lon = get_geolocation(ipAddress)
    
    with open(filepath, "w") as f:
        f.write(sequences)
    
    sequence, fileSize, proteins = get_protain_info(filepath)
    
    if proteins <= 0:
        return jsonify({'error': 'No FASTA sequence is detected!'}), 400
    
    if proteins > 200:
        return jsonify({'error': 'The number of sequences ' + proteins + ' is out of the limit: 200.'}), 400
    
    if (not is_fasta(filepath)):
        return jsonify({'error': ' The file format should be FASTA!'}), 400
    
    print('New job is created, the job_id is： ', job_id)
    
    # Return job id
    result = create_task.delay(job_id, filepath, output_dir, mode, species)
    summary = {'job_id': job_id,
               'task_id': result.id,
               'location': str(url_for('main.get_status', task_id=result.id)),
               'nickName': job_nickname,
	           'sequence': sequence,
               'file': filepath,
               'output_dir': output_dir,
	           'email': email,
	           'status': initialStatus,
	           'submittedTime': submittedTime,
	           'ipAddress': ipAddress,
	           'size': fileSize,
	           'proteins': proteins
              }
    
    if fileSize > MAXCAPACITY:
        return jsonify({'error': 'The file should not be larger than 100 MB!'}), 400
    
    # Create a new job in the database
    insert_result = jobInfo.insert_one({
        'job_id': job_id,
        'task_id': result.id,
        'nickName': job_nickname,
	    'sequence': sequence,
	    'file': filepath,
        'output_dir': output_dir,
        'mode': mode,
        'speceis':species,
	    'email': email,
	    'status': initialStatus,
	    'submittedTime': submittedTime,
	    'ipAddress': ipAddress,
	    'size': fileSize,
	    'proteins': proteins
    })
    
    # _id = str(insert_result.inserted_id)
    
    user = userInfo.find_one({'ipAddress': ipAddress})
    if user == None:
        userInfo.insert_one({
            'ipAddress': ipAddress,
			'capacity': fileSize,
			'query': 1,
			'proteins': proteins
            # 'lat': lat, 
            # 'lon': lon
        })
    else:
        total_capacity = fileSize + user['capacity']
        if total_capacity > MAXCAPACITY:
            return jsonify({'error': 'Total capacity of the user should not be larger than 100 MB!'}), 400
        
        user['capacity'] = total_capacity
        user['query'] = user['query'] + 1
        user['proteins'] = user['proteins'] + proteins
        userInfo.update_one({'ipAddress': ipAddress}, {'$set': user})
          
    return jsonify(summary), 202
    

@main_blueprint.route("/tasks/predict_file", methods=["POST"])
def predict_file():
    if 'sequences_file' not in request.files:
        return jsonify({'error': 'No file part!'}), 400

    sequences_file = request.files['sequences_file']
    filepath = ''

    # If the user does not select a file, the browser submits an
    # empty file without a filename.
    if sequences_file.filename == '':
        return jsonify({'error': 'No selected file!'}), 400
    
    # Get the real remote IP
    if request.headers.getlist("X-Forwarded-For"):
        ipAddress = request.headers.getlist("X-Forwarded-For")[0]
    else:
        ipAddress = request.remote_addr
    job_nickname = request.form.get('nickname_f')
    email = request.form.get('email_f')
    mode = request.form.get('mode_type_f')
    # mode = "PSSM"
    species = request.form.get('species_type_f')
    # species = "fungi"
    submittedTime = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
    initialStatus = 'Queued'
    
    job_id, filepath, output_dir = get_unique_id(ipAddress)
    # lat, lon = get_geolocation(ipAddress)
       
    if sequences_file and allowed_file(sequences_file.filename):
        # filename = secure_filename(sequences_file.filename)
        # filepath = os.path.join(input_dir, filename)
        sequences_file.save(filepath)
    else:
        return jsonify({'error': 'This file extension is not allowed!'}), 415
    
    sequence, fileSize, proteins = get_protain_info(filepath)
    
    if proteins <=0:
        return jsonify({'error': 'No FASTA sequence is detected!'}), 400
    
    if proteins > 200:
        return jsonify({'error': 'The number of sequences ' + proteins + ' is out of the limit: 200.'}), 400
    
    if (not is_fasta(filepath)):
        return jsonify({'error': ' The file format should be FASTA!'}), 400
    
    print('New job is created, the job_id is： ', job_id)
    
    # Return job id
    result = create_task.delay(job_id, filepath, output_dir, mode, species)
    summary = {'job_id': job_id,
               'task_id': result.id,
               'location': str(url_for('main.get_status', task_id=result.id)),
               'nickName': job_nickname,
	           'sequence': sequence,
               'file': filepath,
               'output_dir': output_dir,
	           'email': email,
	           'status': initialStatus,
	           'submittedTime': submittedTime,
	           'ipAddress': ipAddress,
	           'size': fileSize,
	           'proteins': proteins
              }
    
    if fileSize > MAXCAPACITY:
        return jsonify({'error': 'The file should not be larger than 100 MB!'}), 400
    
    # Create a new job in the database
    insert_result = jobInfo.insert_one({
        'job_id': job_id,
        'task_id': result.id,
        'nickName': job_nickname,
	    'sequence': sequence,
	    'file': filepath,
        'output_dir': output_dir,
        'mode': mode,
        'species': species,
	    'email': email,
	    'status': initialStatus,
	    'submittedTime': submittedTime,
	    'ipAddress': ipAddress,
	    'size': fileSize,
	    'proteins': proteins
    })
    
    # _id = str(insert_result.inserted_id)
    
    user = userInfo.find_one({'ipAddress': ipAddress})
    if user == None:
        userInfo.insert_one({
            'ipAddress': ipAddress,
			'capacity': fileSize,
			'query': 1,
			'proteins': proteins
            # 'lat': lat, 
            # 'lon': lon
        })
    else:
        total_capacity = fileSize + user['capacity']
        if total_capacity > MAXCAPACITY:
            return jsonify({'error': 'Total capacity of the user should not be larger than 100 MB!'}), 400
        
        user['capacity'] = total_capacity
        user['query'] = user['query'] + 1
        user['proteins'] = user['proteins'] + proteins
        userInfo.update_one({'ipAddress': ipAddress}, {'$set': user})
    
    return jsonify(summary), 202


@main_blueprint.route("/tasks/<task_id>", methods=["POST", "GET"])
def get_status(task_id):
    task_result = AsyncResult(task_id)
    result = {
        "task_id": task_id,
        "task_status": task_result.status,
        "task_result": task_result.result
    }
    return jsonify(result), 200