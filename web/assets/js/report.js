/* -------------------------------------------------------------------------- */
/*                               Report js File                               */
/*								Author: Ziyang Zhang           				  */
/*							Last Updated Date: 04/06/2023 					  */
/* -------------------------------------------------------------------------- */

/**
 * Submit form for bug report
 *
 * @returns
 */
$("#btnSubmitReport").click(function (event) {
    //stop submit the form, we will post it manually.
    event.preventDefault();

    // Get form
    var form = $('#form_report')[0];
    
    // FormData object 
    var data = new FormData(form);
    for (const [key, value] of data) {
      switch (key){
          case 'description':
            if(!value){
                $('#errorModalBody').text("Description cannot be empty!");
                $('#errorModal').modal('show');
                return false;
            }
            break;
          case 'name':
            if(value && !/^[a-zA-Z ]+$/.test(value)){
                $('#errorModalBody').text("Name is invalid!");
                $('#errorModal').modal('show');
                return false;
            }
            break;
          case 'email':
            if(value && !/^[a-zA-Z0-9]+@[a-zA-Z0-9]+.[a-zA-Z0-9]+$/.test(value)){
                $('#errorModalBody').text("Email is invalid!");
                $('#errorModal').modal('show');
                return false;
            }
            break;
          case 'jobID':
            if(value && !/^[a-zA-Z0-9]+$/.test(value)){
                $('#errorModalBody').text("Job ID is invalid!");
                $('#errorModal').modal('show');
                return false;
            }
      }
    }    

    $.ajax({
        type: "POST",
        dataType: "json",
        async: false,
        crossDomain: true,
        data: data,
        url: '/jobs/report',
        processData: false,
        contentType: false,
        cache: false,
        beforeSend: function () {
            $("#form-div").css("display", "none");
            $("#result-div").css("display", "block");
        },
    });
});
