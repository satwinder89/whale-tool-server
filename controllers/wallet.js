const walletModel = require('../database/models/wallets')
const jwt = require('jsonwebtoken')

module.exports = {
  createWallet: async (req, res) => {
    try {
      const { address, name } = req.query
      if (!(typeof address === 'string')) {
        res.status(402).json({
          message: 'address must be a string',
        })
      }
      await walletModel.create({
        address: address.toLowerCase(),
        name: name,
        insertDate: Date.now(),
        updateDate: Date.now(),
      })
      res.status(200).json({
        message: 'SUCCESS',
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
      const wallets = await walletModel.find().sort({ ETH: -1 }).skip(offset * 32).limit(32).lean();
      const countWallets = await walletModel.countDocuments()
      res.status(200).json({
        wallets: wallets,
        totWallets: countWallets
      })
    }catch(e){
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
      const wallet = await walletModel.findOne({ address: address }).lean()
      if(!wallet) {
        res.status(400).json({ 
          message: "address not exist"
         })
         return
      }
      res.status(200).json(wallet)
      return
    }catch(e){
      console.log(e)
    }
  }
}
