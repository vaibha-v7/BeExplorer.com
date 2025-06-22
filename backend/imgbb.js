const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
require("dotenv").config();

async function uploadToImgBB(localFilePath) {
    const form = new FormData();
    const file = fs.createReadStream(localFilePath);
    
    form.append("image", file);

    const res = await axios.post(
        `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
        form,
        {
            headers: form.getHeaders()
        }
    );

    return res.data.data.url;  // return url of pjhoto
}

module.exports = uploadToImgBB;
