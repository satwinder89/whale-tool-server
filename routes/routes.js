const router = require('express').Router()
const transactionsController = require('../controllers/transactions')
const walletsController = require('../controllers/wallet')
const tokenMiddleware = require('../utils/verifyToken')

module.exports = () => {
  /**
   * @swagger
   * /login:
   *   post:
   *     summary: login with wallet address
   *     parameters:
   *       - name: address
   *         description: wallet address
   *         in: query
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: Wallet create SUCCESS
   */
  router.post('/login', walletsController.login)
  /**
   * @swagger
   * /wallets/create:
   *   post:
   *     summary: Create new wallet
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: name
   *         description: wallet name
   *         in: query
   *         required: true
   *         type: string
   *       - name: address
   *         description: wallet address
   *         in: query
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: Wallet create SUCCESS
   */
  router.post(
    '/wallets/create',
    tokenMiddleware.verifyToken,
    walletsController.createWallet,
  )
  /**
   * @swagger
   * /wallets:
   *   get:
   *     summary: ritorna i wallet ordinati per ETH descrescenti
   *     security:
   *        - bearerAuth: []
   *     parameters:
   *       - name: offset
   *         description: offset tabella
   *         in: query
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: wallets ritornati con successo
   */
  router.get(
    '/wallets',
    tokenMiddleware.verifyToken,
    walletsController.getWallets,
  )
  /**
   * @swagger
   * /wallets/{address}:
   *   get:
   *     summary: ritorna un wallet dato il suo address
   *     security:
   *        - bearerAuth: []
   *     parameters:
   *       - name: address
   *         description: address del wallet
   *         in: path
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: wallet ritornato con successo
   */
  router.get(
    '/wallets/:address',
    tokenMiddleware.verifyToken,
    walletsController.getWallet,
  )
  /**
   * @swagger
   * /getSwaps:
   *   get:
   *     summary: ritorna tutti gli swaps
   *     security:
   *        - bearerAuth: []
   *     parameters:
   *       - name: offset
   *         description: offset tabella
   *         in: query
   *         required: true
   *         type: string
   *       - name: gtValue
   *         description: volume swap maggiore di $
   *         in: query
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: swaps ritornati con successo
   */
  router.get(
    '/getSwaps',
    tokenMiddleware.verifyToken,
    transactionsController.getSwaps,
  )
  /**
   * @swagger
   * /getNFTs:
   *   get:
   *     summary: ritorna tutti gli NFTs swaps
   *     security:
   *        - bearerAuth: []
   *     parameters:
   *       - name: offset
   *         description: offset tabella
   *         in: query
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: NFTs swaps ritornati con successo
   */
  router.get(
    '/getNFTs',
    tokenMiddleware.verifyToken,
    transactionsController.getNFTs,
  )
  return router
}
