const express = require('express')
const Sequelize = require('sequelize')
const path = require('path')
const bodyParser = require('body-parser')
const { Model } = require('sequelize')
const validator = require('validator').default;
const cors = require('cors')
const { createToken, verifyToken, createPasswordHash, comparePassword } = require('./auth-service')
const app = express()

const port = process.env.port || 3000

const sequelize = new Sequelize('database', 'root', 'mrbeast',{
  host: 'localhost',
  dialect: 'mysql'
})

class Feedback extends Model { }
class Admin extends Model { }

Feedback.init({
  name: Sequelize.STRING,
  email: Sequelize.STRING,
  feedback: Sequelize.TEXT
}, { sequelize, modelName: 'feedback'})

Admin.init({
    name: Sequelize.DataTypes.STRING,
    password: Sequelize.DataTypes.STRING
}, { sequelize, modelName: 'Admin'})

start()

async function start()
{
    try {
        await sequelize.authenticate()
        await sequelize.sync()
        console.log('help')
        startApp()
    } catch (error) {
        console.error(error)
    }
}

function startApp()
{
    app.use(cors())
    app.use(express.json())
    app.use(bodyParser.json())

    app.post('/api/admin', async function (req, res) {
        console.log('mrbeast')
        const passwordHash = createPasswordHash(req.body.password)
        const newAdmin = await Admin.create({
            name: req.body.name,
            password: passwordHash
        })
        res.send(newAdmin)
    })

    app.post('/api/login', async function (req, res) {
        const userFromDB = await Admin.findOne({ where: { name: req.body.name } })
        
        if (comparePassword(req.body.password, userFromDB.password)) {
            const token = createToken(userFromDB)
            res.send({
                token
            })
        } else {
            res.status(403).send({
                message: 'Wrong password'
            })
        }
    })

    app.get('/api/feedback', verifyToken, async function (req, res) {
        const orders = await Feedback.findAll()
        res.send(orders)
    })

    app.post('/api/feedback', async (req, res) => {
        const feedbackInfo = req.body
        let validataionError = []
        console.log(req.body)  
        
        if (!validator.isLength(feedbackInfo.name, { min: 3, max: 80 }))
            validataionError.push('Wrong name')
        if (!validator.isEmail(feedbackInfo.email) || !validator.isLength(feedbackInfo.email, { min: 3, max: 80 }))
            validataionError.push('Wrong E-mail')
        if (!validator.isLength(feedbackInfo.feedback, { min: 1, max: 2000 }))
            validataionError.push('Wrong feedback')
        
        console.log(validator.isLength(feedbackInfo.name, { min: 3, max: 80 })) 
        if (validataionError.length) {
            res.status(400).send({ messages: validataionError })
        } else {
            const feedbackInfoDB = await Feedback.create(feedbackInfo)
            res.send(feedbackInfoDB)
        }
    })

    app.use(express.static(path.join(__dirname, 'public')))

    app.listen(port, () => {
    console.log('Server is listening on port ' + port)
    })
}