const request = require('request')
require('dotenv').config()
const util = require('util')
const fs = require('fs')
const filePath = './whales.txt'


async function readStringFile() {
  try {
    const data = await readFile(filePath, 'utf8')
    var array = data.split(',')
    return array
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
    } catch (e) {
      console.error(e)
    }
  })
}

async function getWalletBalance() {
  const address = await readStringFile()
  for (var i = 0; i < address.length; i++) {
    await sleep(1000)
    const options = {
      url: 'https://api.etherscan.io/api',
      qs: {
        module: 'account',
        action: 'balancemulti',
        address: address[i],
        tag: 'latest',
        apikey: process.env.ETHERSCAN_API,
      },
    }
    let result = await requestNew(options)
    console.log(result)
  }
}
const sleep = m => new Promise(r => setTimeout(r, m))

;(async () => {
  await getWalletBalance()
  console.log()
})()
