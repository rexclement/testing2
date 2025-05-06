const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
    eventName: { type: String, required: true },
    year: { type: String, required: true },
    date: { type: String },
    place: { type: String },
    flier: { type: String }, // Storing the image URL
    flier_public_id: { type: String },
    participants_count: { type: Number },
    description: { type: String },
    outcome: { type: String },
    Accepted_Jesus: { type: Number }, // camelCase for consistency
    Non_Christian_Accept_Jesus: { type: Number }, // camelCase and removed comma
    order: Number,
});

const eventdb = mongoose.model("Event", EventSchema);
module.exports = eventdb;
