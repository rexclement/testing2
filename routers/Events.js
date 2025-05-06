const express = require("express");
const { eventUpload } = require("../middlewares/upload"); // Import multer middleware
const eventdb = require("../models/event_details"); 
const path = require("path");
const mongoose = require('mongoose');
const router = express.Router();
const streamifier = require("streamifier");
const {cloudinary} = require("../middlewares/cloudinary");



async function deleteFromCloudinary(publicId, resourceType = "image") {
  if (!publicId) {
    console.warn("⚠️ No public ID provided for Cloudinary deletion.");
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log(`✅ Successfully deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error(`❌ Cloudinary deletion failed for ${publicId}:`, error);
  }
}


// 🔼 Upload buffer to Cloudinary
async function uploadToCloudinary(buffer, folder = "Home/uploads/event_fliers", resourceType = "image") {
  return new Promise((resolve, reject) => {
    
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
}


// CREATE Event (With Image Upload)

// POST event with Cloudinary upload
router.post("/", eventUpload.single("flier"), async (req, res) => {
  try {
    const {
      eventName,
      year,
      date,
      place,
      description,
      participants_count,
      outcome,
      Accepted_Jesus,
      Non_Christian_Accept_Jesus,
    } = req.body;

    let flierUrl;
    let public_key;

    if (req.file) {
      
      const result = await uploadToCloudinary(req.file.buffer);
      flierUrl = result.secure_url;
      public_key = result.public_id;
      
    } else {
      // Default local fallback
      flierUrl = "https://res.cloudinary.com/dtiwpyoja/image/upload/v1746535079/default_squnfc.png";
    }

    const lastEvent = await eventdb.findOne().sort({ order: -1 });
    const nextOrder = lastEvent ? lastEvent.order + 1 : 1;

    const newEvent = new eventdb({
      eventName,
      year,
      date,
      place,
      flier: flierUrl,
      flier_public_id: public_key,
      participants_count: Number(participants_count),
      description,
      outcome,
      Accepted_Jesus: Number(Accepted_Jesus),
      Non_Christian_Accept_Jesus: Number(Non_Christian_Accept_Jesus),
      order: nextOrder,
    });

    await newEvent.save();

    res.json(newEvent);
  } catch (error) {
    console.error("Error uploading event:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET all events
router.get("/", async (req, res) => {
  try {
    const events = await eventdb.find().sort({ order: 1 });
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Failed to fetch events." });
  }
});



  

  router.put('/reorder', async (req, res) => {
    
    const { reorderedIds } = req.body;
  
    try {
      const bulkOps = reorderedIds.map(({ id, order }) => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(id) }, // <--- convert to ObjectId
          update: { $set: { order } }
        }
      }));
  
      await eventdb.bulkWrite(bulkOps);
  
      res.status(200).json({ message: "Order updated successfully" });
    } catch (error) {
      console.error("Error reordering events:", error);
      res.status(500).json({ error: "Failed to reorder events" });
    }
  });








  
  // UPDATE Event (With Image Upload)
  

  router.put("/:id", eventUpload.single("flier"), async (req, res) => {
    try {
      const {
        eventName,
        year,
        date,
        place,
        description,
        participants_count,
        outcome,
        Accepted_Jesus,
        Non_Christian_Accept_Jesus,
      } = req.body;
      
      const updateData = {
        eventName,
        year,
        date,
        place,
        description,
        participants_count: Number(participants_count),
        outcome,
        Accepted_Jesus: Number(Accepted_Jesus),
        Non_Christian_Accept_Jesus: Number(Non_Christian_Accept_Jesus),
      };
  
      const event = await eventdb.findById(req.params.id);
  
      if (req.file) {
        // ✅ Delete old flier from Cloudinary only if it's not the default
        if (
          event.flier_public_id &&
          !event.flier.includes("default")
        ) {
          await deleteFromCloudinary(event.flier_public_id);
        }
      
        // ⬆ Upload new flier to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer);
        updateData.flier = result.secure_url;
        updateData.flier_public_id = result.public_id;
      }
      
      if (req.body.flier_condition === "default") {
        updateData.flier = "https://res.cloudinary.com/dtiwpyoja/image/upload/v1746535079/default_squnfc.png";
      }

      const updatedEvent = await eventdb.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
      });
  
      res.json(updatedEvent);
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  
  
 

  router.delete("/delete/:id", async (req, res) => {
    try {
      const event = await eventdb.findById(req.params.id);
  
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
  
      // Step 1: Delete Cloudinary image if not default
      if (
        event.flier_public_id &&
        !event.flier.includes("default")
      ) {
        await deleteFromCloudinary(event.flier_public_id);
      }
  
      // Step 2: Find all events with a higher order
      const affectedEvents = await eventdb.find({ order: { $gt: event.order } });
  
      // Step 3: Decrease the order of each affected event
      const bulkOps = affectedEvents.map((e) => ({
        updateOne: {
          filter: { _id: e._id },
          update: { $inc: { order: -1 } },
        },
      }));
  
      if (bulkOps.length > 0) {
        await eventdb.bulkWrite(bulkOps);
        console.log("Orders updated");
      }
  
      // Step 4: Delete event
      await eventdb.findByIdAndDelete(req.params.id);
      console.log("Event deleted from DB");
  
      res.json({ message: "Event deleted successfully and order updated" });
    } catch (err) {
      console.error("Error deleting event:", err);
      res.status(500).json({ error: "Server error" });
    }
  });
  
  







  

  module.exports = router;