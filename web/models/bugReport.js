/* -------------------------------------------------------------------------- */
/*                       	Bug Report Schema Configuration File              */
/*								Author: Ziyang Zhang						  */
/*							Last Updated Date: 04/06/2020 					  */
/* -------------------------------------------------------------------------- */

var mongoose = require("mongoose");

var bugReportSchema = new mongoose.Schema({
	description: String,
	ipAddress: String,
	name: String,
	email: String,
    jobID: String,
});

module.exports = mongoose.model("bugReport", bugReportSchema);