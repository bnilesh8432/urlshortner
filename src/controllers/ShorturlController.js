const ShorturlModel = require('../models/ShorturlModel')
const shortid = require('shortid')
// const ValidUrl = require('valid-url')

const redis = require("redis");
const { promisify } = require("util");
const axios = require('axios')

//Connect to redis
const redisClient = redis.createClient(
    15207,
    "redis-15207.c264.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("YhqhQbKeONPvek3OQDMh30jaBgLnntwY", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});
//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


// ========================================createUrl==============================================

const createUrl = async function (req, res) {
    try {
        let body = req.body
        let baseUrl = req.headers.host;
        if (Object.keys(body).length == 0) return res.status(400).send({ status: false, message: "plzz give some data" });

        let longUrl = body.longUrl
        // if (!ValidUrl.isWebUri(longUrl)) return res.status(400).send({ status: false, message: "Enter valid URL" })
        if(!longUrl) return res.status(400).send({ status: false, message: "long url is required..." })
        let cahcedUrlData = await GET_ASYNC(`${req.body.longUrl}`)
        let obj = JSON.parse(cahcedUrlData)

        if (cahcedUrlData) {
            console.log("from cash memory...")
            return res.status(200).send({ status: true, massege: "short link is already generated ..", data: obj })
        } else {

            let flag = 0
            let check = await axios.get(longUrl)
                .then((res) => {
                    flag = 1
                    console.log({ msg: "then"})
                })
                .catch((err) => {
                    flag = 0
                    console.log({ msg: "catch"})

                })

            if (flag === 0) return res.status(404).send({status:false, message:"this url is not exist"})

            let isUrlCodePresent = await ShorturlModel.findOne({ longUrl })

            if (isUrlCodePresent) {
                console.log("db call...")
                await SET_ASYNC(`${longUrl}`, JSON.stringify(isUrlCodePresent))
                return res.status(200).send({ status: true, massege: "short link is already generated ..", data: isUrlCodePresent })
            }

            let urlCode = shortid.generate(longUrl)
            let shortUrl = baseUrl+'/'+urlCode

            let finalData = {
                urlCode: urlCode,
                longUrl: longUrl,
                shortUrl: shortUrl
            }

            let urlCreated = await ShorturlModel.create(finalData)

            return res.status(201).send({ status: true, data: urlCreated })
        }

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
// ========================================getUrl==============================================
const getUri = async function (req, res) {
    try {
        let urlCode = req.params.urlCode
        if (!urlCode) return res.status(400).send({ status: false, msg: "Enter urlCode" });

        let cahcedUrlData = await GET_ASYNC(`${urlCode}`)
        let obj = JSON.parse(cahcedUrlData)
        if (cahcedUrlData) {
            return res.redirect(302, obj.longUrl)
        } else {

            const isUrlCodePresent = await ShorturlModel.findOne({ urlCode: urlCode })
            if (!isUrlCodePresent) return res.status(404).send({ status: false, message: "Url not found ..." })

            await SET_ASYNC(`${urlCode}`, JSON.stringify(isUrlCodePresent))

            let url = isUrlCodePresent.longUrl
            return res.redirect(302, url)
        }
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

module.exports = { createUrl, getUri }

