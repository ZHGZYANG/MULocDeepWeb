/* -------------------------------------------------------------------------- */
/*                           	  Router Module   		                      */
/*								Author: Yifu Yao							  */
/*							Last Updated Date: 6/14/2020 					  */
/* -------------------------------------------------------------------------- */

/* ------------------------------- Parameters ------------------------------- */
var express = require("express");
var router = express.Router({ mergeParams: true });
var sd = require("silly-datetime"),
	fs = require("fs"),
	archiver = require('archiver'),
	schedule = require("node-schedule"),
	moment = require("moment"),
	request = require("request");
exec = require('child_process').exec;

var jobInfo = require("../models/jobInfo");
var userInfo = require("../models/userInfo");
var transporter = require("../models/emailConfig");

// Set Process Count and Wailting List
taskList = [];
curJobID = null;
var curProcess = 0;

/* --------------------------------- Routers -------------------------------- */
// Landing page
router.get("/", function (req, res) {
	userInfo.findOne({ 'ipAddress': get_client_ip(req) }, function (err, doc) {
		if (err)
			console.error(err);
		if (doc == undefined) {
			var user = new userInfo({
				ipAddress: get_client_ip(req),
				capacity: 0,
				query: 0,
				proteins: 0
			});

			user.save(function (err, u) {
				if (err)
					console.error(err);
				else {
					console.log("Create a new user: " + get_client_ip(req));
					console.log("======================================");
				}
			})
		}
		else {
			reset_client(doc);

	    } 
    });	
	// console.log(get_client_ip(req));
	res.render("UPLOAD");
});




// Other tools page
router.get("/tools", function (req, res) {
	res.render("TOOLS");
});

/* -------------------------------- Functions ------------------------------- */

/** Schedule task to run predicting job
 * Cur schedule: per 5s
*/
var rule = new schedule.RecurrenceRule();
var ruleTime = [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56];
rule.second = ruleTime;


/** Schedule task to clean data per 3 days
 * Cur schedule: 06:00:00 every day(UTC)
*/
// schedule.scheduleJob('0 * * * * *', function () {
schedule.scheduleJob('0 0 6 * * *', function () {
	console.log("Schedule jobs cleaning begins...");
	var curTime = moment().utcOffset("-06:00").format('YYYY-MM-DD HH:mm:ss');
	var curDay = parseInt(curTime.substring(8, 10));
	var curMonth = parseInt(curTime.substring(5, 7));
	var curYear = parseInt(curTime.substring(0, 4));
	curDay -= 3;
	if (curDay <= 0) {
		curDay = 30 + curDay;
		curMonth--;
		if (curMonth <= 0) {
			curMonth = 12 + curMonth;
			curYear--;
		}
	}

	var curDayStr = '';
	if (curDay < 10) {
		curDayStr = '0' + curDay;
	}
	else curDayStr = curDay;
	var curMonthStr = '';
	if (curMonth < 10){
		curMonthStr = '0' + curMonth;
	}
	else curMonthStr = curMonth;

	var due = curYear + "-" + curMonthStr + "-" + curDayStr + " 00:00:00";
	// var due = '2020' + "-" + curMonth + "-" + curDay + " 00:00:00";

	jobInfo.find({ 'submittedTime': { $lte: due } }, function (err, docs) {
		if (err)
			return console.error(err);
		if (docs != undefined) {
			asyncLoopScheduleClean(0, docs, function () {
				jobInfo.deleteMany({ 'submittedTime': { $lte: due } }, function (err) {
					if (err)
						return console.error(err);
					console.log("Clean Old Tasks Historys and Files at:" + curTime);

					// Adjust space if user space equals to 0
					userInfo.find({}, function (err, docs) {
						for (let i = 0; i < docs.length; i++) {
							let ip = docs[i].ipAddress;
							jobInfo.find({ 'ipAddress': ip }, function (err, docs) {
								if (docs == undefined || docs.length == 0) {
									let update = { $set: { capacity: 0 } };
									userInfo.updateOne({ 'ipAddress': ip }, update, function (err, d) {
									});
								}
							})
						}
						console.log("Space Adjust Completed...");
					})
				});
			});
		}
	});
});

/**
 * Delete cur folder and all items in it
 * @param {*} path: Deleted folder path
 */
function deleteFolder(path) {
	let files = [];
	if (fs.existsSync(path)) {
		files = fs.readdirSync(path);
		files.forEach(function (file, index) {
			let curPath = path + "/" + file;
			if (fs.statSync(curPath).isDirectory()) {
				deleteFolder(curPath);
			} else {
				fs.unlink(curPath, function (err) {
					if (err) console.error(err);
				});
			}
		});
		files = fs.readdirSync(path);
		while (files.length != 0) {
			files = fs.readdirSync(path);
		}
		fs.rmdir(path, function (err) {
			if (err) console.error(err);
		});
	}
}

/**
 * async loop to delete jobs
 * sync loop will cause problem when visiting db
 * @param {*} i: cur index in docs
 * @param {*} docs: results from finding
 * @param {*} callback: callback function
 */
function asyncLoopScheduleClean(i, docs, callback) {
	if (i < docs.length) {
		let dUser = docs[i].ipAddress;
		let fileSize = docs[i].size;
		let dFile = docs[i].file;
		let dID = docs[i].id;
		userInfo.findOne({ 'ipAddress': dUser }, function (err, user) {
			if (err) {
				console.error(err);
			}

			var update = { $set: { capacity: user.capacity - fileSize } };
			userInfo.updateOne({ 'ipAddress': dUser }, update, function (err, u) {
				if (err)
					console.error(err);
				deleteFolder('data/results/' + dID);
				fs.unlink(dFile, function (err) {
					if (err) console.error(err);
				});
				asyncLoopScheduleClean(i + 1, docs, callback);
			});
		});
	}
	else {
		callback();
	}
}

function get_client_ip(req) {
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	ipStr = ip.split(':');
	return ipStr[ipStr.length - 1];
};

function reset_client(doc) {
	if(doc.query == undefined)
		doc.query = 0;
	if(doc.capacity == undefined)
		doc.capacity = 0;
	if(doc.proteins == undefined)
		doc.proteins = 0;

};

module.exports = router;