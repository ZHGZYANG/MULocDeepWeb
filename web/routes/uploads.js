/* -------------------------------------------------------------------------- */
/*                            Upload Router Module 		                      */
/*								Author: Yifu Yao							  */
/*							Last Updated Date: 6/14/2020 					  */
/* -------------------------------------------------------------------------- */

/* ------------------------------- Parameters ------------------------------- */

var express = require("express");
var router = express.Router({ mergeParams: true });
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
	var number = 1;
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