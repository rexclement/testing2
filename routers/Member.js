const membersdb = require( "../models/Members_details" );
const express = require('express');
const router = express.Router();
const { teamMemberUpload } = require('../middlewares/upload');
const streamifier = require("streamifier");
const {cloudinary} = require("../middlewares/cloudinary");
const fs = require('fs');
const path = require('path');

// Predefined roles (match naming of default images)
const predefinedRoles = [
  "President",
  "Secretary",
  "Treasurer",
  "Prayer Secretary",
  "Outreach Secretary",
  "Cell care secretary",
  "Literature Secretary",
  "Music Secretary",
  "Representative",
  "Senior advisor family",
  "Young Graduate senior advisor",
  "Students ministry Secretary",
  "Staff worker"
];


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
async function uploadToCloudinary(buffer, folder = "Home/uploads/team_members", resourceType = "image") {
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



router.get('/', async (req, res) => {
    try {
      const members = await membersdb.find();
      res.json(members);
    } catch (error) {
      console.error('Error fetching members:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  });




router.post("/add", teamMemberUpload.single("photo"), async (req, res) => {
  try {
    
    const { name, role, priority, description } = req.body;
    let photoUrl = "";
    let public_key = "";

    if (req.file) {
      // 📷 Upload buffer to Cloudinary
      const result = await uploadToCloudinary(
        req.file.buffer
      );
      photoUrl = result.secure_url;
      public_key = result.public_id;
    } else {
      // 🔄 Role-based default fallback
      const normalizedRole = role.toLowerCase().replace(/\s+/g, "-");
      
      const isPredefined = predefinedRoles.some(
        r => r.toLowerCase() === role.toLowerCase()
      );
      
      if (isPredefined) {
        photoUrl = `uploads/team_members/defaults/${normalizedRole}.png`;
      } else {
        photoUrl = "uploads/team_members/defaults/default.png";
      }
    }

    const newMember = new membersdb({
      name,
      role,
      priority: Number(priority),
      description,
      photo: photoUrl,
      public_id: public_key || null, // Optional: store public_id for future deletion
    });

    const savedMember = await newMember.save();
    res.json(savedMember);
  } catch (error) {
    console.error("Error saving member:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.put('/:id', teamMemberUpload.single('photo'), async (req, res) => {
  try {
    const { name, description, role, priority } = req.body;
    const member = await membersdb.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    let newPhotoUrl = member.photo;
    let newPublicId = member.public_id;

    if (req.file && req.file.buffer) {
      // Delete old Cloudinary image if not a default
      const isDefault = member.photo.includes('team_members/defaults');

      if (!isDefault && member.public_id) {
        await deleteFromCloudinary(member.public_id);
      }

      // Upload new image to Cloudinary
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'Home/uploads/team_members'
      );

      newPhotoUrl = uploadResult.secure_url;
      newPublicId = uploadResult.public_id;
    }

    const updatedMember = await membersdb.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        role,
        priority: parseInt(priority),
        photo: newPhotoUrl,
        public_id: newPublicId,
      },
      { new: true }
    );

    if (!updatedMember) {
      return res.status(404).json({ message: 'Member update failed' });
    }

    res.json(updatedMember);
  } catch (err) {
    console.error('Error updating member:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



  
  
router.delete('/delete/:id', async (req, res) => {
  try {
    const member = await membersdb.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Delete from Cloudinary if it's not a default image
    const isDefault = member.photo.includes('team_members/defaults');

    if (!isDefault && member.public_id) {
      await deleteFromCloudinary(member.public_id);
      console.log('✅ Member photo deleted from Cloudinary');
    }

    // Delete the member from the database
    await membersdb.findByIdAndDelete(req.params.id);
    console.log('✅ Member deleted from DB');

    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting member:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

  

module.exports = router;

