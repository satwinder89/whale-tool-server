const schedule = require('node-schedule')
const addressBalances = require('../ethereum/alchemySDK')
const transactionsModel = require('../database/models/transactions')
const blockchainModel = require('../database/models/blockchain')
const uniswap = require('../ethereum/uniswap')

var self = {}

self.checkTransactions = function () {
  schedule.scheduleJob('*/3 * * * *', async function () {
    await addressBalances.checkTxList()
  })
}

self.updateEthToUSDPrice = function () {
  schedule.scheduleJob('*/5 * * * *', async function () {
    try {
      const ethPrice = await uniswap.getTokenPrice("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "WETH")
      await blockchainModel.updateOne(
        { name: 'Ethereum' },
        { $set: { name: 'Ethereum', priceUSD: ethPrice } },
        { upsert: true, new: true },
      )
    } catch (e) {
      console.log(e)
    }
  })
}

self.syncUpdatePrice = function () {
  schedule.scheduleJob('*/10 * * * *', async function () {
    await addressBalances.updateWallet()
  })
}

self.syncTokenPrice = function () {
  schedule.scheduleJob('*/30 * * * *', async function () {
    try {
      await addressBalances.updateTokensPrice()
    }catch(e){
      console.log(e)
    }
  })
}

self.deleteOldTransactions = function () {
  schedule.scheduleJob({ hour: 1, minute: 1 }, async function () {
    let oneWeekAgo = Date.now() - 500000000
    await transactionsModel.deleteMany({ date: { $lt: oneWeekAgo } })
    console.log('Eliminate le transazioni precedenti al: ' + oneWeekAgo)
  })
}

module.exports = self
