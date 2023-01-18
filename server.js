const request = require('request')
require('dotenv').config()
const util = require('util')
const fs = require('fs')
const filePath = './whales.txt'

const readFile = util.promisify(fs.readFile)

async function readStringFile() {
  try {
    const data = await readFile(filePath, 'utf8')
    var array = data.split('\n\n')
    return array
    console.log(data)
  } catch (err) {
    console.error(err)
  }
}
//28018

async function requestNew(options) {
  return new Promise(function (resolve, reject) {
    try {
      request(options, function (error, res, body) {
        if (!error && res.statusCode == 200) {
          resolve(body)
        } else {
          reject(error)
        }
      })
      // console.log("Numero chiamate ogni aggiornamento della strategia: " + count);
    } catch (e) {
      console.error(e)
    }
  })
}

async function getWalletBalance(address) {
  const options = {
    url: 'https://api.etherscan.io/api',
    qs: {
      module: 'account',
      action: 'balancemulti',
      address: address,
      tag: 'latest',
      apikey: process.env.ETHERSCAN_API,
    },
  }
  let result = await requestNew(options)
  console.log(result)
}
const sleep = m => new Promise(r => setTimeout(r, m))

;(async () => {
  const address = await readStringFile()
  for (var i = 0; i < address.length; i++) {
    // await getWalletBalance(address[i])
    await sleep(1000)
    await getWalletBalance(address[i])
  }
  console.log()
})()
