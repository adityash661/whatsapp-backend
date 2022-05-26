//importing
import express from 'express';
import mongoose from 'mongoose';
import Message from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';

//app config
const app = express()
const port = process.env.PORT || 9000

const pusher = new Pusher({
  appId: "1413707",
  key: "8449a7031e997b0be380",
  secret: "6ed2810cfcc0d98ad150",
  cluster: "ap2",
  useTLS: true
});
//middleware
app.use(express.json())
app.use(cors());

//Database
const connection_url = 'mongodb+srv://admin:w4VInD7DmA4lGEr1@cluster0.cesru.mongodb.net/whatsappdb?retryWrites=true&w=majority'
mongoose.connect(connection_url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

// surprise
const db = mongoose.connection

db.once('open', () => {
  console.log("Db is connected")
  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on('change', (change) => {
    if (change.operationType === 'insert') {
      const messageDetails = change.fullDocument;
      pusher.trigger('messages', 'inserted', 
        {
          name: messageDetails.name,
          message: messageDetails.message,
          timestamp: messageDetails.timestamp,
          received: messageDetails.received
        });
    } else {
      console.log("Error has occured while pushing!!");
    }
  });
});


//API routes
app.get('/', (req, res) => res.status(200).send('Hello Boy')) 

//Listener

app.get('/api/v1/messages/sync', (req, res) => {
  Message.find((err, data) => {
    if (err) {
      res.status(500).send(err)
    } else {
      res.status(200).send(data)
    }
  })
})

app.post('/api/v1/messages/new', (req, res) => {
  const dbMessage = req.body

  Message.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err)
    } else {
      res.status(201).send(data)
    }
  })
})
app.listen(port, () => console.log(`Listening on local host: ${port}`));