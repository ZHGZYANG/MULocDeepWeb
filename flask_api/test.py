import os
import time
import model
import traceback


try:
    prediction = model.predict("/app/uploads/4384605c3063baffa679ca67e3d478d5/test_seq.txt", "/app/results/4384605c3063baffa679ca67e3d478d5", "./xxx")
except Exception as e:
    traceback.print_exc()
else:

    print('Task is completed!')
    
finally:
    print("The job is done!") 