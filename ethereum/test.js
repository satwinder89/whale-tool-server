// Setup: npm install alchemy-sdk
const { Alchemy, Network, AlchemySubscription } = require('alchemy-sdk')

require('dotenv').config()
const util = require('util')
const fs = require('fs')
const filePath = './whales.txt'
const readFile = util.promisify(fs.readFile)
const walletsModel = require('../database/models/wallets')
const transactionsModel = require('../database/models/transactions')
const blockchainsModel = require('../database/models/blockchain')
const ethers = require('ethers')
const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID'));

async function isSmartContract(address) {
  const code = await web3.eth.getCode(address);
  return code.length > 2;
}


//https://eth-mainnet.g.alchemy.com/v2/EU0mDtrpOPKJMgrWfYm-7GeKGJMaJFZa

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
}
const alchemy = new Alchemy(config)

var self = {}

self.setBlockchain = async function () {
  try {
    const currentBlock = await alchemy.core.getBlockNumber()
    const blocks = ethers.utils.hexlify(currentBlock)
    await blockchainsModel.create({
      name: 'Ethereum',
      updatedBlocks: blocks,
    })
    return true
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
    let ownerTokenBalance = {
      address: '0x088b2777282dcdee86e2832e7b4df49b77c0519f',
      balance: balance,
      metadata: metadata,
    }

    console.log('test')
  } catch (e) {
    console.log(e)
  }
}

self.readStringFile = async function () {
  try {
    const data = await readFile(filePath, 'utf8')
    var array = data.split('\n')
    for(var i =0; i < array.length; i++){
      array[i] = array[i].toLowerCase()
    }
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

self.createAllWallets = async function () {
  try {
    let address = await self.readStringFile()
    let arrayOfAddress = []
    for (var i = 1; i < address.length; i++) {
      let newAddress = {
        name: 'WHALE #' + i,
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

self.addressInList = function (address, addressList) {
  try {
    if (addressList.includes(address)) {
      return { from }
    } else {
      console.log(`${string} is not in the array`)
    }
  } catch (e) {
    console.log(e)
  }
}

module.exports = self
