const transactionsModel = require('../database/models/transactions')
const blockchainModel = require('../database/models/blockchain')

module.exports = {
  getSwaps: async (req, res) => {
    try {
      const offset = Number(req.query.offset)
      const gtValue = req.query.gtValue ? Number(req.query.gtValue) : 0
      const ltValue = req.query.ltValue ? Number(req.query.ltValue) : 0
      const address = req.query.address ? req.query.address.toString() : ''
      const contract = req.query.contract ? req.query.contract.toString() : ''
      if (offset == undefined || offset == null) {
        return res
          .status(400)
          .json({ message: 'FAIL', error: 'WRONG_OFFSET_FORMAT' })
      }
      let ethPrice = await blockchainModel.findOne({ name: 'Ethereum' }).lean()
      let gtEthPrice = Number(gtValue / ethPrice.priceUSD)
      let ltEthPrice = 0
      if (ltValue !== 0) {
        ltEthPrice = Number(ltValue / ethPrice.priceUSD)
      }

      // Timer
      let startTime = Date.now()
      let pipeline = [
        {
          $group: {
            _id: '$hash',
            count: { $sum: 1 },
            whale: { $first: '$from' },
            assetIn: { $first: '$asset' },
            addressIn: { $first: '$address' },
            assetOut: { $last: '$asset' },
            addressOut: { $last: '$address' },
            valueAssetIn: { $first: '$value' },
            valueAssetOut: { $last: '$value' },
            categories: { $push: '$category' },
            timestamp: { $first: '$date' },
          },
        },
        {
          $match: { categories: { $nin: ['erc721', 'erc1155', 'specialnft'] } },
        },
      ]
      if (address != '') {
        pipeline.push({
          $match: {
            whale: address,
          },
        })
      }

      if (contract != '') {
        pipeline.push({
          $match: {
            $or: [{ addressIn: contract }, { addressOut: contract }],
          },
        })
      }

      pipeline.push(
        {
          $project: {
            _id: 1,
            count: 1,
            whale: 1,
            assetIn: 1,
            addressIn: 1,
            assetOut: 1,
            addressOut: 1,
            valueAssetIn: 1,
            valueAssetOut: 1,
            categories: 1,
            timestamp: 1,
            comparisonResult: { $strcasecmp: ['$addressIn', '$addressOut'] },
          },
        },
        {
          $match: {
            $and: [
              { comparisonResult: { $ne: 0 } },
              { valueAssetIn: { $ne: null } },
              { valueAssetOut: { $ne: null } },
              { count: { $lte: 3 } },
              { count: { $gt: 1 } },
              {
                $or: [
                  {
                    $and: [
                      { assetIn: { $in: ['ETH', 'WETH'] } },
                      { valueAssetIn: { $gte: gtEthPrice } },
                      ltEthPrice !== 0
                        ? { valueAssetIn: { $lte: ltEthPrice } }
                        : {},
                    ],
                  },
                  {
                    $and: [
                      { assetOut: { $in: ['ETH', 'WETH'] } },
                      { valueAssetOut: { $gte: gtEthPrice } },
                      ltEthPrice !== 0
                        ? { valueAssetOut: { $lte: ltEthPrice } }
                        : {},
                    ],
                  },
                  {
                    $and: [
                      { assetIn: { $in: ['USDT', 'USDC', 'DAI'] } },
                      { valueAssetIn: { $gte: gtValue } },
                      ltValue !== 0 ? { valueAssetIn: { $lte: ltValue } } : {},
                    ],
                  },
                  {
                    $and: [
                      { assetOut: { $in: ['USDT', 'USDC', 'DAI'] } },
                      { valueAssetOut: { $gte: gtValue } },
                      ltValue !== 0 ? { valueAssetOut: { $lte: ltValue } } : {},
                    ],
                  },
                ],
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'wallets',
            localField: 'whale',
            foreignField: 'address',
            as: 'whaleName',
          },
        },
        {
          $project: {
            _id: 1,
            whale: 1,
            whaleName: '$whaleName.name',
            count: 1,
            assetIn: 1,
            addressIn: 1,
            assetOut: 1,
            addressOut: 1,
            categories: 1,
            valueAssetIn: { $toDouble: '$valueAssetIn' },
            valueAssetOut: { $toDouble: '$valueAssetOut' },
            comparisonResult: 1,
            timestamp: 1,
          },
        },
        {
          $match: {
            whaleName: { $ne: [] },
          },
        },
        {
          $sort: { timestamp: -1 },
        },
      )
      pipeline.push({
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      })
      const countTransactions = await transactionsModel.aggregate(pipeline)
      if (countTransactions.length == 0) {
        res.status(404).json({
          message: 'No transactions found!',
        })
        return
      }
      pipeline.pop()
      pipeline.push(
        {
          $skip: offset * 32,
        },
        {
          $limit: 32,
        },
      )
      const transactions = await transactionsModel.aggregate(pipeline)
      let endTime = Date.now() - startTime
      console.log('ended: ' + endTime)
      res.status(200).json({
        swaps: transactions,
        totSwaps: countTransactions[0].count,
      })
      return
    } catch (e) {
      console.log(e)
    }
  },

  getNFTs: async (req, res) => {
    try {
      const offset = Number(req.query.offset)
      const gtValue = req.query.gtValue ? Number(req.query.gtValue) : 0
      const ltValue = req.query.ltValue ? Number(req.query.ltValue) : 0
      const address = req.query.address ? req.query.address.toString() : ''
      const contract = req.query.contract ? req.query.contract.toString() : ''
      if (offset == undefined || offset == null) {
        return res
          .status(400)
          .json({ message: 'FAIL', error: 'WRONG_OFFSET_FORMAT' })
      }
      let ethPrice = await blockchainModel.findOne({ name: 'Ethereum' }).lean()
      let gtEthPrice = Number(gtValue / ethPrice.priceUSD)
      let ltEthPrice = 0
      if (ltValue !== 0) {
        ltEthPrice = Number(ltValue / ethPrice.priceUSD)
      }
      let startTime = Date.now()

      let pipeline = [
        {
          $group: {
            _id: '$hash',
            count: { $sum: 1 },
            whale: { $first: '$from' },
            mint: { $last: '$from' },
            assetIn: { $first: '$asset' },
            addressIn: { $first: '$address' },
            assetOut: { $last: '$asset' },
            addressOut: { $last: '$address' },
            valueAssetIn: { $first: '$value' },
            valueAssetOut: { $last: '$value' },
            categories: { $push: '$category' },
            timestamp: { $first: '$date' },
            tokenId: { $push: '$tokenId' },
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            whale: 1,
            assetIn: 1,
            addressIn: 1,
            assetOut: 1,
            addressOut: 1,
            valueAssetIn: 1,
            valueAssetOut: 1,
            categories: 1,
            timestamp: 1,
            comparisonResult: { $strcasecmp: ['$addressIn', '$addressOut'] },
            mint: 1,
            tokenId: 1,
          },
        },
        {
          $match: {
            $and: [
              { categories: { $in: ['erc721', 'erc1155', 'specialnft'] } },
              { count: { $lte: 3 } },
              { count: { $gt: 1 } },
              { comparisonResult: { $ne: 0 } },
              // {
              //   $or: [
              //     {
              //       $and: [
              //         { assetIn: { $in: ['ETH', 'WETH'] } },
              //         { valueAssetIn: { $gt: gtEthPrice } },
              //         ltEthPrice !== 0
              //           ? { valueAssetIn: { $lte: ltEthPrice } }
              //           : {},
              //       ],
              //     },
              //     {
              //       $and: [
              //         { assetOut: { $in: ['ETH', 'WETH'] } },
              //         { valueAssetOut: { $gt: gtEthPrice } },
              //         ltEthPrice !== 0
              //           ? { valueAssetOut: { $lte: ltEthPrice } }
              //           : {},
              //       ],
              //     },
              //     {
              //       $and: [
              //         { assetIn: { $in: ['USDT', 'USDC', 'DAI'] } },
              //         { valueAssetIn: { $gt: gtValue } },
              //         ltValue !== 0 ? { valueAssetIn: { $lte: ltValue } } : {},
              //       ],
              //     },
              //     {
              //       $and: [
              //         { assetOut: { $in: ['USDT', 'USDC', 'DAI'] } },
              //         { valueAssetOut: { $gt: gtValue } },
              //         ltValue !== 0 ? { valueAssetOut: { $lte: ltValue } } : {},
              //       ],
              //     },
              //   ],
              // },
            ],
          },
        },
        {
          $lookup: {
            from: 'wallets',
            localField: 'whale',
            foreignField: 'address',
            as: 'whaleName',
          },
        },
      ]
      if (address != '') {
        pipeline.push({
          $match: {
            whale: address,
          },
        })
      }
      if (contract != '') {
        pipeline.push({
          $match: {
            $or: [{ addressIn: contract }, { addressOut: contract }],
          },
        })
      }
      pipeline.push(
        {
          $match: {
            whaleName: { $ne: [] },
          },
        },
        {
          $project: {
            _id: 1,
            whale: 1,
            whaleName: '$whaleName.name',
            count: 1,
            assetIn: 1,
            addressIn: 1,
            assetOut: 1,
            addressOut: 1,
            valueAssetIn: { $toDouble: '$valueAssetIn' },
            valueAssetOut: { $toDouble: '$valueAssetOut' },
            categories: 1,
            timestamp: 1,
            mint: 1,
            tokenId: 1,
          },
        },
        {
          $sort: {
            timestamp: -1,
          },
        },
      )
      pipeline.push({
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      })
      const countTransactionsSwaps = await transactionsModel.aggregate(pipeline)
      // const countNftMint = await transactionsModel
      //   .find({
      //     from: '0x0000000000000000000000000000000000000000',
      //     category: { $in: ['erc721', 'erc1155', 'specialnft'] },
      //     type: 'receved',
      //   })
      //   .sort({ date: -1 })
      //   .countDocuments()
      if (countTransactionsSwaps.length == 0) {
        res.status(404).json({
          message: 'No transactions found!',
        })
        return
      }
      pipeline.pop()
      pipeline.push(
        {
          $skip: offset * 32,
        },
        {
          $limit: 32,
        },
      )
      const transactionsSwaps = await transactionsModel.aggregate(pipeline)
      // const nftMints = await transactionsModel
      //   .find({
      //     from: '0x0000000000000000000000000000000000000000',
      //     category: { $in: ['erc721', 'erc1155', 'specialnft'] },
      //     type: 'receved',
      //   })
      //   .sort({ date: -1 })
      //   .limit(32 - countTransactionsSwaps.length)
      //   .lean()

      let endTime = Date.now() - startTime
      console.log('ended: ' + endTime)
      res.status(200).json({
        swaps: transactionsSwaps,
        totSwaps: countTransactionsSwaps[0].count,
      })
      return
    } catch (e) {
      console.log(e)
    }
  },
}
