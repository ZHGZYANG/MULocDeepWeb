import os
import sys
import time
import model
import traceback
import zmail
import re
import zipfile
import shutil
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from draw_attPlots import draw_attPlots
from celery import Celery


celery = Celery(__name__)
celery.conf.broker_url = os.environ.get("CELERY_BROKER_URL", "amqp://admin:eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81@rabbitmq:5672//")
# celery.conf.result_backend = os.environ.get("CELERY_RESULT_BACKEND", "redis://:eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81@redis:6379")
celery.conf.result_backend = os.environ.get("CELERY_RESULT_BACKEND", "redis://:eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81@redis:6381")

# MongoDB connection
client = MongoClient(os.environ.get("MONGODB_URL",'mongodb://mulocdeepdb:65528'))
db = client.mulocdeep2
jobInfo = db.jobinfos

def validateEmail(email):
    if len(email) > 7:
        if re.match("^.+\\@(\\[?)[a-zA-Z0-9\\-\\.]+\\.([a-zA-Z]{2,3}|[0-9]{1,3})(\\]?)$", email) != None:
            return True
    return False


def send_email(email, subject, content):
    mail_server = zmail.server(username=os.environ.get("EMAIL_USER"), password=os.environ.get("EMAIL_PASSWORD"))
    msg = {
          'subject':subject,
          'content_html':content
          }
    recipient = email
    try:
        mail_server.send_mail(recipient, msg)
        print('Email has been sent successfully!')
    except Exception as e:
        print('Failed to send email: ' + e)    

def zipDir(source_dir, output_filename):
    if os.path.exists(output_filename):
        os.remove(output_filename) # Remove the zip file if exists
    zipf = zipfile.ZipFile(output_filename, 'w')    
    pre_len = len(os.path.dirname(source_dir))
    for parent, dirnames, filenames in os.walk(source_dir):
        for filename in filenames:
            pathfile = os.path.join(parent, filename)
            arcname = pathfile[pre_len:].strip(os.path.sep)     # Relative path
            zipf.write(pathfile, arcname)
    zipf.close()
    shutil.move(output_filename, source_dir) # Move the file to the target folder

            

@celery.task(name="create_task")
def create_task(job_id, filepath, output_dir, mode, species):
    print(f'Provisioning environment for {job_id}...')

    # Get the job info for current job
    condition = {'job_id': job_id}
    current_job = jobInfo.find_one(condition)
    '''
    # Check if there is any running jobs
    while jobInfo.count_documents({'status': 'Processing'}) > 0:
        time.sleep(5)
        print('There are running jobs. Wait for 5s.')
    '''
    email = current_job['email']
    
    if current_job != None: 
        # Send email notification
        if validateEmail(email):
            subject = 'Your job ID is:' + job_id
            link = "<center><a href = \"http://mu-loc.org/upload/:" + job_id + "\">"
            content = '<center><h2>MULocDeep</h2></center><br><center><p> Your job is:</p><br></center>' + link + job_id + '</a></center>'
            try:
                send_email(email, subject, content)
            except Exception as e:
                traceback.print_exc()  
        
        # Set the status of current job to 'Processing'
        current_job['status'] = 'Processing'
        update_result = jobInfo.update_one(condition, {'$set': current_job})
        
        try:
            prediction = model.predict(filepath, output_dir, mode, species)
        except Exception as e:
            traceback.print_exc()
            exc_type, exc_value, exc_tb = sys.exc_info()
            results = { 
                    "error": job_id + "is failed!",
                    "exc_type": exc_type,
                    "exc_value": exc_value,
                    "exc_tb": exc_tb
                   }
            # Set the status of current job to 'Failed'
            current_job['status'] = 'Failed'
            current_job['results'] = results
            update_result = jobInfo.update_one(condition, {'$set': current_job})
            return results
        else:
            # Zip the results
            zipDir(output_dir, output_dir + '.zip')

            # Set the status of current job to 'Done'
            current_job['status'] = 'Done'
            current_job['results'] = prediction
            update_result = jobInfo.update_one(condition, {'$set': current_job})
            print(f'{job_id} is completed!')
            
            # Send email notification
            if validateEmail(email):
                subject = 'Your job: ' + job_id + ' has completed!'
                link = "<center><a href = \"http://mu-loc.org/jobs/:" + job_id + "\">"
                content = '<center><h2>MULocDeep</h2></center><br><center><p> Your job :</p></center><br>' + link + job_id + '</a></center><br>' + "<center><p>has completed!</p></center>"
                try:
                    send_email(email, subject, content)
                except Exception as e:
                    traceback.print_exc()
                    
            
            
            return prediction          
    else:
        results = { "error": "No task is found with job id " + job_id + "!"}
        current_job['status'] = 'Failed'
        current_job['results'] = results
        update_result = jobInfo.update_one(condition, {'$set': current_job})
        return results