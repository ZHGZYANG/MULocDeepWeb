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
	var number = 0;
	// var number = taskList.length;
	jobInfo.countDocuments({ status: "Queued" }, function (err, count){
		if (err){ 
			console.log(err);
		}else{ 
			var number = count;
			// console.log("Count:", count);
		} 
	});
	// var num_procs=jobInfo.countDocuments({ status: "Processing" });
	setTimeout( function(){jobInfo.findOne({ job_id: jobId }, function (err, doc) {
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
				// jobInfo.findOne({ job_id: jobId }, function (err, job) {
				//   if (err)
				// 	console.error(err);
				//   else if (job.compress == "No") {
				// //   else {
				// 	//  send success email 
				// 	let link = "<center><a href = \"http://mu-loc.org/jobs/:" + job.id + "\">";
				// 	if (job.email !== "") {
				// 		var mail = {
				// 			from: 'MULocDeep<mulocdeep@gmail.com>',
				// 			subject: 'MULocDeep: Job Infomation',
				// 			to: job.email,
				// 			text: 'Your job: ' + job.id + ' has completed!',
				// 			html: '<center><h2>MULocDeep</h2></center><br><center><p> Your job :</p></center><br>' +
				// 				link +
				// 				job.id + '</a></center><br>' +
				// 				"<center><p>has completed!</p></center>"
				// 		};
				// 		transporter.sendMail(mail, function (error, info) {
				// 			if (error) return console.log(error);
				// 			console.log('mail sent:', info.response);
				// 		});
				// 	}

				// 	// -----------------------
				// 	// Compress results data
				// 	// -----------------------
				// 	// create a file to stream archive data to.
				// 	var output = fs.createWriteStream('data/results/' + job.id + '/' + job.id + '.zip');
				// 	var archive = archiver('zip', {
				// 		zlib: { level: 9 } // Sets the compression level.
				// 	});

				// 	// listen for all archive data to be written
				// 	// 'close' event is fired only when a file descriptor is involved
				// 	output.on('close', function () {
				// 		console.log(archive.pointer() + ' total bytes');
				// 		console.log('archiver has been finalized and the output file descriptor has closed.');
				// 		console.log('=======================================================================');
				// 	});

				// 	// This event is fired when the data source is drained no matter what was the data source.
				// 	// It is not part of this library but rather from the NodeJS Stream API.
				// 	output.on('end', function () {
				// 		console.log('Data has been drained');
				// 	});

				// 	// good practice to catch warnings (ie stat failures and other non-blocking errors)
				// 	archive.on('warning', function (err) {
				// 		if (err.code === 'ENOENT') {
				// 			// log warning
				// 		} else {
				// 			// throw error
				// 			throw err;
				// 		}
				// 	});

				// 	// good practice to catch this error explicitly
				// 	archive.on('error', function (err) {
				// 		var update = { $set: { status: 'error' } };
				// 		jobInfo.updateOne({ job_id: job.id }, update, function (err, job) {
				// 			if (err) {
				// 				console.log(err);
				// 			}
				// 			else {
				// 				console.log("SOMETHING WENT WRONG WHEN PREDICTING!");
				// 				// console.log(job);
				// 			}
				// 		});
				// 		throw err;
				// 	});

				// 	// pipe archive data to the file
				// 	archive.pipe(output);

				// 	// append a file from stream
				// 	var file1 = 'data/results/' + job.id + '/attention_weights.txt';
				// 	archive.append(fs.createReadStream(file1), { name: 'attention_weights.txt' });
				// 	var file2 = 'data/results/' + job.id + '/sub_cellular_prediction.txt';
				// 	archive.append(fs.createReadStream(file2), { name: 'sub_cellular_prediction.txt' });
				// 	var file3 = 'data/results/' + job.id + '/sub_organellar_prediction.txt';
				// 	archive.append(fs.createReadStream(file3), { name: 'sub_organellar_prediction.txt' });

				// 	// finalize the archive (ie we are done appending files but streams have to finish yet)
				// 	// 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
				// 	archive.finalize();

				// 	// delete pssm folder
				// 	// let readDir = fs.readdirSync('data/results/' + job.id);
				// 	// readDir.forEach(function (item, index) {
				// 	// 	let stat = fs.statSync('data/results/' + job.id + '/' + item)
				// 	// 	if (stat.isDirectory() === true) { 
				// 	// 	  deleteFolder('data/results/' + job.id + '/' + item)
				// 	// 	  console.log('pssm folder delete...');
				// 	// 	}
				// 	// })

				// 	var update = { $set: { compress: "Yes"} };
				// 	jobInfo.updateOne({ job_id: job.id }, update, function (err, u) {
				// 		if (err)
				// 			console.log(err);
				// 		else {
				// 			console.log("Job info (compress) was updated!");
				// 			console.log("======================================");
				// 		}
				// 	});



				//   }
				// });

                    

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
	jobInfo.findOne({ job_id: jobID }, function (err, doc) {
		if (err) console.error(err);
		let update = { $set: { email: email } };
		jobInfo.updateOne({ job_id: jobID }, update, function (err, u) {
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


/* -------------------------------- Functions ------------------------------- */

/**
 * async loop to calculate waiting time
 * sync loop causes problem when visiting db
 * @param {*} i
 * @param {*} temp
 * @param {*} callback
 */
function asyncloopCalculateTime(i, temp, callback) {
	if (i < taskList.length) {
		jobInfo.findOne({ job_id: taskList[i] }, function (err, doc) {
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