var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const http = require("http");
const https = require("https");
const axios = require("axios");
const querystring = require("querystring");
const fs = require("fs");
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/hello', function(req, res, next) {
    res.send('Ich mache was! :P');
})
app.get('/inventory', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/getInventory', function(req, res, next) {
    const inventory = loadData();
    res.json(inventory);
});

const dataFilePath = path.resolve(__dirname, "inventoryDB.json");


// Function to load data from the JSON file
// Function to load data from the JSON file
function loadData() {
    try {
        // Check if the file exists
        if (fs.existsSync(dataFilePath)) {
            const data = fs.readFileSync(dataFilePath, 'utf8');
            return JSON.parse(data);
        } else {
            // If file doesn't exist, return an empty object
            return {};
        }
    } catch (err) {
        console.error('Error loading data:', err);
        // Return an empty object in case of an error
        return {};
    }
}

// Function to save data to the JSON file
function saveData(data) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 4), 'utf8');
    } catch (err) {
        console.error('Error saving data:', err);
    }
}
let inventory = loadData();
// let items = ["oil", "salt", "pepper", "chicken", "tomato", "onion", "garlic", "cheese", "sriracha", "basmati rice"];

//get from upcitemdb api free version
async function getBarcodeInfo(barcode) {
   // const url = "https://api.upcitemdb.com/prod/trial/lookup?upc=" + barcode;
    const url = "https://api.spoonacular.com/food/products/upc/" + barcode + "?apiKey=6e1e5b3c0e34460b8b4ac864c2b36ed7";
    const options = {
         method: "GET",
            headers: {
                    "Content-Type": "application/json"

            }

   }
    try {
        const response = await axios.get(url, options);
        const data = await response.data;
        console.log(data);
        return data;
    }
    catch (error) {
        console.log(error);
    }
}
//spoonacular api call. Get ingredients from text
async function extractIngredientList(items) {
    if(!Array.isArray(items)) items = [items];
    const ingredientText = items.join("\n");
    const apiUrl = "https://api.spoonacular.com/recipes/parseIngredients?apiKey=6e1e5b3c0e34460b8b4ac864c2b36ed7&language=en";

    const formData = querystring.stringify({
        'ingredientList': ingredientText,
    });

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: formData,
        url: apiUrl
    };

    try {
        const response = await axios(options);
        const data = response.data;
        // console.log(data);
        return data;
    } catch (error) {
        console.log(error);
    }
}
//spoonacular api call. Get recipe based on ingredients, number of recipes and diet
async function getRecipe(ingredients, number, diet) {
    const url = "https://api.spoonacular.com/recipes/findByIngredients?ingredients=" + ingredients + "&number=" + number + "&diet=" + diet + "&apiKey=6e1e5b3c0e34460b8b4ac864c2b36ed7";
    const options = {
        method: "GET",
        headers: {
            "Content-Type": "application/json"

        }
    }
    try {
        const response = await axios.get(url, options);
        const data = await response.data;
        return data;
    }
    catch (error) {
        console.log(error);
    }
}

app.post('/getRecipe', async function (req, res, next) {
   // body: JSON.stringify({
    //                     selectedItems: selectedItems,
    //                     diet: dietValue
    //                 })
    const ingredients = req.body.selectedItems;
    const diet = req.body.diet;
    const number = req.body.number;
    const ingredientList = await extractIngredientList(ingredients);
    const ingredientListNames = ingredientList.map(ingredient => ingredient.name);
    const recipe = await getRecipe(ingredientListNames, number, diet);
    console.log(recipe);
    res.send(recipe);
})
//receives a post request from the client and adds the new item to the database by using the barcode to identify the item
app.post('/addNewItem', async function (req, res, next) {
    const barcode = req.body.barcode;
    const itemInfo = await getBarcodeInfo(barcode);

    let inventory = loadData(); // Load existing data

    if (itemInfo.status === "failure") {
        console.log("Item with barcode " + barcode + " not found");
        res.status(400).send('Item not found');
    } else {
        const title = itemInfo.title; // Adjusted according to your specification
        console.log(title);
        console.log(inventory[title]);

        // Check if the item already exists
        if (inventory[title]) {
            console.log("Item with barcode " + barcode + " already exists");
            inventory[title].count += 1; // Increment the count
        } else {
            inventory[title] = { ...itemInfo, count: 1 }; // Add new item with count 1
        }

        saveData(inventory); // Save the updated data
        res.send('Item added to database');
    }
});

app.post('/addNewItemManual', async function (req, res, next) {
    const title = req.body.title;
    const barcode = req.body.barcode;
    const inventory = loadData();

    // Check if the item already exists
    if (inventory[title]) {
        inventory[title].count += 1; // Increment the count
    } else {
        inventory[title] = { title: title, barcode: barcode, count: 1 }; // Add new item with count 1
    }

    saveData(inventory); // Save the updated data
    res.send('Item added to database');
})
app.get('/getInventory', function(req, res, next) {
    const inventory = loadData();
    res.json(inventory);
})
app.post('/addItemByTitle', async function (req, res, next) {
    const title = req.body.title;
    const inventory = loadData();

    // Check if the item already exists
    if (inventory[title]) {
        inventory[title].count += 1; // Increment the count
    } else {
        //get item info from api extractIngredientList
        const itemInfo = await extractIngredientList(title);
        console.log(itemInfo);
        inventory[title] = { ...itemInfo[0], count: 1 }; // Add new item with count 1

    }

    saveData(inventory); // Save the updated data
    res.send('Item added to database');
})
app.patch('/updateItem', async function (req, res, next) {
    const title = req.body.title;
    const inventory = loadData();
    // Check if the item already exists
    if (inventory[title]) {
        if(req.body.count == 0) {
            delete inventory[title];
        } else {
            inventory[title].count = req.body.count;
        }
    } else {
        res.status(400).send('Item not found');
    }
    saveData(inventory); // Save the updated data
    res.send('Item updated in database');
})
//remove item from database
app.delete('/removeItem', async function (req, res, next) {
    const title = req.body.title;
    const inventory = loadData();

    console.log(title)
    console.log(inventory[title])
    console.log(inventory[title].count)
    // Check if the item already exists
    if (inventory[title]) {
        inventory[title].count -= 1; // Increment the count
        if (inventory[title].count === 0) {
            delete inventory[title];
        }
    } else {
        res.status(400).send('Item not found');
    }

    saveData(inventory); // Save the updated data
    res.send('Item removed from database');
})
app.get('/getRecipeDetails/:recipeId', async function (req, res, next) {
const recipeId = req.params.recipeId;
    const url = "https://api.spoonacular.com/recipes/" + recipeId + "/information?apiKey=6e1e5b3c0e34460b8b4ac864c2b36ed7";
    const options = {
        method: "GET",
        headers: {
            "Content-Type": "application/json"

        }
    }
    try {
        const response = await axios.get(url, options);
        const data = await response.data;
        res.send(data);
    }
    catch (error) {
        console.log(error);
        res.status(400).send('Recipe not found');
    }
})
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
