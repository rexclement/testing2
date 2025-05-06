const express = require('express');
const router = express.Router();
const { collegedb, schooldb } = require("../models/Cell_details"); // Adjust according to your export paths
const mongoose = require("mongoose");

router.get("/all", async (req, res) => {
    try {
      const college = await collegedb.find();
      const school = await schooldb.find();
  
      res.json({ college, school });
    } catch (error) {
      console.error("Error fetching cells:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  



router.post("/add", async (req, res) => {
  try {
   
    const {
      type, institution, prayerCellName, cellType, locationType,
      gender, timesHeld, avgParticipants, handledBy, remark
    } = req.body.data;

    // Define the data to be saved
    const newCellData = {
      type,
      institution,
      prayerCellName,
      cellType,
      locationType,
      gender,
      timesHeld,
      avgParticipants,
      handledBy,
      remark
    };

    let savedCell;

    // Handle order assignment based on type (college or school)
    if (type === "college") {
      // Get the last college cell to determine the next order
      const lastCollegeCell = await collegedb.findOne().sort({ order: -1 });
      const nextCollegeOrder = lastCollegeCell ? lastCollegeCell.order + 1 : 1;

      newCellData.order = nextCollegeOrder;
      
      savedCell = new collegedb(newCellData);
      await savedCell.save();
    } else if (type === "school") {
      // Get the last school cell to determine the next order
      const lastSchoolCell = await schooldb.findOne().sort({ order: -1 });
      const nextSchoolOrder = lastSchoolCell ? lastSchoolCell.order + 1 : 1;

      newCellData.order = nextSchoolOrder;

      savedCell = new schooldb(newCellData);
      await savedCell.save();
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }

    // Send response with saved data
    res.json(savedCell);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




router.delete("/delete/:id", async (req, res) => {
    try {
      const { type } = req.query; // send type as a query param (college or school)
  
      if (!type) {
        return res.status(400).json({ error: "Type is required" });
      }
  
      let db;
      if (type === "college") {
        db = collegedb;
      } else if (type === "school") {
        db = schooldb;
      } else {
        return res.status(400).json({ error: "Invalid type" });
      }
  
      const cell = await db.findById(req.params.id);
  
      if (!cell) {
        return res.status(404).json({ error: "Cell not found" });
      }
  
      // Step 1: Find all cells with a higher order
      const affectedCells = await db.find({ order: { $gt: cell.order } });
  
      // Step 2: Decrease order of each affected cell
      const bulkOps = affectedCells.map((c) => ({
        updateOne: {
          filter: { _id: c._id },
          update: { $inc: { order: -1 } },
        },
      }));
  
      if (bulkOps.length > 0) {
        await db.bulkWrite(bulkOps);
        console.log("Orders updated");
      }
  
      // Step 3: Delete the cell
      await db.findByIdAndDelete(req.params.id);
      console.log("Cell deleted from DB");
  
      res.json({ message: "Cell deleted successfully and order updated" });
    } catch (err) {
      console.error("Error deleting cell:", err);
      res.status(500).json({ error: "Server error" });
    }
  });




  router.put('/reorder', async (req, res) => {
    console.log('Received reorder data:', req.body);
    const { reorderedIds, type } = req.body; // type = "college" or "school"
  
    try {
      const db = type === "college" ? collegedb : schooldb;
  
      const bulkOps = reorderedIds.map(({ id, order }) => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(id) },
          update: { $set: { order } },
        },
      }));
  
      await db.bulkWrite(bulkOps);
  
      res.status(200).json({ message: "Order updated successfully" });
    } catch (error) {
      console.error("Error reordering cells:", error);
      res.status(500).json({ error: "Failed to reorder cells" });
    }
  });



router.put("/update/", async (req, res) => {
    try {
        
      const {
        institution, prayerCellName, cellType, locationType,
        gender, timesHeld, avgParticipants, handledBy, remark
      } = req.body.data;
      let type = req.body.type;
      let id = req.body.id;
      
      const updatedData = {
        institution,
        prayerCellName,
        cellType,
        locationType,
        gender,
        timesHeld,
        avgParticipants,
        handledBy,
        remark
      };
      
      let updatedCell;
  
      if (type === "college") {
        updatedCell = await collegedb.findByIdAndUpdate(id, updatedData, { new: true });
      } else if (type === "school") {
        updatedCell = await schooldb.findByIdAndUpdate(id, updatedData, { new: true });
      } else {
        return res.status(400).json({ error: "Invalid type" });
      }
  
      if (!updatedCell) {
        return res.status(404).json({ error: "Cell not found" });
      }
      console.log('updatedCell',updatedCell);
      res.json(updatedCell);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  


  module.exports = router;
  