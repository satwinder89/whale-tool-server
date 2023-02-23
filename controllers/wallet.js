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
        res.status(402).json({
          message: 'address must be a string',
        })
      }
      const ethereum = await blockchainModel.findOne({ name: 'Ethereum'}).lean()
      var wallet = await walletModel
        .findOne({ address: address })
        .lean()
      const contractAddresses = wallet.tokens.map(
        (token) => token.contractAddress,
      )
      const walletTokenPrices = await tokensModel
        .find({ address: { $in: contractAddresses } })
        .lean()
      for(var i =0; i < wallet.tokens.length; i++){
        const targetTokenPrice = walletTokenPrices.find(token => token.address === wallet.tokens[i].contractAddress);
        wallet.tokens[i].tokenBalance = wallet.tokens[i].tokenBalance / Math.pow(10, targetTokenPrice.decimals)
        wallet.tokens[i].name = targetTokenPrice.name
        wallet.tokens[i].logo = targetTokenPrice.logo
        wallet.tokens[i].price = targetTokenPrice.price
        wallet.tokens[i].symbol = targetTokenPrice.symbol
        wallet.tokens[i].decimals = targetTokenPrice.decimals
      }
      if (!wallet) {
        res.status(200).json({
          message: 'address not exist',
        })
        return
      }
      res.status(200).json({ wallet: wallet, ethPrice: ethereum.priceUSD})
      return
    } catch (e) {
      console.log(e)
    }
  },
}
