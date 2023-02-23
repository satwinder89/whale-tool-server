const Web3 = require('web3')
const web3 = new Web3(
  'https://eth-mainnet.g.alchemy.com/v2/EU0mDtrpOPKJMgrWfYm-7GeKGJMaJFZa',
)
const uniswapAbi = require('../abi/uniswapAbi.json') // sostituisci con il percorso al file ABI di Uniswap
const uniswapAddress = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d' // indirizzo del contratto Uniswap V2 Router 02 su Ethereum Mainnet
const uniswapContract = new web3.eth.Contract(uniswapAbi, uniswapAddress)
// Recupera il prezzo ETH/token dal contratto Uniswap
const address = {
  ETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
}
var self = {}

self.getTokenPrice = async function (tokenAddress, symbol) {
  try {
    if (/^UNI.+/.test(symbol)) {
        tokenAddress = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'.toLowerCase()
    }
    for (let currency in address) {
      console.log(`${currency}: ${symbol}: ${tokenAddress}`)
      try {
        let tokenPrice = await uniswapContract.methods
          .getAmountsOut(web3.utils.toWei('1'), [tokenAddress, address[currency]])
          .call()
        switch(currency) {
            case 'ETH':
                tokenPrice = Number(web3.utils.fromWei(tokenPrice[1], 'ether'))
                break;
            case 'USDT':
                tokenPrice = tokenPrice[1] / 1000000
                break;
            case 'USDC':
                tokenPrice = tokenPrice[1] / 1000000
                break;
            case 'DAI':
                tokenPrice = tokenPrice[1] / 1000000000000000000
                break;
        }
        return {
            pair: currency + '-' + symbol,
            value: tokenPrice
        }
      } catch (e) {
        console.log(e)
        continue
      }
    }
    // let tokenPriceETH = await uniswapContract.methods
    //   .getAmountsOut(web3.utils.toWei('1'), [tokenAddress, address.ETH])
    //   .call()
    // let tokenPriceUSDT = await uniswapContract.methods
    //   .getAmountsOut(web3.utils.toWei('1'), [tokenAddress, address.USDT])
    //   .call()
    // let tokenPriceUSDC = await uniswapContract.methods
    //   .getAmountsOut(web3.utils.toWei('1'), [tokenAddress, address.USDC])
    //   .call()
    // let tokenPriceDAI = await uniswapContract.methods
    //   .getAmountsOut(web3.utils.toWei('1'), [tokenAddress, address.DAI])
    //   .call()
    // tokenPriceETH = Number(web3.utils.fromWei(tokenPriceETH[1], 'ether'))
    // tokenPriceUSDT = tokenPriceUSDT[1] / 1000000
    // tokenPriceUSDC = tokenPriceUSDC[1] / 1000000
    // tokenPriceDAI = tokenPriceDAI[1] / 1000000000000000000
    // return {
    //   address: tokenAddress,
    //   priceETH: tokenPriceETH,
    //   priceUSDT: tokenPriceUSDT,
    //   priceUSDC: tokenPriceUSDC,
    //   priceDAI: tokenPriceDAI,
    // }
    // console.log(
    //   `Prezzo di 1 ETH in ${symbol}: ${web3.utils.fromWei(
    //     tokenPriceETH[1],
    //     'ether',
    //   )} ${symbol}`,
    // )
  } catch (e) {
    console.log(e)
  }
}
;('1000000000000000000')
;('4209164877973598')

module.exports = self
