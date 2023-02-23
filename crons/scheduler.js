const schedule = require('node-schedule')
const addressBalances = require('../ethereum/alchemySDK')
const blockTransactionModel = require('../database/models/blockTransactions')
const transactionsModel = require('../database/models/transactions')
const coinmarketcap = require('../coinmarketcap/price')
const blockchainModel = require('../database/models/blockchain')

var self = {}

self.syncTransactions = function () {
  schedule.scheduleJob('*/30 * * * *', async function () {
    await addressBalances.updateWallet()
    await addressBalances.updateTokensPrice()
  })
}

self.checkTransactions = function () {
  schedule.scheduleJob('*/1 * * * *', async function () {
    await addressBalances.checkTxList()
  })
}

self.updateEthToUSDPrice = function () {
  try {
    schedule.scheduleJob('*/5 * * * *', async function () {
      let ethPrice = await coinmarketcap.getEthPriceInUSD()
      await blockchainModel.updateOne(
        { name: 'Ethereum' },
        { $set: { priceUSD: ethPrice } }
      )
    })
  } catch (e) {
    console.log(e)
  }
}

self.deleteOldTransactions = function () {
  schedule.scheduleJob({ hour: 1, minute: 1 }, async function () {
    let oneWeekAgo = Date.now() - 200000000
    await transactionsModel.deleteMany({ date: { $lt: oneWeekAgo } })
    console.log('Eliminate le transazioni precedenti al: ' + oneWeekAgo)
  })
}

module.exports = self
