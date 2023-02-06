const schedule = require("node-schedule");
const addressBalances = require("../ethereum/addressBalances");
const blockTransactionModel = require("../database/models/blockTransactions");
const transactionsModel = require("../database/models/transactions");
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

// self.deleteElaboratedBlocks = function () {
//     schedule.scheduleJob("*/10 * * * *", async function (){
//         await blockTransactionModel.deleteMany({ elaborated: true })
//         console.log("transactions deleted");
//     })
// }

self.deleteOldTransactions = function () {
    schedule.scheduleJob({ hour: 1, minute: 1 }, async function () {
        let oneWeekAgo = Date.now() - 200000000
        await transactionsModel.deleteMany({ date: { $lt: oneWeekAgo } })
        console.log("Eliminate le transazioni precedenti al: " + oneWeekAgo)
    })
}

module.exports = self