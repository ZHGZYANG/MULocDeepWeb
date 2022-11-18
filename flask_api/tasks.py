import os
import time
import model
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from draw_attPlots import draw_attPlots
from celery import Celery

celery_app = Celery(
    'celery_app',
    backend=os.getenv('REDIS_URI', 'redis://localhost:6379/0'),
    broker=os.getenv('REDIS_URI', 'redis://localhost:6379/0')
)


@celery_app.task()
def launch_new_prediction(task_id, filepath, OUTPUT_FOLDER, existPSSM):
    print(f'Provisioning environment for {task_id}...')

    # Get the job info for current job
    condition = {'task_id': task_id}
    current_job = jobInfo.find_one(condition)
    '''
    # Check if there is any running jobs
    while jobInfo.count_documents({'status': 'Processing'}) > 0:
        time.sleep(5)
        print('There are running jobs. Wait for 5s.')
    '''
    # Set the status of current job to 'Processing'
    current_job['status'] = 'Processing'
    result = jobInfo.update_one(condition, {'$set': current_job})
    print(result)
    print('Start processing current job.')

    prediction = model.predict(filepath, OUTPUT_FOLDER, existPSSM)  

    # Set the status of current job to 'Done'
    current_job['status'] = 'Done'
    result = jobInfo.update_one(condition, {'$set': current_job})
    print(result)
    
    print(f'{task_id} is completed!')
    return {"testCaseId": task_id,
            "prediction": prediction
            }
