const walletModel = require('../database/models/wallets')
const tokensModel = require('../database/models/tokens')
const blockchainModel = require('../database/models/blockchain')
const jwt = require('jsonwebtoken')

module.exports = {
  createWallet: async (req, res) => {
    try {
      const { address } = req.query
      if (!(typeof address === 'string')) {
        res.status(402).json({
          message: 'address must be a string',
        })
      }
      let lastWhale = await walletModel.aggregate([
        { $match: { name: /^WHALE #\d+$/ } },
        {
          $project: {
            name: 1,
            number: { $toInt: { $substr: ['$name', 7, -1] } },
          },
        },
        { $group: { _id: '$name', maxNumber: { $max: '$number' } } },
        { $sort: { maxNumber: -1 } },
        { $limit: 1 },
        { $project: { _id: 0, name: '$_id', number: '$maxNumber' } },
      ])

      const str = lastWhale[0].name
      const parts = str.split('#')
      const name = 'WHALE #' + (parseInt(parts[1]) + 1)
      let wallet = await walletModel.create({
        address: address.toLowerCase(),
        name: name,
        insertDate: Date.now(),
        updateDate: Date.now(),
      })
      res.status(200).json({
        message: 'SUCCESS',
        wallet: wallet,
      })
      return
    } catch (e) {
      console.log(e)
    }
  },
  login: async (req, res) => {
    try {
      const { address } = req.query
      if (!(typeof address === 'string')) {
        res.status(402).json({
          message: 'address must be a string',
        })
      }
      // TODO: verifica l'indirizzo del wallet in modo sicuro, ad esempio confrontando con una whitelist di indirizzi autorizzati

      if (address) {
        const token = jwt.sign({ address }, process.env.JWT_SECRET, {
          expiresIn: '1h',
        })
        res.json({ token })
      } else {
        res.status(401).json({ message: 'Invalid wallet' })
      }
    } catch (e) {
      console.log(e)
    }
  },
  getWallets: async (req, res) => {
    try {
      const offset = Number(req.query.offset)
      if (offset == undefined || offset == null) {
        return res
          .status(400)
          .json({ message: 'FAIL', error: 'WRONG_OFFSET_FORMAT' })
      }
      const wallets = await walletModel
        .find()
        .sort({ ETH: -1 })
        .skip(offset * 32)
        .limit(32)
        .lean()
      const countWallets = await walletModel.countDocuments()
      res.status(200).json({
        wallets: wallets,
        totWallets: countWallets,
      })
    } catch (e) {
      console.log(e)
    }
  },
  getWallet: async (req, res) => {
    try {
      const { address } = req.params
      if (!(typeof address === 'string')) {
        res.status(200).json({
          message: 'address must be a string',
        })
      }
      var wallet = await walletModel.findOne({ address: address }).lean()
      if (!wallet) {
        res.status(200).json({
          message: 'address not exist',
        })
        return
      }
      const ethereum = await blockchainModel
        .findOne({ name: 'Ethereum' })
        .lean()
      if (!wallet.tokens) {
        res.status(200).json({
          wallet: wallet,
          message: 'Token del wallet non aggiornati',
        })
        return
      }
      // wallet.tokens[wallet.tokens.length - 1].tokens
      for (var i = 0; i < wallet.tokens.length; i++) {
        const contractAddresses = wallet.tokens[i].tokens.map(
          (token) => token.contractAddress,
        )
        const walletTokenPrices = await tokensModel
          .find({ address: { $in: contractAddresses } })
          .lean()
        if (walletTokenPrices.length == 0) {
          res.status(200).json({
            message: 'No token price found',
          })
          return
        }
        for (var j = 0; j < wallet.tokens[i].tokens.length; j++) {
          const targetTokenPrice = walletTokenPrices.find(
            (token) =>
              token.address === wallet.tokens[i].tokens[j].contractAddress,
          )
          wallet.tokens[i].tokens[j].tokenBalance =
            wallet.tokens[i].tokens[j].tokenBalance /
            Math.pow(10, targetTokenPrice.decimals)
          wallet.tokens[i].tokens[j].name = targetTokenPrice.name
          wallet.tokens[i].tokens[j].logo = targetTokenPrice.logo
          wallet.tokens[i].tokens[j].price = targetTokenPrice.price
          wallet.tokens[i].tokens[j].symbol = targetTokenPrice.symbol
          wallet.tokens[i].tokens[j].decimals = targetTokenPrice.decimals
        }
      }
      res.status(200).json({ wallet: wallet, ethPrice: ethereum.priceUSD })
      return
    } catch (e) {
      console.log(e)
    }
  },
  getWalletHolding: async (req, res) => {
    try {
      // const tokens = await tokensModel.find().lean()
      var wallet = await walletModel.find({ tokens: { $exists: true } }).lean()
      var tokenBalances = []

      for (var z = 0; z < wallet.length; z++) {
        const contractAddresses = wallet[z].tokens[
          wallet[z].tokens.length - 1
        ].tokens.map((token) => token.contractAddress)
        const walletTokenPrices = await tokensModel
          .find({ address: { $in: contractAddresses } })
          .lean()
        if (walletTokenPrices.length == 0) {
          continue
          // res.status(200).json({
          //   message: 'No token price found',
          // })
          // return
        }
        //wallet[z].tokens.length - 1
        for (
          var j = 0;
          j < wallet[z].tokens[wallet[z].tokens.length - 1].tokens.length;
          j++
        ) {
          try {
            const targetTokenPrice = walletTokenPrices.find(
              (token) =>
                token.address ===
                wallet[z].tokens[wallet[z].tokens.length - 1].tokens[j]
                  .contractAddress,
            )
            wallet[z].tokens[wallet[z].tokens.length - 1].tokens[
              j
            ].tokenBalance =
              wallet[z].tokens[wallet[z].tokens.length - 1].tokens[j]
                .tokenBalance / Math.pow(10, targetTokenPrice.decimals)
            wallet[z].tokens[wallet[z].tokens.length - 1].tokens[j].name =
              targetTokenPrice.name
            wallet[z].tokens[wallet[z].tokens.length - 1].tokens[j].logo =
              targetTokenPrice.logo
            wallet[z].tokens[wallet[z].tokens.length - 1].tokens[j].price =
              targetTokenPrice.price
            wallet[z].tokens[wallet[z].tokens.length - 1].tokens[j].symbol =
              targetTokenPrice.symbol
            wallet[z].tokens[wallet[z].tokens.length - 1].tokens[j].decimals =
              targetTokenPrice.decimals

            const value =
              wallet[z].tokens[wallet[z].tokens.length - 1].tokens[j].price
                .value
            const tokenBalance =
              wallet[z].tokens[wallet[z].tokens.length - 1].tokens[j]
                .tokenBalance
            const symbol =
              wallet[z].tokens[wallet[z].tokens.length - 1].tokens[j].symbol
            const pair =
              wallet[z].tokens[wallet[z].tokens.length - 1].tokens[j].price.pair

            if (value == 0 || tokenBalance == 0 || symbol == '') {
              continue
            }
            //prima della somma inserire il check sui PAIR
            const newObject = {
              address:
                wallet[z].tokens[wallet[z].tokens.length - 1].tokens[j]
                  .contractAddress,
              value: value * tokenBalance,
              pair: pair,
              holders: [
                {
                  wallet: wallet[z].address,
                  name: wallet[z].name,
                  value: value,
                  tokenBalance: tokenBalance,
                },
              ],
            }
            // if(newObject.address == "0x0b452278223d3954f4ac050949d7998e373e7e43"){
            //   console.log("STOP")
            // }

            let exists = false
            for (let i = 0; i < tokenBalances.length; i++) {
              if (tokenBalances[i].address === newObject.address) {
                tokenBalances[i].value =
                  tokenBalances[i].value + newObject.value
                tokenBalances[i].holders.push({
                  wallet: wallet[z].address,
                  name: wallet[z].name,
                  value: value,
                  tokenBalance: tokenBalance,
                })
                exists = true
                break
              }
            }
            // Se non esiste già un oggetto con lo stesso indirizzo, aggiungere il nuovo oggetto all'array
            if (!exists) {
              tokenBalances.push(newObject)
            }
            tokenValue = tokenBalance * value
            console.log('e')
          } catch (e) {
            continue
          }
        }
        tokenBalances.sort((a, b) => b.value - a.value)
        console.log('test')
      }
      res.status(200).json({ wallet: tokenBalances })
      return
    } catch (e) {
      console.log(e)
    }
  },
}
