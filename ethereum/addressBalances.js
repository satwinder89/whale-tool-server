// Setup: npm install alchemy-sdk
const { Alchemy, Network, AlchemySubscription } = require('alchemy-sdk')
require('dotenv').config()
const walletsModel = require('../database/models/wallets')
const transactionsModel = require('../database/models/transactions')
const blockchainsModel = require('../database/models/blockchain')
const blockTransactionsModel = require('../database/models/blockTransactions')
const ethers = require('ethers')
var walletsArray = null

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
}
const alchemy = new Alchemy(config)

var self = {}

// TEST
self.updateWallet = async function (address) {
  try {
    let ethBalance = await alchemy.core.getBalance(address, 'latest')
    let eth = Number(ethBalance._hex) / Math.pow(10, 18) //calculate che ETH from WEI

    //other function
    let tokens = []
    const balances = await alchemy.core.getTokenBalances(address)
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
    await walletsModel.findOneAndUpdate(
      { address: address },
      {
        updateDate: Date.now(),
        $set: { ETH: eth },
        $set: { tokens: tokens },
      },
      { upsert: true, new: true },
    )
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
        if (sendedTxResult.length != 0) {
          await transactionsModel.insertMany(result)
          console.log('updated')
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

self.checkTxList = async function () {
  try {
    let wallets = await walletsModel.find().lean()
    walletsArray = wallets.map((wallet) => wallet.address.toLowerCase())
    let blocksTransactions = await blockTransactionsModel
      .find({
        elaborated: false,
      })
      .lean()
    console.log('New block transactions: ' + blocksTransactions.length)
    const filteredTransactions = blocksTransactions
      .flatMap(({ transactions }) => transactions)
      .filter(
        ({ from, to }) =>
          (from && walletsArray.includes(from.toLowerCase())) ||
          (to && walletsArray.includes(to.toLowerCase())),
      )
    if (filteredTransactions.length > 0) {
      for (var i = 0; i < filteredTransactions.length; i++) {
        if (walletsArray.includes(filteredTransactions[i].from.toLowerCase())) {
          await self.getSenderTransactions(
            filteredTransactions[i].from.toLowerCase(),
            filteredTransactions[i].blockNumber,
          )
          await self.getReceverTransactions(
            filteredTransactions[i].from.toLowerCase(),
            filteredTransactions[i].blockNumber,
          )
          console.log("AGGIORNAMENTO DEL WALLET: " + filteredTransactions[i].from.toLowerCase())
          await self.updateWallet(filteredTransactions[i].from.toLowerCase())
        } else if (
          walletsArray.includes(filteredTransactions[i].to.toLowerCase())
        ) {
          await self.getSenderTransactions(
            filteredTransactions[i].to.toLowerCase(),
            filteredTransactions[i].blockNumber,
          )
          await self.getReceverTransactions(
            filteredTransactions[i].to.toLowerCase(),
            filteredTransactions[i].blockNumber,
          )
          console.log("AGGIORNAMENTO DEL WALLET: " + filteredTransactions[i].to.toLowerCase())
          await self.updateWallet(filteredTransactions[i].to.toLowerCase())
        }
      }
    }
    await blockTransactionsModel.updateMany(
      { _id: { $in: blocksTransactions.map((x) => x._id) } },
      { $set: { elaborated: true } },
    )
    console.log('Transactions Elaborated')
  } catch (e) {
    console.log(e)
  }
}

self.webhook = async function () {
  try {
    alchemy.ws.on('block', async (blockNumber) => {
      try {
        console.log('The latest block number is', blockNumber)
        let block = await alchemy.core.getBlockWithTransactions(blockNumber)
        await blockTransactionsModel.create(block)
        // console.log(block)
      } catch (e) {
        console.log(e)
      }
    })
  } catch (e) {
    console.log(e)
  }
}

self.testTransactions = async function () {
  try {
    let sender = await self.getSenderTransactions(
      '0x7d03e3e2c833018ee3a8cfcf3876296a2186696c',
      16557651,
    )
    let recever = await self.getReceverTransactions(
      '0x7d03e3e2c833018ee3a8cfcf3876296a2186696c',
      16557651,
    )
    console.log('test done')
  } catch (e) {
    console.log(e)
  }
}

self.getSenderTransactions = async function (from, blockNumber) {
  try {
    const sendedTx = await alchemy.core.getAssetTransfers({
      fromBlock: blockNumber,
      toBlock: blockNumber,
      fromAddress: from,
      category: [
        'erc20',
        'internal',
        'external',
        'erc721',
        'erc1155',
        'specialnft',
      ],
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
                category: sendedTx.transfers[j].category,
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
          category: sendedTx.transfers[j].category,
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
    if (sendedTxResult.length != 0) {
      await transactionsModel.insertMany(sendedTxResult)
      console.log('updated')
    }
  } catch (e) {
    console.log(e)
  }
}

self.getReceverTransactions = async function (to, blockNumber) {
  try {
    const recevedTx = await alchemy.core.getAssetTransfers({
      fromBlock: blockNumber,
      toBlock: blockNumber,
      toAddress: to,
      category: [
        'erc20',
        'internal',
        'external',
        'erc721',
        'erc1155',
        'specialnft',
      ],
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
                category: recevedTx.transfers[j].category,
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
          category: recevedTx.transfers[j].category,
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
    if (recevedTxResult.length != 0) {
      await transactionsModel.insertMany(recevedTxResult)
      console.log('updated')
    }
  } catch (e) {
    console.log(e)
  }
}

module.exports = self
