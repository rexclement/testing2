const mongoose = require("mongoose");

const CollegeCellSchema = new mongoose.Schema({
    institution: { type: String, required: true },
    prayerCellName: { type: String, required: true },
    cellType: { type: String },
    locationType: { type: String },
    gender: { type: String }, // Storing the image URL
    timesHeld: { type: Number },
    avgParticipants: { type: Number },
    handledBy: { type: String },
    remark: { type: String },
    order: Number,
});

const collegedb = mongoose.model("College_Cell_details", CollegeCellSchema );

const SchoolCellSchema = new mongoose.Schema({
    institution: { type: String, required: true },
    prayerCellName: { type: String, required: true },
    cellType: { type: String },
    locationType: { type: String },
    gender: { type: String }, // Storing the image URL
    timesHeld: { type: Number },
    avgParticipants: { type: Number },
    handledBy: { type: String },
    remark: { type: String },
    order: Number,
});

const schooldb = mongoose.model("School_Cell_details", SchoolCellSchema);

module.exports = {
    collegedb,
    schooldb
};