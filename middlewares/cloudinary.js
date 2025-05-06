const { v2: cloudinary } = require("cloudinary");
require("dotenv").config({ path: "../config.env" });

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.c_name,
    api_key: process.env.ck,
    api_secret: process.env.csk,
  });

  console.log("✅ Cloudinary configured successfully.");
}

configureCloudinary();

module.exports = { cloudinary, configureCloudinary };

