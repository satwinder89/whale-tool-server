const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blockchainsConfig = {
    name: {
        type: String,
        required: true,
        unique: true
    },
    updatedBlocks: {
        type: Number,
        required: true
    }
}

let blockchains = new Schema(blockchainsConfig, {
    collection: "blockchains",
    versionKey: false,
    strict: false
})

module.exports = mongoose.model("blockchains", blockchains)