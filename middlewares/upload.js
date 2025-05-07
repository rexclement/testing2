


const multer = require("multer");

// Factory function to configure multer with memoryStorage
const getMulterUpload = (folderName, allowedTypes) => {
  const storage = multer.memoryStorage(); // No filesystem used

  const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`),
        false
      );
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  });
};

// Export specific configurations
module.exports = {
  eventUpload: getMulterUpload("event_fliers", ["image/jpeg", "image/png", "image/jpg"]),
  documentUpload: getMulterUpload("documents", [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ]),
  teamMemberUpload: getMulterUpload("team_members", ["image/jpeg", "image/png", "image/jpg"]),
};
