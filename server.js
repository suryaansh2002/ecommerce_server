require("dotenv").config();
const express=require('express');
const connectDB=require('./config/db');
const app=express();
const PORT= process.env.PORT;
const productRoutes=require('./routes/productRoutes')
const cors = require("cors");
const stripe = require("stripe")("sk_test_51JT68iSGejj8oVuAhj4GEwiRCBpbvSXTMIa7N7f6dyGyyN1TiEFAHLFmCfRonFrOJ8K0wTyxzYxRcIoQcy7rLSPi00ir3L4TIx");
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const router=express.Router();




app.get('/',(req,res)=>{
    res.send("Go to /api/products to get all products, /:id to get a particular product")
 })
 
 app.get('/checkout',(req,res)=>{
    res.send("Stripe Api Checkout endpoint")
 })

connectDB();
app.use(express.json())
app.use(cors());
app.use('/api/products',productRoutes)



app.post("/checkout", async (req, res) => {
    console.log("Request:", req.body);
  
    let error;
    let status;
    try {
      const { product, token } = req.body;
  
      const customer = await stripe.customers.create({
        email: token.email,
        source: token.id,
        currency:"USD"
      });
  
      const idempotency_key = uuid();
      const charge = await stripe.charges.create(
        {
          amount: product.price * 100,
          currency: "USD",
          customer: customer.id,
          receipt_email: token.email,
          description: `Purchased the ${product.name}`,
          shipping: {
            name: token.card.name,
            address: {
              line1: token.card.address_line1,
              line2: token.card.address_line2,
              city: token.card.address_city,
              country: token.card.address_country,
              postal_code: token.card.address_zip
            }
          }
        },
        {
          idempotency_key
        }
      );
      console.log("Charge:", { charge });
      status = "success";
    } catch (error) {
      console.error("Error:", error);
      status = "failure";
    }
  
    res.json({ error, status });
  });
  
  app.use(bodyParser.json());
app.use('/.netlify/functions/server', router);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

  module.exports = app;
  module.exports.handler = serverless(app);
  

app.listen(PORT,'0.0.0.0');
