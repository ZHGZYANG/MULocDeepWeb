/* -------------------------------------------------------------------------- */
/*                            Upload Router Module 		                      */
/*								Author: Yifu Yao							  */
/*							Last Updated Date: 6/14/2020 					  */
/* -------------------------------------------------------------------------- */

/* ------------------------------- Parameters ------------------------------- */
var request = require('request');
var express = require("express");
var router = express.Router({ mergeParams: true });
var FormData = require('form-data');
var axios = require('axios').default;
var path = require('path');
// const fetch = require('node-fetch');
var sd = require("silly-datetime"),
	fs = require("fs"),
	moment = require("moment"),
	multer = require('multer');

const upload = multer({
	dest: 'data/upload'
});
router.use(upload.any());

var jobInfo = require("../models/jobInfo");
var userInfo = require("../models/userInfo");
var transporter = require("../models/emailConfig");

// max capacity for each user
var maxCapacity = 100 * 1024 * 1024; //100 MB

/* --------------------------------- Routers -------------------------------- */

// JOBINFO: show the current job info
router.get("/upload/:id", function (req, res) {
	var jobId = req.params.id;
	jobId = jobId.substr(1); // delete the ':'

	var flag = 0;
	// var number = taskList.length;
	var number=jobInfo.countDocuments({ status: "Queued" });
	// var num_procs=jobInfo.countDocuments({ status: "Processing" });
	setTimeout( function(){jobInfo.findOne({ _id: jobId }, function (err, doc) {
		if (err) {
			console.error(err);
		}
		if (doc == undefined || doc == null)
			res.render("404");
		else{
			if (doc.status === 'Done') {
				flag = 1;
			}
			else if (doc.status === 'Processing') {
				flag = -1;
			}
			else if (doc.status === 'Failed') {
				flag = 2;
			} 
	
			// =================================
			// Calculating estimated waiting time 
			// the estimated function is: totalSecs = 4 * totalSeqs + 40
			// =================================
			let numberOfSeq = 0;
			let timecal = "";
	
			// When the task is in the waiting queue
			if (flag == 0) {
				res.render("JOBINFO", { jobId: jobId, flag: flag, number: number});

				// only one task in the queue and no job is processing.
				// if (taskList.length == 1 && curJobID == null) {
				// 	jobInfo.findOne({ _id: taskList[0] }, function (err, doc) {
				// 		numberOfSeq = doc.proteins;
				// 		totalSec = numberOfSeq * 4 + 40;
				// 		timecal = Math.floor(totalSec / 60) + 'mins ' + Math.floor(totalSec % 60) + 's';
				// 		res.render("JOBINFO", { jobId: jobId, flag: flag, number: number, time: timecal });
	
				// 	})
				// }
				// // only one task in the queue and a job is processing.
				// else if (taskList.length == 1 && curJobID != null) {
				// 	jobInfo.findOne({ _id: curJobID }, function (err, doc0) {
				// 		numberOfSeq = doc0.proteins;
				// 		jobInfo.findOne({ _id: taskList[0] }, function (err, doc1) {
				// 			numberOfSeq = numberOfSeq + doc1.proteins;
				// 			totalSec = numberOfSeq * 4 + 40;
				// 			timecal = Math.floor(totalSec / 60) + 'mins ' + Math.floor(totalSec % 60) + 's';
				// 			res.render("JOBINFO", { jobId: jobId, flag: flag, number: number, time: timecal });
				// 		});
				// 	})
				// }
				// // More than one tasks in the queue
				// else if (taskList.length > 1 && curJobID != null) {
				// 	jobInfo.findOne({ _id: curJobID }, function (err, doc) {
				// 		numberOfSeq = doc.proteins;
				// 		asyncloopCalculateTime(0, 0, function (temp) {
				// 			numberOfSeq = numberOfSeq + temp;
				// 			totalSec = numberOfSeq * 4 + 40
				// 			timecal = Math.floor(totalSec / 60) + 'mins ' + Math.floor(totalSec % 60) + 's';
				// 			res.render("JOBINFO", { jobId: jobId, flag: flag, number: number, time: timecal });
				// 		});
				// 	})
				// }
				// else res.render("JOBINFO", { jobId: jobId, flag: flag, number: number, time: "...loading..." });// in case 
			}
			// When is task is processing
			else if (flag == -1 ) {
				res.render("JOBINFO", { jobId: jobId, flag: flag, number: number});
				// jobInfo.findOne({ _id: curJobID }, function (err, doc) {
				// 	numberOfSeq = doc.proteins;
				// 	totalSec = numberOfSeq * 4 + 40;
				// 	timecal = Math.floor(totalSec / 60) + 'mins ' + Math.floor(totalSec % 60) + 's';
				// 	res.render("JOBINFO", { jobId: jobId, flag: flag, number: number, time: timecal });
				// })
			}
			else if (flag == 2 ) {
				res.render("JOBINFO", { jobId: jobId, flag: flag, number: number});
			}
			else if (flag == 1) {
				jobInfo.findById(jobId, function (err, job) {
				  if (err)
					console.error(err);
				  else if (job.compress == "No") {
				//   else {
					//  send success email 
					let link = "<center><a href = \"http://mu-loc.org/jobs/:" + job.id + "\">";
					if (job.email !== "") {
						var mail = {
							from: 'MULocDeep<mulocdeep@gmail.com>',
							subject: 'MULocDeep: Job Infomation',
							to: job.email,
							text: 'Your job: ' + job.id + ' has completed!',
							html: '<center><h2>MULocDeep</h2></center><br><center><p> Your job :</p></center><br>' +
								link +
								job.id + '</a></center><br>' +
								"<center><p>has completed!</p></center>"
						};
						transporter.sendMail(mail, function (error, info) {
							if (error) return console.log(error);
							console.log('mail sent:', info.response);
						});
					}

					// -----------------------
					// Compress results data
					// -----------------------
					// create a file to stream archive data to.
					var output = fs.createWriteStream('data/results/' + job.id + '/' + job.id + '.zip');
					var archive = archiver('zip', {
						zlib: { level: 9 } // Sets the compression level.
					});

					// listen for all archive data to be written
					// 'close' event is fired only when a file descriptor is involved
					output.on('close', function () {
						console.log(archive.pointer() + ' total bytes');
						console.log('archiver has been finalized and the output file descriptor has closed.');
						console.log('=======================================================================');
					});

					// This event is fired when the data source is drained no matter what was the data source.
					// It is not part of this library but rather from the NodeJS Stream API.
					output.on('end', function () {
						console.log('Data has been drained');
					});

					// good practice to catch warnings (ie stat failures and other non-blocking errors)
					archive.on('warning', function (err) {
						if (err.code === 'ENOENT') {
							// log warning
						} else {
							// throw error
							throw err;
						}
					});

					// good practice to catch this error explicitly
					archive.on('error', function (err) {
						var update = { $set: { status: 'error' } };
						jobInfo.updateOne({ _id: job.id }, update, function (err, job) {
							if (err) {
								console.log(err);
							}
							else {
								console.log("SOMETHING WENT WRONG WHEN PREDICTING!");
								// console.log(job);
							}
						});
						throw err;
					});

					// pipe archive data to the file
					archive.pipe(output);

					// append a file from stream
					var file1 = 'data/results/' + job.id + '/attention_weights.txt';
					archive.append(fs.createReadStream(file1), { name: 'attention_weights.txt' });
					var file2 = 'data/results/' + job.id + '/sub_cellular_prediction.txt';
					archive.append(fs.createReadStream(file2), { name: 'sub_cellular_prediction.txt' });
					var file3 = 'data/results/' + job.id + '/sub_organellar_prediction.txt';
					archive.append(fs.createReadStream(file3), { name: 'sub_organellar_prediction.txt' });

					// finalize the archive (ie we are done appending files but streams have to finish yet)
					// 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
					archive.finalize();

					// delete pssm folder
					// let readDir = fs.readdirSync('data/results/' + job.id);
					// readDir.forEach(function (item, index) {
					// 	let stat = fs.statSync('data/results/' + job.id + '/' + item)
					// 	if (stat.isDirectory() === true) { 
					// 	  deleteFolder('data/results/' + job.id + '/' + item)
					// 	  console.log('pssm folder delete...');
					// 	}
					// })

					var update = { $set: { compress: "Yes"} };
					jobInfo.updateOne({ _id: job.id }, update, function (err, u) {
						if (err)
							console.log(err);
						else {
							console.log("Job info (compress) was updated!");
							console.log("======================================");
						}
					});



				  }
				});

                    

				res.render("JOBINFO", { jobId: jobId, flag: flag, number: number});
			}
			else res.render("JOBINFO", { jobId: jobId, flag: flag, number: number, time: "...loading..." }); // in case
		}
	})}, 200)
	
});

// Add-on email submit on job info page
router.post("/upload/email", function (req, res) {
	let email = req.body.email.trim();
	let jobID = req.body.jobID.trim();
	jobInfo.findOne({ _id: jobID }, function (err, doc) {
		if (err) console.error(err);
		let update = { $set: { email: email } };
		jobInfo.updateOne({ _id: jobID }, update, function (err, u) {
			if (err)
				console.log(err);
			else {
				console.log("Job email was added!");
				console.log("Email: " + email + " of job:" + jobID);
				console.log("======================================");
			}
		});
	});
});


//Deal with sequence post
router.post("/upload/sequence", function (req, res) {
	var sequence = req.body.sequenceInput.trim();
	var email = req.body.emailInput1;
	var nickName = req.body.nickName1;

	var job = new jobInfo({
		nickName: nickName,
		sequence: sequence,
		email: email,
		status: "Queued",
		// submittedTime: sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
		submittedTime: "",
		ipAddress: get_client_ip(req),
		size: 0,
		proteins: 0,
		compress: "No"
	});
	job.file = job.id + '.fa';

	// Create a new file and write the sequence in
	console.log("Data written ready...");

	fs.writeFileSync('data/upload/' + job.file, format(sequence));
	console.log("Data written success!");
	console.log("======================================");

	// var fileSize = 0;
	var fileSize = fs.statSync('data/upload/' + job.file).size * 30;
	// fs.stat('data/upload/' + job.file, function (err, stats) {
	// 	if (err)
	// 		return console.error(err);
	// 	var fileSize = stats.size * 30;

	var isEnough = 1;

	userInfo.findOne({ 'ipAddress': get_client_ip(req) }, function (err, doc) {
		if (err)
			console.error(err);
		if (doc == undefined) {
			var user = new userInfo({
				ipAddress: get_client_ip(req),
				capacity: fileSize,
				query: 0,
				proteins: 0
			});

			if (user.capacity > maxCapacity) {
				user.capacity = 0;
				isEnough = 0;
			}
			user.save(function (err, u) {
				if (err)
					console.error(err);
				else {
					console.log("Create a new user: " + get_client_ip(req));
					console.log("======================================");
				}
			})
			// ------------------
			// get user location
			// ------------------
			// var locURL = "/process/location/";
			// var locData = {ip: get_client_ip(req)};
			request("http://ip-api.com/json/" + get_client_ip(req) + "?lang=EN", { json: true }, (err, res, body) => {
				if (err) { return console.log(err); }
				var update = { $set: { lat: body.lat, lon: body.lon } };
				userInfo.updateOne({ 'ipAddress': body.query }, update, function (err, u) {
					if (err)
						console.log(err);
					else {
						console.log("User info was updated!");
						console.log("User location: " + body.lat + ", " + body.lon);
						console.log("======================================");
					}
				});
			});
		}
		else {
			if (doc.capacity + fileSize <= maxCapacity) {
				var update = { $set: { capacity: doc.capacity + fileSize } };
				userInfo.updateOne({ 'ipAddress': get_client_ip(req) }, update, function (err, u) {
					if (err)
						console.log(err);
					else {
						console.log("User info was updated!");
						console.log("User size: " + (doc.capacity + fileSize));
						console.log("======================================");
					}
				});
			}
			else isEnough = 0;
		}

		if (isEnough == 1) {

			// taskList.push(job.id);
			console.log("have enough space.")

			job.proteins = getNumofProteins(sequence);
			job.size = fileSize;
			job.save(function (err, job) {
				if (err) {
					console.log("SOMETHING WENT WRONG!");
				}
				else {
					console.log("job size is :" + job.size);
					console.log("Job was saved!");
					console.log("======================================");
				}
			});

			// Update the number of querys of current user
			userInfo.findOne({ 'ipAddress': get_client_ip(req) }, function (err, doc) {
				let update = { $set: { query: doc.query + 1, proteins: doc.proteins + getNumofProteins(sequence) } };
				userInfo.updateOne({ 'ipAddress': get_client_ip(req) }, update, function (err, u) {
					if (err)
						console.log(err);
					else {
						console.log("User info was updated!");
						console.log("User query: " + (doc.query + 1));
						console.log("User Proteins: " + (doc.proteins + getNumofProteins(sequence)));
						console.log("======================================");
					}
				});
			});


			// send job ID email
			let link = "<center><a href = \"http://mu-loc.org/upload/:" + job.id + "\">";
			if (job.email !== "") {
				var mail = {
					from: 'MULocDeep<mulocdeep@gmail.com>',
					subject: 'MULocDeep: Job Infomation',
					to: email,
					text: 'Your job ID is:' + job.id,
					html: '<center><h2>MULocDeep</h2></center><br><center><p> Your job is:</p><br></center>' +
						link +
						job.id + '</a></center>'
				};
				transporter.sendMail(mail, function (error, info) {
					if (error) return console.log(error);
					console.log('mail sent:', info.response);
				});
			}
			console.log("ready to send post request to api...")

			// var options = {
			// 	'method': 'POST',
			// 	'url': 'http://digbio-devel.missouri.edu:5000/predict?',
			// 	'headers': {
			// 	},
			// 	formData: {
			// 	  'sequences': {
			// 		'value': fs.createReadStream('data/upload/' + job.file),
			// 		'options': {
			// 		  'filename': 'data/upload/' + job.file,
			// 		  'contentType': null
			// 		}
			// 	  },
			// 	  'job_nickname': nickName,
			// 	  'email': email,
			// 	  'mode': 'PSSM',
			// 	  'id': job.id
			// 	}
			//   };
			
			// request(options, function (error, response) {
			// 	if (error) throw new Error(error);
			// 	// console.log(response.body);
			// });

			// var formdata = new FormData();
            // formdata.append("sequences", 'data/upload/' + job.file);
            // formdata.append("job_nickname", nickName);
            // formdata.append("email", email);
            // formdata.append("mode", "PSSM");
            // formdata.append("id", job.id);
			// var requestOptions = {
            //     method: 'POST',
            //     body: formdata,
            //     redirect: 'follow'
            // };

            // fetch("mulocdeep_api3:5000/predict?", requestOptions)
            //    .then(response => response.text())
            //    .then(result => console.log(result))
            //    .catch(error => console.log('error', error));

			sendMultipart('data/upload/' + job.file, nickName, email, "PSSM", job.id);

			console.log("request sent...");
			res.redirect("/upload/:" + job.id);




		}
		else {
			fs.unlink('data/upload/' + job.file, function (err) {
				if (err) console.error(err);
			});
			res.render("OUTSPACE");
		}
	});
 
	// });
});

//Deal with file post
router.post("/upload/file", function (req, res) {

	var email = req.body.emailInput2;
	var nickName = req.body.nickName2;
	// if (email !== undefined)
	// 	console.log('email: ' + email);

	var job = new jobInfo({
		nickName: nickName,
		email: email,
		status: "queued",
		// submittedTime: sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
		submittedTime: moment().utcOffset("-06:00").format('YYYY-MM-DD HH:mm:ss'),
		ipAddress: get_client_ip(req),
		size: 0,
		proteins: 0
	});
	job.file = job.id + '.fa';

	var data = fs.readFileSync(req.files[0].path);
	fs.writeFileSync('data/upload/' + job.file, format(data.toString()));
	console.log('File: ' + req.files[0].originalname + ' uploaded successfully');
	console.log("======================================");

	fs.unlink(req.files[0].path, function (err) {
		if (err)
			console.error(err);
	}); //delete the original file

	var fileSize = fs.statSync('data/upload/' + job.file).size * 30;
	// fs.stat('data/upload/' + job.file, function (err, stats) {
	// 	if (err)
	// 		return console.error(err);
	// 	var fileSize = stats.size * 220;

	var isEnough = 1;
	userInfo.findOne({ 'ipAddress': get_client_ip(req) }, function (err, doc) {
		if (err)
			console.error(err);
		if (doc == undefined) {
			var user = new userInfo({
				ipAddress: get_client_ip(req),
				capacity: fileSize,
				query: 0,
				proteins: 0
			});
			if (user.capacity > maxCapacity) {
				user.capacity = 0;
				isEnough = 0;
			}
			user.save(function (err, u) {
				if (err)
					console.error(err);
				else {
					console.log("Create a new user: " + get_client_ip(req));
					console.log("======================================");
				}
			})
			// ------------------
			// get user location
			// ------------------
			// var locURL = "/process/location/";
			// var locData = {ip: get_client_ip(req)};
			request("http://ip-api.com/json/" + get_client_ip(req) + "?lang=EN", { json: true }, (err, res, body) => {
				if (err) { return console.log(err); }
				var update = { $set: { lat: body.lat, lon: body.lon } };
				userInfo.updateOne({ 'ipAddress': body.query }, update, function (err, u) {
					if (err)
						console.log(err);
					else {
						console.log("User info was updated!");
						console.log("User location: " + body.lat + ", " + body.lon);
						console.log("======================================");
					}
				});
			});
		}
		else {
			if (doc.capacity + fileSize <= maxCapacity) {
				var update = { $set: { capacity: doc.capacity + fileSize } };
				userInfo.updateOne({ 'ipAddress': get_client_ip(req) }, update, function (err, u) {
					if (err)
						console.log(err);
					else {
						console.log("User info was updated!");
						console.log("User size: " + (doc.capacity + fileSize));
						console.log("======================================");
					}
				});
			}
			else isEnough = 0;
		}

		if (isEnough == 1) {

			taskList.push(job.id);

			job.proteins = getNumofProteins(data.toString());
			job.size = fileSize;
			job.save(function (err, job) {
				if (err) {
					console.log("SOMETHING WENT WRONG!");
				}
				else {
					console.log("Job was saved!");
					console.log("job size is :" + job.size);
					console.log("======================================");
				}
			});

			// Update the number of querys of current user
			userInfo.findOne({ 'ipAddress': get_client_ip(req) }, function (err, doc) {
				let update = { $set: { query: doc.query + 1, proteins: doc.proteins + getNumofProteins(data.toString()) } };
				userInfo.updateOne({ 'ipAddress': get_client_ip(req) }, update, function (err, u) {
					if (err)
						console.log(err);
					else {
						console.log("User info was updated!");
						console.log("User query: " + (doc.query + 1));
						console.log("User proteins: " + (doc.proteins + getNumofProteins(data.toString())));
						console.log("======================================");
					}
				});
			});

			// send job ID email
			let link = "<center><a href = \"http://mu-loc.org/upload/:" + job.id + "\">";
			if (job.email !== "") {
				var mail = {
					from: 'MULocDeep<mulocdeep@gmail.com>',
					subject: 'MULocDeep: Job Infomation',
					to: email,
					text: 'Your job ID is:' + job.id,
					html: '<center><h2>MULocDeep</h2></center><br><center><p> Your job is:</p><br></center>' +
						link +
						job.id + '</a></center>'
				};
				transporter.sendMail(mail, function (error, info) {
					if (error) return console.log(error);
					console.log('mail sent:', info.response);
				});
			}

			res.redirect("/upload/:" + job.id);
		}
		else {
			fs.unlink('data/upload/' + job.file, function (err) {
				if (err) console.error(err);
			});
			res.render("OUTSPACE");
		}
	});
	// });
});

/* -------------------------------- Functions ------------------------------- */

/**
 * post request
 * @param {*} i
 * @param {*} temp
 * @param {*} callback
 */
function sendMultipart(filePath, job_nick, mail, mode, id) {
    const formData = new FormData();
    const config = { filename: path.basename(filePath), contentType: "multipart/form-data" };
    formData.append('sequences', fs.createReadStream(filePath), config);
    formData.append('job_nickname', job_nick);
    formData.append('email', mail);
    formData.append('mode', mode);
    formData.append('id', id);
    console.log(formData.getHeaders());
    axios.post('http://digbio-devel.missouri.edu:5000/predict', formData, {
        headers: formData.getHeaders()
      })
      .then(function (response) {
        console.log(response.data);
      })
      .catch(function (error) {
        console.log(error);
      }); 

}


/**
 * async loop to calculate waiting time
 * sync loop causes problem when visiting db
 * @param {*} i
 * @param {*} temp
 * @param {*} callback
 */
function asyncloopCalculateTime(i, temp, callback) {
	if (i < taskList.length) {
		jobInfo.findOne({ _id: taskList[i] }, function (err, doc) {
			temp = temp + doc.proteins;
			asyncloopCalculateTime(i + 1, temp, callback);
		})
	}
	else callback(temp);
}


/**
 * Get cur user's IP address
 *
 * @param {*} req
 * @returns
 */
function get_client_ip(req) {
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	ipStr = ip.split(':');
	return ipStr[ipStr.length - 1];
};

/**
 * Change mulit lines seq to one seq
 *
 * @param {*} seq
 * @returns one line seq
 */
function format(seq) {
	let data = seq.trim().split('>');
	var res = "";
	for (let i = 0; i < data.length; i++) {
		let fasta = data[i];

		if (!fasta) continue;
		let lines = fasta.split(/\r?\n/);
		res = res + '>' + lines[0] + '\n';
		lines.splice(0, 1);
		// join the array back into a single string without newlines and 
		// trailing or leading spaces
		fasta = lines.join('').trim();
		res = res + fasta + '\n';
	}
	// console.log(res);
	return res.trim();
}


/**
 * Get the number of proteins of cur protein
 * 
 * @param {*} seq
 * @returns
 */
function getNumofProteins(seq) {
	return seq.trim().split('>').length - 1;
}

module.exports = router;