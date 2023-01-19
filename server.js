// Setup: npm install alchemy-sdk
const { Alchemy, Network } = require('alchemy-sdk')
require('dotenv').config()
const addressBalances = require('./ethereum/addressBalances')

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
}
const alchemy = new Alchemy(config)



const main = async () => {
  let addresss = await addressBalances.accountEthBalance()

  // Wallet address
  const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'

  // Get token balances
  const balances = await alchemy.core.getTokenBalances(address)

  console.log(`The balances of ${address} address are:`, balances)

  const addresses = ['0x06d49448c83a8fe3976e35187bea1bf07278fe96']
  let test = await alchemy.core.getBalance('0x06d49448c83a8fe3976e35187bea1bf07278fe96', "latest")
  let eth = Number(test._hex) / Math.pow(10, 18); //calculate che ETH from WEI
  console.log(eth)
}

const runMain = async () => {
  try {
    await main()
    process.exit(0)
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

runMain()
