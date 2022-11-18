/* -------------------------------------------------------------------------- */
/*                       	Jobs Schema Configuration File                    */
/*								Author: Yifu Yao							  */
/*							Last Updated Date: 6/14/2020 					  */
/* -------------------------------------------------------------------------- */

var mongoose = require("mongoose");

var jobInfoSchema = new mongoose.Schema({
	job_id: String,
	task_id: String,
	nickName: String,
	sequence: String,
	file: String,
	output_dir: String,
	existPSSM: String,
	email: String,
	status: String,
	submittedTime: String,
	ipAddress: String,
	size: Number,
	proteins: Number,
	results: String,
	compress: String
});

module.exports = mongoose.model("jobInfo", jobInfoSchema);