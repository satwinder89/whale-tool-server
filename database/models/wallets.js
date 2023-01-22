const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const walletsConfig = {
    address: {
        type: String,
        required: true,
        unique: true
    },
    insert_date: {
        type: Number
    },
    update_date: {
        type: Number
    }
}

let wallets = new Schema(walletsConfig, {
    collection: "wallets",
    versionKey: false,
    strict: false
});

wallets.index({ address: 1, insert_date: 1 })

module.exports = mongoose.model("wallets", wallets)