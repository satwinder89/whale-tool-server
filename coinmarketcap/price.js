/* Example in Node.js */
const axios = require('axios')
require('dotenv').config()

var self = {}

self.getEthPriceInUSD = async function () {
  try {
    try {
      const response = await axios.get(
        'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
        {
          params: {
            symbol: 'ETH',
            convert: 'USD',
          },
          headers: {
            'X-CMC_Pro_API_Key': process.env.COINMARKETCAP,
          },
        },
      )
      const price = response.data.data.ETH.quote.USD.price
      return price
      console.log(`The price of Ethereum in USD is $${price}`)
    } catch (error) {
      console.error(error)
    }
  } catch (e) {
    console.log(e)
  }
}

self.getTokenPriceInUSD = async function (tokenSymbol) {
  try {
    const response = await axios.get(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
      {
        params: {
          symbol: tokenSymbol,
          convert: 'USD',
        },
        headers: {
          'X-CMC_Pro_API_Key': process.env.COINMARKETCAP,
        },
      },
    )
    const price = response.data.data[tokenSymbol].quote.USD.price
    return price
  } catch (e) {
    console.log(e)
  }
}

module.exports = self
