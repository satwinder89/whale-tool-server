// Setup: npm install alchemy-sdk
const { Alchemy, Network, AlchemySubscription } = require('alchemy-sdk')
require('dotenv').config()
const walletsModel = require('../database/models/wallets')
const transactionsModel = require('../database/models/transactions')
const blockchainsModel = require('../database/models/blockchain')
const ethers = require('ethers')

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
}
const alchemy = new Alchemy(config)

var self = {}

// TEST
self.updateWallet = async function () {
  try {
    let currentTime = Date.now() - 600000

    let wallets = await walletsModel
      .find({ updateDate: { $lte: currentTime } })
      .lean()
    let count = 0
    for (var i = 0; i < wallets.length; i++) {
      let test = await alchemy.core.getBalance(wallets[i].address, 'latest')
      let eth = Number(test._hex) / Math.pow(10, 18) //calculate che ETH from WEI

      count++

      //other function
      let tokens = []
      const balances = await alchemy.core.getTokenBalances(wallets[i].address)
      count++
      // Remove tokens with zero balance
      const nonZeroBalances = balances.tokenBalances.filter((token) => {
        return token.tokenBalance !== '0'
      })
      // Loop through all tokens with non-zero balance
      for (let token of nonZeroBalances) {
        let balance = token.tokenBalance
        let metadata = null
        try {
          metadata = await alchemy.core.getTokenMetadata(token.contractAddress)
        } catch (e) {
          console.log(e)
          continue
        }

        count++

        // Compute token balance in human-readable format
        balance = balance / Math.pow(10, metadata.decimals)
        balance = balance.toFixed(10)
        tokens.push({
          address: token.contractAddress,
          name: metadata.name,
          symbol: metadata.symbol,
          balance: balance,
          decimal: metadata.decimals,
          logo: metadata.logo,
        })
      }
      console.log('N ' + i + 'chiamata: ' + count)
      await walletsModel.findOneAndUpdate(
        { address: wallets[i].address },
        {
          updateDate: Date.now(),
          $set: { ETH: eth },
          $set: { tokens: tokens },
        },
        { upsert: true, new: true },
      )
    }
    return true
  } catch (e) {
    console.log(e)
  }
}

self.getWhalesTransactions = async function () {
  try {
    let startTime = Date.now()
    let wallets = await walletsModel.find().lean()
    let result = []
    let blockchain = await blockchainsModel.findOne({ name: 'Ethereum' }).lean()
    const currentBlock = await alchemy.core.getBlockNumber()
    for (let i = 0; i < wallets.length; i++) {
      try {
        const sendedTx = await alchemy.core.getAssetTransfers({
          fromBlock: blockchain.updatedBlocks,
          fromAddress: wallets[i].address,
          category: ['erc20', 'internal', 'external'],
          withMetadata: true,
        })
        const recevedTx = await alchemy.core.getAssetTransfers({
          fromBlock: blockchain.updatedBlocks,
          toAddress: wallets[i].address,
          category: ['erc20', 'internal', 'external'],
          withMetadata: true,
        })
        let sendedTxResult = []
        if (sendedTx.transfers.length != 0) {
          for (let j = 0; j < sendedTx.transfers.length; j++) {
            if (!sendedTx.transfers[j].asset) {
              try {
                let metadata
                if (sendedTx.transfers[j].rawContract.address != null) {
                  metadata = await alchemy.core.getTokenMetadata(
                    sendedTx.transfers[j].rawContract.address,
                  )
                  let balance =
                    sendedTx.transfers[j].rawContract.value /
                    Math.pow(10, metadata.decimals)
                  sendedTx.transfers[j].value = Number(balance.toFixed(10))
                  sendedTx.transfers[j].asset = metadata.name
                  sendedTxResult.push({
                    type: 'sended',
                    address: sendedTx.transfers[j].rawContract.address,
                    hash: sendedTx.transfers[j].hash,
                    from: sendedTx.transfers[j].from,
                    to: sendedTx.transfers[j].to,
                    asset: sendedTx.transfers[j].asset,
                    value: sendedTx.transfers[j].value,
                    date: new Date(
                      sendedTx.transfers[j].metadata.blockTimestamp,
                    ).getTime(),
                  })
                }
              } catch (e) {
                console.log(e)
                continue
              }
            }
            if (!sendedTx.transfers[j].rawContract.address) {
              sendedTx.transfers[j].rawContract.address = 'ETH'
            }
            sendedTxResult.push({
              type: 'sended',
              address: sendedTx.transfers[j]?.rawContract.address,
              hash: sendedTx.transfers[j].hash,
              from: sendedTx.transfers[j].from,
              to: sendedTx.transfers[j].to,
              asset: sendedTx.transfers[j].asset,
              value: sendedTx.transfers[j].value,
              date: new Date(
                sendedTx.transfers[j].metadata.blockTimestamp,
              ).getTime(),
            })
          }
        }
        let recevedTxResult = []
        if (recevedTx.transfers.length != 0) {
          for (let j = 0; j < recevedTx.transfers.length; j++) {
            if (!recevedTx.transfers[j].asset) {
              try {
                let metadata
                if (recevedTx.transfers[j].rawContract.address != null) {
                  metadata = await alchemy.core.getTokenMetadata(
                    recevedTx.transfers[j].rawContract.address,
                  )
                  let balance =
                    recevedTx.transfers[j].rawContract.value /
                    Math.pow(10, metadata.decimals)
                  recevedTx.transfers[j].value = Number(balance.toFixed(10))
                  recevedTx.transfers[j].asset = metadata.name
                  recevedTxResult.push({
                    type: 'receved',
                    address: recevedTx.transfers[j].rawContract.address,
                    hash: recevedTx.transfers[j].hash,
                    from: recevedTx.transfers[j].from,
                    to: recevedTx.transfers[j].to,
                    asset: recevedTx.transfers[j].asset,
                    value: recevedTx.transfers[j].value,
                    date: new Date(
                      recevedTx.transfers[j].metadata.blockTimestamp,
                    ).getTime(),
                  })
                }
              } catch (e) {
                console.log(e)
                continue
              }
            }
            if (!recevedTx.transfers[j].rawContract.address) {
              recevedTx.transfers[j].rawContract.address = 'ETH'
            }
            recevedTxResult.push({
              type: 'receved',
              address: recevedTx.transfers[j]?.rawContract.address,
              hash: recevedTx.transfers[j].hash,
              from: recevedTx.transfers[j].from,
              to: recevedTx.transfers[j].to,
              asset: recevedTx.transfers[j].asset,
              value: recevedTx.transfers[j].value,
              date: new Date(
                recevedTx.transfers[j].metadata.blockTimestamp,
              ).getTime(),
            })
          }
        }
        sendedTxResult = sendedTxResult.concat(recevedTxResult)
        if(sendedTxResult.length != 0){
          await transactionsModel.insertMany(result)
          console.log("updated")
        }
        // result = result.concat(sendedTxResult).concat(recevedTxResult)
        console.log(i)
      } catch (e) {
        console.log(e)
        continue
      }
    }
    // await transactionsModel.insertMany(result)
    await blockchainsModel.updateOne(
      { name: 'Ethereum' },
      { updatedBlocks: currentBlock },
    )
    let endTime = Date.now()
    console.log(endTime - startTime)
    console.log('ended')
    return
    // 0xEf1c6E67703c7BD7107eed8303Fbe6EC2554BF6B : Universal Router Uniswap
  } catch (e) {
    console.log(e)
  }
}

self.webhook = async function () {
  try {
    let wallets = await walletsModel.find().lean()
    let walletsArray = []
    for (let i = 0; i < wallets.length; i++) {
      walletsArray.push(wallets[i].address)
    }
    for (let i = 0; i < 400; i++) {
      alchemy.ws.on(
        {
          method: AlchemySubscription.MINED_TRANSACTIONS,
          addresses: [
            {
              form: walletsArray[i],
            },
            {
              to: walletsArray[i],
            },
          ],
          includeRemoved: true,
          hashesOnly: false,
        },
        async (tx) => {
          tx = await alchemy.core.getTransaction(tx.transaction.hash)
          const sendedTx = await alchemy.core.getAssetTransfers({
            fromBlock: tx.blockNumber,
            toBlock: tx.blockNumber,
            fromAddress: tx.from,
            category: ['erc20', 'internal', 'external'],
            withMetadata: true,
          })
          let sendedTxResult = []
          if (sendedTx.transfers.length != 0) {
            for (let j = 0; j < sendedTx.transfers.length; j++) {
              if (!sendedTx.transfers[j].asset) {
                try {
                  let metadata
                  if (sendedTx.transfers[j].rawContract.address != null) {
                    metadata = await alchemy.core.getTokenMetadata(
                      sendedTx.transfers[j].rawContract.address,
                    )
                    let balance =
                      sendedTx.transfers[j].rawContract.value /
                      Math.pow(10, metadata.decimals)
                    sendedTx.transfers[j].value = Number(balance.toFixed(10))
                    sendedTx.transfers[j].asset = metadata.name
                    sendedTxResult.push({
                      type: 'sended',
                      address: sendedTx.transfers[j].rawContract.address,
                      hash: sendedTx.transfers[j].hash,
                      from: sendedTx.transfers[j].from,
                      to: sendedTx.transfers[j].to,
                      asset: sendedTx.transfers[j].asset,
                      value: sendedTx.transfers[j].value,
                      date: new Date(
                        sendedTx.transfers[j].metadata.blockTimestamp,
                      ).getTime(),
                    })
                  }
                } catch (e) {
                  console.log(e)
                  continue
                }
              }
              if (!sendedTx.transfers[j].rawContract.address) {
                sendedTx.transfers[j].rawContract.address = 'ETH'
              }
              sendedTxResult.push({
                type: 'sended',
                address: sendedTx.transfers[j]?.rawContract.address,
                hash: sendedTx.transfers[j].hash,
                from: sendedTx.transfers[j].from,
                to: sendedTx.transfers[j].to,
                asset: sendedTx.transfers[j].asset,
                value: sendedTx.transfers[j].value,
                date: new Date(
                  sendedTx.transfers[j].metadata.blockTimestamp,
                ).getTime(),
              })
            }
          }
          const recevedTx = await alchemy.core.getAssetTransfers({
            fromBlock: tx.blockNumber,
            toBlock: tx.blockNumber,
            toAddress: tx.from,
            category: ['erc20', 'internal', 'external'],
            withMetadata: true,
          })
          let recevedTxResult = []
          if (recevedTx.transfers.length != 0) {
            for (let j = 0; j < recevedTx.transfers.length; j++) {
              if (!recevedTx.transfers[j].asset) {
                try {
                  let metadata
                  if (recevedTx.transfers[j].rawContract.address != null) {
                    metadata = await alchemy.core.getTokenMetadata(
                      recevedTx.transfers[j].rawContract.address,
                    )
                    let balance =
                      recevedTx.transfers[j].rawContract.value /
                      Math.pow(10, metadata.decimals)
                    recevedTx.transfers[j].value = Number(balance.toFixed(10))
                    recevedTx.transfers[j].asset = metadata.name
                    recevedTxResult.push({
                      type: 'receved',
                      address: recevedTx.transfers[j].rawContract.address,
                      hash: recevedTx.transfers[j].hash,
                      from: recevedTx.transfers[j].from,
                      to: recevedTx.transfers[j].to,
                      asset: recevedTx.transfers[j].asset,
                      value: recevedTx.transfers[j].value,
                      date: new Date(
                        recevedTx.transfers[j].metadata.blockTimestamp,
                      ).getTime(),
                    })
                  }
                } catch (e) {
                  console.log(e)
                  continue
                }
              }
              if (!recevedTx.transfers[j].rawContract.address) {
                recevedTx.transfers[j].rawContract.address = 'ETH'
              }
              recevedTxResult.push({
                type: 'receved',
                address: recevedTx.transfers[j]?.rawContract.address,
                hash: recevedTx.transfers[j].hash,
                from: recevedTx.transfers[j].from,
                to: recevedTx.transfers[j].to,
                asset: recevedTx.transfers[j].asset,
                value: recevedTx.transfers[j].value,
                date: new Date(
                  recevedTx.transfers[j].metadata.blockTimestamp,
                ).getTime(),
              })
            }
          }
          sendedTxResult = sendedTxResult.concat(recevedTxResult)
          if (sendedTxResult.length != 0) {
            await transactionsModel.insertMany(result)
            console.log('updated')
          }
          // tx.transacion.blockNumber = convert(tx.transacion.blockNumber)
          console.log(tx)
        },
      )
      console.log(i)
    }
  } catch (e) {
    console.log(e)
  }
}

module.exports = self
