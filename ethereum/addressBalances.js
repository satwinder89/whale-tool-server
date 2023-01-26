// Setup: npm install alchemy-sdk
const { Alchemy, Network } = require('alchemy-sdk')

require('dotenv').config()
const util = require('util')
const fs = require('fs')
const filePath = './whales.txt'
const readFile = util.promisify(fs.readFile)
const mongoose = require('mongoose')
const walletsModel = require('../database/models/wallets')
const ethers = require('ethers')
const { start } = require('repl')

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
}
const alchemy = new Alchemy(config)

var self = {}

self.createAllWallets = async function () {
  try {
    let address = await self.readStringFile()
    let arrayOfAddress = []
    for (var i = 0; i < address.length; i++) {
      let newAddress = {
        name: 'WHALE#' + i,
        address: address[i],
        insertDate: Date.now(),
        updateDate: Date.now(),
      }
      arrayOfAddress.push(newAddress)
    }
    await walletsModel.insertMany(arrayOfAddress)
    return true
  } catch (e) {
    console.log(e)
  }
}

self.accountEthBalance = async function () {
  try {
    let currentTime = Date.now() - 600000

    let wallets = await walletsModel
      .find({ updateDate: { $lte: currentTime } })
      .lean()
    let count = 0
    for (var i = 0; i < wallets.length; i++) {
      let test = await alchemy.core.getBalance(wallets[i].address, 'latest')
      let eth = Number(test._hex) / Math.pow(10, 18) //calculate che ETH from WEI
      await walletsModel.findOneAndUpdate(
        { address: wallets[i].address },
        { updateDate: Date.now(), $set: { ETH: eth } },
        { upsert: true, new: true },
      )
      count++
      console.log('chiamata numer: ' + count)
    }
    return true
  } catch (e) {
    console.log(e)
  }
}

self.readStringFile = async function () {
  try {
    const data = await readFile(filePath, 'utf8')
    var array = data.split(',')
    return array
  } catch (err) {
    console.log(err)
  }
}

self.accountToken = async function () {
  try {
    // Wallet address
    let wallets = await walletsModel.find().lean()
    for (var i = 0; i < wallets.length; i++) {
      let tokens = []
      const balances = await alchemy.core.getTokenBalances(wallets[i].address)
      // Remove tokens with zero balance
      const nonZeroBalances = balances.tokenBalances.filter((token) => {
        return token.tokenBalance !== '0'
      })
      let j = 1
      // Loop through all tokens with non-zero balance
      for (let token of nonZeroBalances) {
        // Get balance of token
        let balance = token.tokenBalance

        // Get metadata of token
        const metadata = await alchemy.core.getTokenMetadata(
          token.contractAddress,
        )

        // Compute token balance in human-readable format
        balance = balance / Math.pow(10, metadata.decimals)
        balance = balance.toFixed(10)

        // Print name, balance, and symbol of token
        console.log(`${j++}. ${metadata.name}: ${balance} ${metadata.symbol}`)
        let whaleToken = {
          address: token.contractAddress,
          name: metadata.name,
          symbol: metadata.symbol,
          balance: balance,
          decimal: metadata.decimals,
          logo: metadata.logo,
        }
        tokens.push(whaleToken)
      }
      await walletsModel.findOneAndUpdate(
        { address: wallets[i].address },
        { updateDate: Date.now(), $set: { tokens: tokens } },
        { upsert: true, new: true },
      )
    }
    return true
  } catch (e) {
    console.log(e)
  }
}

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

self.test = async function () {
  try {
    let wallets = await walletsModel.find().lean()
    for (let i = 0; i < wallets.length; i++) {
      let startTime = Date.now()
      const currentBlock = await alchemy.core.getBlockNumber()
      const tenBlocksAgo = currentBlock - 2000
      const sendedTx = await alchemy.core.getAssetTransfers({
        fromBlock: ethers.utils.hexlify(tenBlocksAgo),
        fromAddress: wallets[i].address,
        category: ['erc20', 'internal', 'external'],
        withMetadata: true
      })
      const recevedTx = await alchemy.core.getAssetTransfers({
        fromBlock: ethers.utils.hexlify(tenBlocksAgo),
        toAddress: wallets[i].address,
        category: ['erc20', 'internal', 'external'],
        withMetadata: true
      })
      let test2 = []
      if (recevedTx.transfers.length != 0) {
        for (let j = 0; j < recevedTx.transfers.length; j++) {
          let metadata
          if(recevedTx.transfers[j].rawContract.address != null){
            metadata = await alchemy.core.getTokenMetadata(
              recevedTx.transfers[j].rawContract.address,
            )
            test2.push(metadata)
            let balance = recevedTx.transfers[j].rawContract.value / Math.pow(10, metadata.decimals)
            recevedTx.transfers[j].value = balance.toFixed(10)
            recevedTx.transfers[j].asset = metadata.name
            console.log()
          }
        }
        console.log('done')
      }
      let endTime = Date.now()
      console.log(endTime - startTime)
    }
    // 0xEf1c6E67703c7BD7107eed8303Fbe6EC2554BF6B : Universal Router Uniswap
  } catch (e) {
    console.log(e)
  }
}

self.test1 = async function () {
  try {
    //start block
    const currentBlock = await alchemy.core.getBlockNumber()
    const data = await alchemy.core.getAssetTransfers({
      fromBlock: 14625985,
      fromAddress: '0x3e606be732d16d386Ef1873598D95d664Deb7DFD',
      category: ['internal'],
    })
    let test2 = []
    const ownedToken = await alchemy.core.getTokenBalances(
      '0x088b2777282dcdee86e2832e7b4df49b77c0519f',
      ['0x3e606be732d16d386Ef1873598D95d664Deb7DFD'],
    )
    let balance = ownedToken.tokenBalances[0].tokenBalance
    // Get metadata of token
    const metadata = await alchemy.core.getTokenMetadata(
      '0x3e606be732d16d386Ef1873598D95d664Deb7DFD',
    )
    // Compute token balance in human-readable format
    balance = balance / Math.pow(10, metadata.decimals)
    balance = balance.toFixed(10)
    let ownerTokenBalance= {
      address: '0x088b2777282dcdee86e2832e7b4df49b77c0519f',
      balance: balance,
      metadata: metadata
    }


    console.log('test')
  } catch (e) {
    console.log(e)
  }
}

module.exports = self
