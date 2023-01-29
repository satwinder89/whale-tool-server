const schedule = require("node-schedule");
const addressBalances = require("../ethereum/addressBalances");

var self = {}

self.syncTransactions = function () {
    schedule.scheduleJob("*/7 * * * *", async function () {
        await addressBalances.getWhalesTransactions();
    })
}

module.exports = self