const walletModel = require('../database/models/wallets')

module.exports = {
  createWallet: async (req, res) => {
    try {
      const { address, name } = req.query
      if (!(typeof address === 'string')) {
        res.status(402).json({
            message: "address must be a string"
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
}
