// Setup: npm install alchemy-sdk
const { Alchemy, Network } = require('alchemy-sdk')
require('dotenv').config()
const util = require('util')
const fs = require('fs')
const filePath = './whales.txt'
const readFile = util.promisify(fs.readFile)

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
}
const alchemy = new Alchemy(config)

var self = {}

self.accountEthBalance = async function () {
  try {
    let address = await self.readStringFile()
    let whales = []
    let whale = {}
    let count = 0
    for (var i = 0; i < address.length; i++) {
      let test = await alchemy.core.getBalance(address[i], 'latest')
      let eth = Number(test._hex) / Math.pow(10, 18) //calculate che ETH from WEI
      whale = {
        name: 'WHALE#' + i,
        address: address[i],
        ETH: eth,
      }
      whales.push(whale)
      count++
      console.log('chiamata numer: ' + count)
    }
    return whales
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

module.exports = self
