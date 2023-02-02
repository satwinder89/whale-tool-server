const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blockTransactionsConfig = {
    hash: {
        type: String,
        required: true,
        unique: true,
    },
    number: {
        type: Number,
    },
    elaborated: {
        type: Boolean,
        default: false
    }
}

let blockTransaction = new Schema(blockTransactionsConfig, {
    collection: "blockTransactions",
    versionKey: false,
    strict: false
})

module.exports = mongoose.model("blockTransactions", blockTransaction)