/* -------------------------------------------------------------------------- */
/*                             Jobs Router Module  		                      */
/*								Author: Yifu Yao							  */
/*							Last Updated Date: 6/14/2020 					  */
/* -------------------------------------------------------------------------- */

/* ------------------------------- Parameters ------------------------------- */

var express = require("express");
var router = express.Router();
var fs = require("fs");
var request = require("request");

var jobInfo = require("../models/jobInfo");
var userInfo = require("../models/userInfo");
var bugReport = require("../models/bugReport");

var mongoose = require('mongoose');

/* --------------------------------- Routers -------------------------------- */

// SEARCH: show the search page
router.get("/jobs", function (req, res) {
	res.render("SEARCH");
});

// REPORT: report bug of jobs
router.get("/jobs/report", function (req, res) {
    res.render("REPORT", {ip: get_client_ip(req)});
});

// REPORT: report bug of jobs
router.post("/jobs/report", function (req, res) {
    var punctuationRegEx = /[!-/:-@[-`{-~¡-©«-¬®-±´¶-¸»¿×÷˂-˅˒-˟˥-˫˭˯-˿͵;΄-΅·϶҂՚-՟։-֊־׀׃׆׳-״؆-؏؛؞-؟٪-٭۔۩۽-۾܀-܍߶-߹।-॥॰৲-৳৺૱୰௳-௺౿ೱ-ೲ൹෴฿๏๚-๛༁-༗༚-༟༴༶༸༺-༽྅྾-࿅࿇-࿌࿎-࿔၊-၏႞-႟჻፠-፨᎐-᎙᙭-᙮᚛-᚜᛫-᛭᜵-᜶។-៖៘-៛᠀-᠊᥀᥄-᥅᧞-᧿᨞-᨟᭚-᭪᭴-᭼᰻-᰿᱾-᱿᾽᾿-῁῍-῏῝-῟῭-`´-῾\u2000-\u206e⁺-⁾₊-₎₠-₵℀-℁℃-℆℈-℉℔№-℘℞-℣℥℧℩℮℺-℻⅀-⅄⅊-⅍⅏←-⏧␀-␦⑀-⑊⒜-ⓩ─-⚝⚠-⚼⛀-⛃✁-✄✆-✉✌-✧✩-❋❍❏-❒❖❘-❞❡-❵➔➘-➯➱-➾⟀-⟊⟌⟐-⭌⭐-⭔⳥-⳪⳹-⳼⳾-⳿⸀-\u2e7e⺀-⺙⺛-⻳⼀-⿕⿰-⿻\u3000-〿゛-゜゠・㆐-㆑㆖-㆟㇀-㇣㈀-㈞㈪-㉃㉐㉠-㉿㊊-㊰㋀-㋾㌀-㏿䷀-䷿꒐-꓆꘍-꘏꙳꙾꜀-꜖꜠-꜡꞉-꞊꠨-꠫꡴-꡷꣎-꣏꤮-꤯꥟꩜-꩟﬩﴾-﴿﷼-﷽︐-︙︰-﹒﹔-﹦﹨-﹫！-／：-＠［-｀｛-･￠-￦￨-￮￼-�]|\ud800[\udd00-\udd02\udd37-\udd3f\udd79-\udd89\udd90-\udd9b\uddd0-\uddfc\udf9f\udfd0]|\ud802[\udd1f\udd3f\ude50-\ude58]|\ud809[\udc00-\udc7e]|\ud834[\udc00-\udcf5\udd00-\udd26\udd29-\udd64\udd6a-\udd6c\udd83-\udd84\udd8c-\udda9\uddae-\udddd\ude00-\ude41\ude45\udf00-\udf56]|\ud835[\udec1\udedb\udefb\udf15\udf35\udf4f\udf6f\udf89\udfa9\udfc3]|\ud83c[\udc00-\udc2b\udc30-\udc93]/g;

    var report = new bugReport({
        ipAddress: get_client_ip(req),
        description: 'Description: ' + req.body.description,
        name: req.body.name,
        email: req.body.email,
        jobID: req.body.jobID.replace(punctuationRegEx, '').replace(/(\s){2,}/g, '$1'),

    });
    report.save(function (err, u) {
        if (err)
            console.error(err);
        else {
            console.log("Create a new report: " + get_client_ip(req));
        }
    });
    res.send('200');
});

// JOBSLIST: show all jos
router.get("/jobs/all", function (req, res) {
	jobInfo.find({ 'ipAddress': get_client_ip(req) }, function (err, docs) {
		if (err)
			console.error(err);
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
				// ------------------
				// get user location
				// ------------------
				// var locURL = "/process/location/";
				// var locData = { ip: get_client_ip(req) };
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
				// $.post(locURL, locData, function (data, status) {
				// 	console.log("get user location");
				// });
				res.render("JOBSLIST", { docs: docs, ip: get_client_ip(req), capacity: 0 });
			}
			else res.render("JOBSLIST", { docs: docs, ip: get_client_ip(req), capacity: doc.capacity });
		});
	});
});

// SHOW: show result
router.get("/jobs/:id", function (req, res) {
	var jobId = req.params.id;
	if (jobId != "example")
		jobId = jobId.substr(1);

	fs.exists('data/results/' + jobId + '/attention_weights.txt', function (exists) {
		if (!exists) {
			res.render("404");
		}
		else {
			// ============================
			// analysis result data
			// ============================
			// -----------------
			// Seq name and seq
			// -----------------
			var names = [];
			var seq = [];
			var arr = fs.readFileSync('data/upload/' + jobId + '.fa_tem').toString().replace(/^[\n|\r\n]*|[\n|\r\n]*$/g, '').split(/\r\n|\n\r|[\n\r]/);
			for (var i = 0; i < arr.length; i++)
				if (i % 2 == 0) {
					names.push(arr[i]);
				}
				else {
					seq.push(arr[i]);
				}

			// console.log(names);
			// console.log(seq);

			// --------
			// weights
			// --------
			var weights = [];
			var arr2 = fs.readFileSync('data/results/' + jobId + '/attention_weights.txt').toString().replace(/^[\n|\r\n]*|[\n|\r\n]*$/g, '').split(/\r\n|\n\r|[\n\r]/);
			for (var i = 0; i < arr2.length; i++) {
				if (i % 2 != 0) {
					let temp = [];
					let strarr = arr2[i].split(' ');
					for (var j = 0; j < strarr.length; j++) {
						temp.push(parseFloat(strarr[j]));
					}
					weights.push(temp);
				}
			}
			// console.log(weights);

			// ------------------------
			// sub_cellular_prediction
			// ------------------------
			var cellular = [];
			var arr3 = fs.readFileSync('data/results/' + jobId + '/sub_cellular_prediction.txt').toString().split('>');
			for (var i = 1; i < arr3.length; i++) {
				let strarr = arr3[i].replace(/^[\n|\r\n]*|[\n|\r\n]*$/g, '').replace('/\r\n|\n\r|[\n\r]/', '').split('\t');
				// console.log(strarr);
				let name = '>' + strarr[0].replace(':', '');

				let cur = {
					seqName: name,
					Nucleus: parseFloat(parseFloat(strarr[1].substring(strarr[1].indexOf(':') + 1)).toFixed(5)),
					Cytoplasm: parseFloat(parseFloat(strarr[2].substring(strarr[2].indexOf(':') + 1)).toFixed(5)),
					Secreted: parseFloat(parseFloat(strarr[3].substring(strarr[3].indexOf(':') + 1)).toFixed(5)),
					Mitochondrion: parseFloat(parseFloat(strarr[4].substring(strarr[4].indexOf(':') + 1)).toFixed(5)),
					Membrane: parseFloat(parseFloat(strarr[5].substring(strarr[5].indexOf(':') + 1)).toFixed(5)),
					Endoplasmic: parseFloat(parseFloat(strarr[6].substring(strarr[6].indexOf(':') + 1)).toFixed(5)),
					Plastid: parseFloat(parseFloat(strarr[7].substring(strarr[7].indexOf(':') + 1)).toFixed(5)),
					Golgi_apparatus: parseFloat(parseFloat(strarr[8].substring(strarr[8].indexOf(':') + 1)).toFixed(5)),
					Lysosome: parseFloat(parseFloat(strarr[9].substring(strarr[9].indexOf(':') + 1)).toFixed(5)),
					Peroxisome: parseFloat(parseFloat(strarr[10].substring(strarr[10].indexOf(':') + 1)).toFixed(5)),
					Predict: strarr[11].substring(strarr[11].indexOf(':') + 1)
				};
				cellular.push(cur);
			}

			var arr_predict = fs.readFileSync('data/results/' + jobId + '/sub_cellular_prediction.txt').toString().split('>');
			var predictions = {};
			for (var i = 1; i < arr_predict.length; i++) {
				let strarr = arr_predict[i].replace(/^[\n|\r\n]*|[\n|\r\n]*$/g, '').replace('/\r\n|\n\r|[\n\r]/', '').split('\t');
				// console.log(strarr);
				let name = '>' + strarr[0].replace(':', '');

				let predict = {
					seqName: name,
					Nucleus: parseFloat(parseFloat(strarr[1].substring(strarr[1].indexOf(':') + 1)).toFixed(5)),
					Cytoplasm: parseFloat(parseFloat(strarr[2].substring(strarr[2].indexOf(':') + 1)).toFixed(5)),
					Secreted: parseFloat(parseFloat(strarr[3].substring(strarr[3].indexOf(':') + 1)).toFixed(5)),
					Mitochondrion: parseFloat(parseFloat(strarr[4].substring(strarr[4].indexOf(':') + 1)).toFixed(5)),
					Membrane: parseFloat(parseFloat(strarr[5].substring(strarr[5].indexOf(':') + 1)).toFixed(5)),
					Endoplasmic: parseFloat(parseFloat(strarr[6].substring(strarr[6].indexOf(':') + 1)).toFixed(5)),
					Plastid: parseFloat(parseFloat(strarr[7].substring(strarr[7].indexOf(':') + 1)).toFixed(5)),
					Golgi_apparatus: parseFloat(parseFloat(strarr[8].substring(strarr[8].indexOf(':') + 1)).toFixed(5)),
					Lysosome: parseFloat(parseFloat(strarr[9].substring(strarr[9].indexOf(':') + 1)).toFixed(5)),
					Peroxisome: parseFloat(parseFloat(strarr[10].substring(strarr[10].indexOf(':') + 1)).toFixed(5)),
					Predict: strarr[11].substring(strarr[11].indexOf(':') + 1)
				};
				var unic_pred_list = predict["Predict"].split('|');
				if(unic_pred_list.length==1){
					var j=0;
					var unic_pred=unic_pred_list[j];
					if(predictions[unic_pred] !== undefined){
						predictions[unic_pred] += 1
					}
					else{
						predictions[unic_pred] = 1
					}
				}
				else{
					for (var j=0; j<unic_pred_list.length-1; j++){
						var unic_pred=unic_pred_list[j];
						if(predictions[unic_pred] !== undefined){
							predictions[unic_pred] += 1
						}
						else{
							predictions[unic_pred] = 1
						}
					}
				}
			}
			// console.log(cellular);
			// console.log(arr3);

			// -------------------------
			// sub_organellar_prediction
			// -------------------------
			var organellar = [];
			var arr4 = fs.readFileSync('data/results/' + jobId + '/sub_organellar_prediction.txt').toString().split('>');
			for (var i = 1; i < arr4.length; i++) {
				let strarr = arr4[i].replace(/^[\n|\r\n]*|[\n|\r\n]*$/g, '').replace('/\r\n|\n\r|[\n\r]/', '').split('\t');
				// console.log(strarr);
				let name = '>' + strarr[0].replace(':', '');

				let cur = {
					Nucleus_nucleolus: parseFloat(parseFloat(strarr[1].substring(strarr[1].indexOf(':') + 1)).toFixed(5)),
					Nucleus_nucleoplasm: parseFloat(parseFloat(strarr[2].substring(strarr[2].indexOf(':') + 1)).toFixed(5)),
					Nucleus_membrane: parseFloat(parseFloat(strarr[3].substring(strarr[3].indexOf(':') + 1)).toFixed(5)),
					Nucleus_matrix: parseFloat(parseFloat(strarr[4].substring(strarr[4].indexOf(':') + 1)).toFixed(5)),
					Nucleus_speckle: parseFloat(parseFloat(strarr[5].substring(strarr[5].indexOf(':') + 1)).toFixed(5)),
					Nucleus_PML_body: parseFloat(parseFloat(strarr[6].substring(strarr[6].indexOf(':') + 1)).toFixed(5)),
					Nucleus_Cajal_body: parseFloat(parseFloat(strarr[7].substring(strarr[7].indexOf(':') + 1)).toFixed(5)),
					Chromosome: parseFloat(parseFloat(strarr[8].substring(strarr[8].indexOf(':') + 1)).toFixed(5)),
					Cytoplasmic_vesicle: parseFloat(parseFloat(strarr[9].substring(strarr[9].indexOf(':') + 1)).toFixed(5)),
					Cytoplasm_cytoskeleton: parseFloat(parseFloat(strarr[10].substring(strarr[10].indexOf(':') + 1)).toFixed(5)),
					Cytoplasm_myofibril: parseFloat(parseFloat(strarr[11].substring(strarr[11].indexOf(':') + 1)).toFixed(5)),
					Cytoplasm_cytosol: parseFloat(parseFloat(strarr[12].substring(strarr[12].indexOf(':') + 1)).toFixed(5)),
					Cytoplasm_perinuclear_region: parseFloat(parseFloat(strarr[13].substring(strarr[13].indexOf(':') + 1)).toFixed(5)),
					Cytoplasm_cell_cortex: parseFloat(parseFloat(strarr[14].substring(strarr[14].indexOf(':') + 1)).toFixed(5)),
					Cytoplasmic_granule: parseFloat(parseFloat(strarr[15].substring(strarr[15].indexOf(':') + 1)).toFixed(5)),
					Cytoplasm_P_body: parseFloat(parseFloat(strarr[16].substring(strarr[16].indexOf(':') + 1)).toFixed(5)),
					Secreted_exosome: parseFloat(parseFloat(strarr[17].substring(strarr[17].indexOf(':') + 1)).toFixed(5)),
					Secreted_extracellular_space: parseFloat(parseFloat(strarr[18].substring(strarr[18].indexOf(':') + 1)).toFixed(5)),
					Mitochondrion_inner_membrane: parseFloat(parseFloat(strarr[19].substring(strarr[19].indexOf(':') + 1)).toFixed(5)),
					Mitochondrion_intermembrane_space: parseFloat(parseFloat(strarr[20].substring(strarr[20].indexOf(':') + 1)).toFixed(5)),
					Mitochondrion_outer_membrane: parseFloat(parseFloat(strarr[21].substring(strarr[21].indexOf(':') + 1)).toFixed(5)),
					Mitochondrion_matrix: parseFloat(parseFloat(strarr[22].substring(strarr[22].indexOf(':') + 1)).toFixed(5)),
					Mitochondrion_membrane: parseFloat(parseFloat(strarr[23].substring(strarr[23].indexOf(':') + 1)).toFixed(5)),
					Membrane_clathrin_coated_pit: parseFloat(parseFloat(strarr[24].substring(strarr[24].indexOf(':') + 1)).toFixed(5)),
					Membrane_coated_pit: parseFloat(parseFloat(strarr[25].substring(strarr[25].indexOf(':') + 1)).toFixed(5)),
					Membrane_raft: parseFloat(parseFloat(strarr[26].substring(strarr[26].indexOf(':') + 1)).toFixed(5)),
					Membrane_caveola: parseFloat(parseFloat(strarr[27].substring(strarr[27].indexOf(':') + 1)).toFixed(5)),
					Cell_membrane: parseFloat(parseFloat(strarr[28].substring(strarr[28].indexOf(':') + 1)).toFixed(5)),
					Cell_surface: parseFloat(parseFloat(strarr[29].substring(strarr[29].indexOf(':') + 1)).toFixed(5)),
					Endoplasmic_reticulum_lumen: parseFloat(parseFloat(strarr[30].substring(strarr[30].indexOf(':') + 1)).toFixed(5)),
					Endoplasmic_reticulum_membrane: parseFloat(parseFloat(strarr[31].substring(strarr[31].indexOf(':') + 1)).toFixed(5)),
					Endoplasmic_reticulum_Golgi_intermediate_compartment: parseFloat(parseFloat(strarr[32].substring(strarr[32].indexOf(':') + 1)).toFixed(5)),
					Microsome: parseFloat(parseFloat(strarr[33].substring(strarr[33].indexOf(':') + 1)).toFixed(5)),
					Sarcoplasmic_reticulum: parseFloat(parseFloat(strarr[34].substring(strarr[34].indexOf(':') + 1)).toFixed(5)),
					Plastid_amyloplast: parseFloat(parseFloat(strarr[35].substring(strarr[35].indexOf(':') + 1)).toFixed(5)),
					Plastid_chloroplast_membrane: parseFloat(parseFloat(strarr[36].substring(strarr[36].indexOf(':') + 1)).toFixed(5)),
					Plastid_chloroplast_stroma: parseFloat(parseFloat(strarr[37].substring(strarr[37].indexOf(':') + 1)).toFixed(5)),
					Plastid_chloroplast_thylakoid_lumen: parseFloat(parseFloat(strarr[38].substring(strarr[38].indexOf(':') + 1)).toFixed(5)),
					Plastid_chloroplast_thylakoid_membrane: parseFloat(parseFloat(strarr[39].substring(strarr[39].indexOf(':') + 1)).toFixed(5)),
					Golgi_apparatus_trans_Golgi_network: parseFloat(parseFloat(strarr[40].substring(strarr[40].indexOf(':') + 1)).toFixed(5)),
					Golgi_apparatus_cis_Golgi_network: parseFloat(parseFloat(strarr[41].substring(strarr[41].indexOf(':') + 1)).toFixed(5)),
					Golgi_apparatus_membrane: parseFloat(parseFloat(strarr[42].substring(strarr[42].indexOf(':') + 1)).toFixed(5)),
					Golgi_apparatus_Golgi_stack_membrane: parseFloat(parseFloat(strarr[43].substring(strarr[43].indexOf(':') + 1)).toFixed(5)),
					Lysosome_membrane: parseFloat(parseFloat(strarr[44].substring(strarr[44].indexOf(':') + 1)).toFixed(5)),
					Peroxisome_membrane: parseFloat(parseFloat(strarr[45].substring(strarr[45].indexOf(':') + 1)).toFixed(5)),
					Prediction: strarr[46].substring(strarr[46].indexOf(':') + 1)
				}
				organellar.push(cur);
			}
			// console.log(organellar);
			//console.log(predictions);

			if (jobId == "example")
				res.render("EXAMPLE", { names: names, seq: seq, weights: weights, cellular: cellular, organellar: organellar, jobId: jobId, predictions: predictions });
			else
				res.render("SHOW", { names: names, seq: seq, weights: weights, cellular: cellular, organellar: organellar, jobId: jobId, predictions: predictions });
		}
	});
});

// Show visualisation
router.get("/jobs/population/:combindedID", function (req, res) {
	var predictionId = req.params.combindedID.toString().split('|')[1];
	var jobId = req.params.combindedID.toString().split('|')[0];
	res.render("POPULATION",{jobId:jobId, predictionId:predictionId});
});

router.get("/jobs/population2/:id/:predictionId", function (req, res) {
	var predictionId = req.params.predictionId;
	var jobId =  req.params.id;
	res.render("POPULATION",{jobId:jobId, predictionId:predictionId});
});

// DOWNLOAD: download the result file
router.get("/jobs/download/:id", function (req, res) {
	var id = req.params.id.substr(1);
	res.download("data/results/" + id + '/' + id + '.zip');
});

// DELETE: delete the selected job
router.post("/jobs/delete/:id", function (req, res) {
	var job = req.params.id.substr(1);
	// console.log(job);

	// delete jobs
	jobInfo.findOne({ _id: job }, function (err, doc) {
		if (err)
			return console.error(err);
		if (doc != undefined) {
			let fileSize = doc.size;
			userInfo.findOne({ 'ipAddress': get_client_ip(req) }, function (err, doc) {
				if (err)
					console.error(err);
				if (doc != undefined) {
					var update = { $set: { capacity: doc.capacity - fileSize } };
					userInfo.updateOne({ 'ipAddress': get_client_ip(req) }, update, function (err, u) {
						if (err)
							console.log(err);
						else {
							console.log("User info was updated!");
							console.log("User Size: " + (doc.capacity - fileSize));
						}
					});
				}
			});

			var dFile = doc.file;
			deleteFolder('data/results/' + doc.id);
			fs.unlink('data/upload/' + dFile, function (err) {
				if (err) console.error(err);
			});
		}
		return console.log("Delete files of the job: " + job);
	});
	jobInfo.deleteOne({ _id: job }, function (err) {
		if (err)
			return console.error(err);
		console.log("Delete log of the job:" + job);
		return console.log("======================================");
	});
});


/* -------------------------------- Functions ------------------------------- */

/**
 * get cur user ip address
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
		while(files.length != 0){
			files = fs.readdirSync(path);
		}
		fs.rmdir(path, function (err) {
			if (err) console.error(err);
		});
	}
}

module.exports = router;