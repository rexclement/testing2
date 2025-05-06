const express = require("express");
const router = express.Router();
const Documentdb = require("../models/documents");
const { documentUpload } = require("../middlewares/upload"); // use the correct path
const path = require("path");
const fs = require("fs");
const {cloudinary} = require("../middlewares/cloudinary");


// old document
router.get("/", async (req, res) => {
    try {
      const documents = await Documentdb.find();
  
      // Group documents by category
      const groupedDocs = {
        minutes: [],
        reports: [],
        schedule: [],
        songSheets: [],
        others: [],
      };
  
      documents.forEach((doc) => {
        if (groupedDocs[doc.category]) {
          groupedDocs[doc.category].push({
            name: doc.name,
            fileUrl: doc.fileUrl,
          });
        } else {
          groupedDocs.others.push({
            name: doc.name,
            fileUrl: doc.fileUrl,
          });
        }
      });
  
      res.json(groupedDocs);
    } catch (err) {
      console.error("Error fetching documents:", err);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });



// Upload document
router.post("/add", documentUpload.single("file"), async (req, res) => {
  try {
    const { category } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const result = await cloudinary.uploader.upload_stream(
      {
        folder: "Home/uploads/documents",
        resource_type: "auto",
      },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: "Upload to Cloudinary failed" });
        }
        console.log(result);
        const newDoc = new Documentdb({
          name: file.originalname,
          category,
          fileUrl: result.secure_url,
          public_key: result.public_id,
          resource_type: result.resource_type
        });

        await newDoc.save();

        return res.status(201).json({
          category,
          name: file.originalname,
          fileUrl: result.secure_url,
          
        });
      }
    );

    // Pipe buffer to Cloudinary upload_stream
    require("streamifier").createReadStream(file.buffer).pipe(result);

  } catch (err) {
    console.error("Document upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});





router.delete("/delete", async (req, res) => {
  try {
   
    const { fileUrl } = req.body;

    // Step 1: Find the document by fileUrl
    const doc = await Documentdb.findOne({ fileUrl });

    if (!doc) return res.status(404).json({ message: "Document not found" });
    
    // Step 2: Delete from Cloudinary using public_key
    if (doc.public_key) {
      try {
        await cloudinary.uploader.destroy(doc.public_key, {
          resource_type: doc.resource_type, // change if needed: "image", "video", etc.
        });
        console.log('✅ Deleted from Cloudinary:');
      } catch (cloudErr) {
        console.error('❌ Cloudinary deletion failed for:', cloudErr);
      }
    }

    // Step 3: Delete from MongoDB
    try {
      await Documentdb.findByIdAndDelete(doc._id);
      console.log('✅ Deleted from MongoDB: ');
    } catch (dbErr) {
      console.error('❌ MongoDB deletion failed for ID:', dbErr);
    }

    // Step 4: Get and group remaining documents
    const allDocs = await Documentdb.find();

    const groupedDocs = {
      minutes: [],
      reports: [],
      schedule: [],
      songSheets: [],
      others: [],
    };

    allDocs.forEach((doc) => {
      if (groupedDocs[doc.category]) {
        groupedDocs[doc.category].push({
          name: doc.name,
          fileUrl: doc.fileUrl,
        });
      } else {
        groupedDocs.others.push({
          name: doc.name,
          fileUrl: doc.fileUrl,
        });
      }
    });

    res.status(200).json(groupedDocs);
  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ error: "Failed to delete document" });
  }
});



module.exports = router;