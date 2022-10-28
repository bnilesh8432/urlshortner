const mongoose = require("mongoose");
const ShortUrlSchema = new mongoose.Schema(
  {
    longUrl: { type: String, required: true},
    shortUrl: { type: String, required: true, unique: true, lowercase:true },
    urlCode: { type: String, required: true, unique: true, lowercase: true, trim: true }
  }, 
  { timestamps : true }
)
module.exports = mongoose.model("ShortUrl", ShortUrlSchema);
