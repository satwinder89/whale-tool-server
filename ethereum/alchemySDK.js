// Setup: npm install alchemy-sdk
const { Alchemy, Network, AlchemySubscription } = require('alchemy-sdk')
require('dotenv').config()
const walletsModel = require('../database/models/wallets')
const transactionsModel = require('../database/models/transactions')
const blockchainsModel = require('../database/models/blockchain')
const blockTransactionsModel = require('../database/models/blockTransactions')
const tokensModel = require('../database/models/tokens')
const coinmarketcap = require('../coinmarketcap/price')
const uniswap = require('./uniswap')

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
}
const alchemy = new Alchemy(config)

var self = {}

self.blockNumber = async function () {
  try {
    alchemy.ws.on('block', async (blockNumber) => {
      try {
        console.log('The latest block number is', blockNumber)
        let block = await alchemy.core.getBlockWithTransactions(blockNumber)
        await blockTransactionsModel.create(block)
      } catch (e) {
        console.log(e)
      }
    })
  } catch (e) {
    console.log(e)
  }
}

self.updateWallet = async function () {
  try {
    let wallets = await walletsModel.find({ updated: false }).lean()
    for (let i = 0; i < wallets.length; i++) {
      let ethBalance = await alchemy.core.getBalance(
        wallets[i].address,
        'latest',
      )
      let eth = Number(ethBalance._hex) / Math.pow(10, 18) //calculate che ETH from WEI
      let tokens = []
      const balances = await alchemy.core.getTokenBalances(wallets[i].address)
      const nonZeroBalances = balances.tokenBalances.filter((token) => {
        return Number(token.tokenBalance) > 0
      })
      const contractAddresses = nonZeroBalances.map(
        (obj) => obj.contractAddress,
      )
      let tokensDB = await tokensModel
        .find({
          address: { $in: contractAddresses },
          // symbol: { $ne: 'UNI-V2' },
        })
        .lean()
      const tokensDBAddress = tokensDB.map((obj) => obj.address)
      // Unire gli array e rimuovere eventuali duplicati
      const unione = [...new Set([...contractAddresses, ...tokensDBAddress])]
      // Filtrare le stringhe presenti in un solo array
      const newTokens = unione.filter(
        (stringa) =>
          !contractAddresses.includes(stringa) ||
          !tokensDBAddress.includes(stringa),
      )
      await self.createTokens(newTokens)
      await walletsModel.findOneAndUpdate(
        { address: wallets[i].address },
        {
          updated: true,
          updateDate: Date.now(),
          $set: { ETH: eth, tokens: nonZeroBalances },
        },
        { upsert: true, new: true },
      )
    }

    return true
  } catch (e) {
    console.log(e)
  }
}

self.createTokens = async function (newTokens) {
  try {
    let tokens = []
    for (var i = 0; i < newTokens.length; i++) {
      try {
        const metadata = await alchemy.core.getTokenMetadata(newTokens[i])
        let tokenPrice = await uniswap.getTokenPrice(
          newTokens[i],
          metadata.symbol,
        )
        tokens.push({
          address: newTokens[i],
          name: metadata.name,
          symbol: metadata.symbol,
          decimals: metadata.decimals,
          logo: metadata.logo,
          price: tokenPrice,
          lastUpdate: Date.now(),
        })
      } catch (e) {
        console.log(e)
        continue
      }
    }
    await tokensModel.insertMany(tokens)
  } catch (e) {
    console.log(e)
  }
}

self.updateTokensPrice = async function () {
  try {
    const tokensDB = await tokensModel.find().lean()
    var tokens = []
    for (var i = 0; i < tokensDB.length; i++) {
      try {
        const metadata = await alchemy.core.getTokenMetadata(
          tokensDB[i].address,
        )
        let tokenPrice = await uniswap.getTokenPrice(
          tokensDB[i].address,
          metadata.symbol,
        )
        tokens.push({
          address: tokensDB[i].address,
          name: metadata.name,
          symbol: metadata.symbol,
          decimals: metadata.decimals,
          logo: metadata.logo,
          price: tokenPrice,
          lastUpdate: Date.now(),
        })
      } catch (e) {
        console.log(e)
        continue
      }
    }
    await tokensModel.deleteMany()
    await tokensModel.insertMany(tokens)
  } catch (e) {
    console.log(e)
  }
}

self.checkTxList = async function () {
  try {
    let wallets = await walletsModel.find().lean()
    const walletsArray = wallets.map((wallet) => wallet.address)
    const blocksTransactions = await blockTransactionsModel.find()
    console.log('New block transactions: ' + blocksTransactions.length)
    const filteredTransactions = blocksTransactions
      .flatMap(({ transactions }) => transactions)
      .filter(
        ({ from, to }) =>
          (from && walletsArray.includes(from.toLowerCase())) ||
          (to && walletsArray.includes(to.toLowerCase())),
      )
    await blockTransactionsModel.deleteMany({
      _id: { $in: blocksTransactions.map((x) => x._id) },
    })
    let walletsToUpdate = []
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
          walletsToUpdate.push(filteredTransactions[i].from.toLowerCase())
        }

        if (walletsArray.includes(filteredTransactions[i].to.toLowerCase())) {
          await self.getSenderTransactions(
            filteredTransactions[i].to.toLowerCase(),
            filteredTransactions[i].blockNumber,
          )
          await self.getReceverTransactions(
            filteredTransactions[i].to.toLowerCase(),
            filteredTransactions[i].blockNumber,
          )
          walletsToUpdate.push(filteredTransactions[i].to.toLowerCase())
        }
      }
    }
    let set = new Set(walletsToUpdate)
    let uniqueArray = Array.from(set)
    console.log('Aggiornamento di wallets N°: ' + uniqueArray.length)
    if (uniqueArray.length > 0) {
      await walletsModel.updateMany(
        { address: { $in: uniqueArray } },
        { $set: { updated: false, updateDate: Date.now() } },
        { upsert: true, new: true },
      )
    }
    // for (let i = 0; i < uniqueArray.length; i++) {
    //   await self.updateWallet(uniqueArray[i])
    // }

    // console.log('Transactions Elaborated e wallet aggiornati')
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
              let resultObject = {
                uniqueId: sendedTx.transfers[j].uniqueId,
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
              }
              if (sendedTx.transfers[j].erc721TokenId) {
                resultObject.tokenId = parseInt(
                  sendedTx.transfers[j].erc721TokenId,
                  16,
                ).toString()
              } else if (sendedTx.transfers[j].erc1155Metadata) {
                resultObject.tokenId = parseInt(
                  sendedTx.transfers[j].erc1155Metadata[0].tokenId,
                  16,
                ).toString()
                resultObject.value = parseInt(
                  sendedTx.transfers[j].erc1155Metadata[0].value,
                  16,
                )
              }
              sendedTxResult.push(resultObject)
            }
          } catch (e) {
            console.log(e)
            continue
          }
        } else {
          if (!sendedTx.transfers[j].rawContract.address) {
            sendedTx.transfers[j].rawContract.address = 'ETH'
          }
          let resultObject = {
            uniqueId: sendedTx.transfers[j].uniqueId,
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
          }
          if (sendedTx.transfers[j].erc721TokenId) {
            resultObject.tokenId = parseInt(
              sendedTx.transfers[j].erc721TokenId,
              16,
            ).toString()
          } else if (sendedTx.transfers[j].erc1155Metadata) {
            resultObject.tokenId = parseInt(
              sendedTx.transfers[j].erc1155Metadata[0].tokenId,
              16,
            ).toString()
            resultObject.value = parseInt(
              sendedTx.transfers[j].erc1155Metadata[0].value,
              16,
            )
          }
          sendedTxResult.push(resultObject)
        }
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
              let resultObject = {
                uniqueId: recevedTx.transfers[j].uniqueId,
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
              }
              if (recevedTx.transfers[j].erc721TokenId) {
                resultObject.tokenId = parseInt(
                  recevedTx.transfers[j].erc721TokenId,
                  16,
                ).toString()
              } else if (recevedTx.transfers[j].erc1155Metadata) {
                resultObject.tokenId = parseInt(
                  recevedTx.transfers[j].erc1155Metadata[0].tokenId,
                  16,
                ).toString()
                resultObject.value = parseInt(
                  recevedTx.transfers[j].erc1155Metadata[0].value,
                  16,
                )
              }
              recevedTxResult.push(resultObject)
            }
          } catch (e) {
            console.log(e)
            continue
          }
        } else {
          if (!recevedTx.transfers[j].rawContract.address) {
            recevedTx.transfers[j].rawContract.address = 'ETH'
          }
          let resultObject = {
            uniqueId: recevedTx.transfers[j].uniqueId,
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
          }
          if (recevedTx.transfers[j].erc721TokenId) {
            resultObject.tokenId = parseInt(
              recevedTx.transfers[j].erc721TokenId,
              16,
            ).toString()
          } else if (recevedTx.transfers[j].erc1155Metadata) {
            resultObject.tokenId = parseInt(
              recevedTx.transfers[j].erc1155Metadata[0].tokenId,
              16,
            ).toString()
            resultObject.value = parseInt(
              recevedTx.transfers[j].erc1155Metadata[0].value,
              16,
            )
          }
          recevedTxResult.push(resultObject)
        }
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
