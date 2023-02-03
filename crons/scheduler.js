const schedule = require("node-schedule");
const addressBalances = require("../ethereum/addressBalances");
const blockTransactionModel = require("../database/models/blockTransactions");
var self = {}

self.syncTransactions = function () {
    schedule.scheduleJob("*/7 * * * *", async function () {
        await addressBalances.getWhalesTransactions();
    })
}

self.checkTransactions = function () {
    schedule.scheduleJob("*/2 * * * *", async function () {
        await addressBalances.checkTxList()
    })
}

self.deleteElaboratedBlocks = function () {
    schedule.scheduleJob("*/40 * * * *", async function (){
        await blockTransactionModel.deleteMany({ elaborated: true })
        console.log("transactions deleted");
    })
}

module.exports = self