import os
import time
from celery.result import AsyncResult
from flask import Flask, jsonify, abort, request, url_for
#from flask_restful import Api, Resource
from flask_cors import CORS
# import model
# from draw_attPlots import draw_attPlots
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from tasks.main import celery_app, launch_new_prediction

# MongoDB connection
client = MongoClient('mongodb://mulocdeepdb:65528')
db = client.mulocdeep2
jobInfo = db.jobInfo

UPLOAD_FOLDER = '/app/uploads'
OUTPUT_FOLDER = '/app/results'
ALLOWED_EXTENSIONS = {'txt'}
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(OUTPUT_FOLDER):
    os.makedirs(OUTPUT_FOLDER)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1000 * 1000 #Maximum file size: 16M
CORS(app)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/predict', methods=['POST'])
def post():
    if 'sequences' not in request.files:
        return jsonify({'msg': 'No file part!'}), 400

    sequences = request.files['sequences']
    filepath = ''

    # If the user does not select a file, the browser submits an
    # empty file without a filename.
    if sequences.filename == '':
        return jsonify({'msg': 'No selected file!'}), 400

    if sequences and allowed_file(sequences.filename):
        filename = secure_filename(sequences.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        sequences.save(filepath)
        # print(filepath)
    else:
        return jsonify({'msg': 'This file extension is not allowed!'}), 415

    # requestValue = request.get_json()
    # job_nickname = requestValue['job_nickname']
    # email = requestValue['email']

    job_nickname = request.form.get('job_nickname')
    f = open(filepath)
    sequence = f.read()
    f.close()
    email = request.form.get('email')
    existPSSM = request.form.get('existPSSM')
    submittedTime = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
    ipAddress = request.remote_addr
    fileSize = os.path.getsize(filepath)
    proteins = len(sequence.strip().split('>')) - 1
    initialStatus = 'Queued'
    OUTPUT_FOLDER = app.config['OUTPUT_FOLDER'] + '/' + job_nickname

    # Create a new job in the database
    result = jobInfo.insert_one({
        'nickName': job_nickname,
	    'sequence': sequence,
	    'file': filepath,
	    'email': email,
	    'status': initialStatus,
	    'submittedTime': submittedTime,
	    'ipAddress': ipAddress,
	    'size': fileSize,
	    'proteins': proteins
    })
    
    task_id = result.insertedtask_id
    print('New job is created, the task_id is： ', task_id)
    
    # Return job id
    result = launch_new_prediction.delay(task_id, filepath, OUTPUT_FOLDER, existPSSM)
    summary = {'taskId': result.id,
               'location': str(url_for('get_task_state', task_id=result.id)),
               'nickName': job_nickname,
	           'sequence': sequence,
	           'file': filepath,
	           'email': email,
	           'status': initialStatus,
	           'submittedTime': submittedTime,
	           'ipAddress': ipAddress,
	           'size': fileSize,
	           'proteins': proteins
              }
    return jsonify(summary), 202
    

@app.route('/tasks/<string:task_id>/state')
def get_task_state(task_id):
    result = AsyncResult(task_id, app=celery_app)
    summary = {
        "state": result.state,
        "result": result.prediction,
        "id": result.id,
    }
    return jsonify(summary), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
