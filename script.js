// // Google Sheets API settings
// const SPREADSHEET_ID = "15sfxHgPlCvcYxFRwtx9cAjT_k8Y_4Lp48SSYvIxx4Rs"; 
// const API_KEY = "AIzaSyCU7DGoc9M3LDkccUZeFITDc5jBoGqnkA8"; 

// Google Sheets API settings
const SPREADSHEET_ID = "15sfxHgPlCvcYxFRwtx9cAjT_k8Y_4Lp48SSYvIxx4Rs"; 

// Keep track of the products in the cart with a Map
const cartProducts = new Map();

// Function to find a product by its barcode from Google Sheets data
async function findProductByBarcodeFromGoogleSheets(barcode) {
  try {
    const sheetRange = 'Sheet1!A1:Z1000';
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetRange,
    });

    const values = response.result.values;
    console.log("Google Sheets API Response:", values); // Log the API response

    // Find the header row to get the indexes of each field
    const headerRow = values[0];
    const nameIndex = headerRow.indexOf('Name');
    const priceIndex = headerRow.indexOf('Price');
    const barcodeIndex = headerRow.indexOf('Barcode');
    const weightIndex = headerRow.indexOf('Weight');
    const imageIndex = headerRow.indexOf('Image');

    if (values && values.length) {
      const product = values.find((row) => row[barcodeIndex] === barcode);
      if (product) {
        const name = product[nameIndex];
        const price = parseFloat(product[priceIndex]);
        const weight = parseFloat(product[weightIndex]);
        const image = product[imageIndex];
        return { barcode, name, price, image, weight };
      }
    }
    return null; // Barcode not found in the Google Sheets data
  } catch (error) {
    console.error("Error reading products from Google Sheets:", error);
    return null;
  }
}


// Function to remove a product from the cart and update the cart display
function removeFromCart(product) {
  if (cartProducts.has(product.barcode)) {
    cartProducts.delete(product.barcode);
    
  }
  updateTotalPriceAndCartDisplay();
  updateCartDisplay();
}


// Function to add a product to the cart and update the cart display
function addToCart(product) {
  const accumulatedWeight = product.weight ? product.weight : 0;
  const newProduct = { ...product, quantity: 1, accumulatedWeight };
  cartProducts.set(newProduct.barcode + Date.now(), newProduct);
  updateTotalPriceAndCartDisplay();
}


// Function to calculate the total price of items in the cart
function calculateTotalPrice() {
  let totalPrice = 0;
  cartProducts.forEach((product) => {
    totalPrice += product.price * product.quantity;
  });
  return totalPrice;
}



// Function to update the cart display
function updateCartDisplay() {
  const cartItems = document.getElementById("cart-items");
  cartItems.innerHTML = "";
  cartProducts.forEach((product) => {
    const li = document.createElement("li");
    li.textContent = `${product.name} - $${product.price} `;

    const imageElement = document.createElement("img");
    imageElement.src = product.image;
    li.appendChild(imageElement);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      cartProducts.forEach((value, key) => {
        if (value === product) {
          cartProducts.delete(key);
        }
      });
      removeFromCart(product);
      updateTotalPriceAndCartDisplay();
      compareProductWeight();
    });
    

    li.appendChild(deleteButton);
    cartItems.appendChild(li);
  });
}

function calculateAccumulatedWeight() {
  let accumulatedWeight = 0;
  cartProducts.forEach((product) => {
    accumulatedWeight += product.accumulatedWeight;
  });
  return accumulatedWeight;
}


// Function to handle barcode input
function handleBarcodeInput(barcode) {
  if (!barcode) {
    console.log("Barcode value is empty or undefined.");
    return;
  }

  findProductByBarcodeFromGoogleSheets(barcode).then((product) => {
    if (product) {
      currentProduct = product; // Store the currently scanned product
      addToCart(product);
      compareProductWeight(product);
    } else {
      console.log("Product not found for barcode:", barcode);
    }
  });
  compareProductWeight();
}

let previousWeight = 0;
let currentProduct = null; // Define the variable here

// Function to compare the product's weight and display the result
function compareProductWeight(product) {
  
  if (!product || isNaN(product.weight)) {
    console.log("Product weight is undefined or not a number.");
    return;
  }
  
  const currentWeightText = document.getElementById("output").textContent;
  const currentWeight = parseFloat(currentWeightText);

  const accumulatedWeight = calculateAccumulatedWeight();
  
 
  // Calculate the weight difference between current weight and product weight
  const weightDifference = Math.abs(currentWeight - accumulatedWeight);

  const accumulatedWeightElement = document.getElementById("accumulated-Weight");
  const weightComparisonResultElement = document.getElementById("weight-comparison-result");
 

  if (weightDifference <= 10) {
    weightComparisonResultElement.textContent = `${product.name} weight is correct.`;
  } else if (currentWeight > accumulatedWeight) {
    weightComparisonResultElement.textContent = `${product.weight} current weight is greater that accumulated weight.`;
  } else if (currentWeight < accumulatedWeight) {
    weightComparisonResultElement.textContent = `${accumulatedWeight} accumulated weight is greater that current weight.`;
  }
  accumulatedWeightElement.textContent = `Product weight: ${accumulatedWeight.toFixed(2)} lbs`;

  accumulatedWeightElement.classList.remove("hidden");
  weightComparisonResultElement.classList.remove("hidden"); 

  if (accumulatedWeight <= 0){
    accumulatedWeightElement.classList.add("hidden");
    weightComparisonResultElement.classList.add("hidden");
    }
  
  
}

// Monitor for changes in weight display
const weightDisplayElement = document.getElementById("output");
let currentDisplayedWeight = 0;

setInterval(() => {
  const currentWeightText = weightDisplayElement.textContent;
  const currentWeight = parseFloat(currentWeightText);
  
  if (currentWeight !== currentDisplayedWeight) {
    currentDisplayedWeight = currentWeight;

    if (currentProduct) {
      // Trigger weight comparison only if there's a product and weight changed
      compareProductWeight(currentProduct);
    }
  }
}, 100);


const nfcerrortext = document.getElementById("nfcerrortext");

class DeviceNFC {
  constructor() {
    this.reader = null;
  }

  async init() {
    try {
      this.reader = new NDEFReader();
      await this.reader.scan();

      this.reader.onerror = (event) => {
        throw new Error("Cannot read data from the NFC tag. Try another one?");
      };
    } catch (error) {
      throw new Error("Error! Scan failed to start: " + error);
    }
  }

  async waitForNFCScan() {
    try {
      await this.init();
      return new Promise((resolve) => {
        this.reader.onreading = () => {
          resolve(true); // Resolve the promise when NFC scan event occurs
        };
      });
    } catch (error) {
      throw new Error("Error while initializing NFC: " + error);
    }
  }
}

const nfcDevice = new DeviceNFC();

const nfcTestButton = document.getElementById("nfc-test-button");
if (nfcTestButton) {
  nfcTestButton.addEventListener("click", () => {
    nfcerrortext.textContent = 'Scanning NFC card...';
    nfcDevice.waitForNFCScan().then(hasScanned => {
      if (hasScanned) {
        nfcerrortext.textContent = 'NFC card has been scanned successfully!';
      } else {
        nfcerrortext.textContent = 'No NFC card detected.';
      }
    }).catch(error => {
      nfcerrortext.textContent = 'Error while scanning NFC card: ' + error;
    });
  });
}


// Function to update transaction history
function updateTransactionHistory(paymentData, responseData) {
  // Add the transaction to a transaction history section in the UI
  const transactionHistoryElement = document.getElementById("transaction-history");
  const transactionEntry = document.createElement("div");
  transactionEntry.classList.add("transaction-entry");
  
  const transactionInfo = document.createElement("p");
  transactionInfo.textContent = `Amount: ${paymentData.amount}, Transaction ID: ${responseData.transactionId}`;
  
  transactionEntry.appendChild(transactionInfo);
  transactionHistoryElement.appendChild(transactionEntry);
}


// Initialize Google Sheets API
function initGoogleSheetsAPI() {
  gapi.client.init({
    apiKey: 'AIzaSyCU7DGoc9M3LDkccUZeFITDc5jBoGqnkA8', 
    discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
  }).then(() => {
    console.log('Google Sheets API initialized.');

    // Initialize a variable to store the barcode digits
let scannedBarcode = "";

// Event listener to capture barcode input from anywhere on the page
window.addEventListener("keypress", (event) => {
  // Get the pressed key as a character
  const key = String.fromCharCode(event.keyCode || event.which);

  // Check if the key is a valid numeric digit (for barcode purposes)
  if (/^\d+$/.test(key)) {
    // If it is a numeric digit, append it to the scanned barcode
    scannedBarcode += key;
  } else if (event.key === "Enter") {
    // If the Enter key is pressed, handle the scanned barcode
    handleBarcodeInput(scannedBarcode);
    // Reset the scannedBarcode variable for the next barcode scan
    scannedBarcode = "";
  }
});
  }).catch((error) => {
    console.error('Error initializing Google Sheets API:', error);
  });
  
}


//connects arduino with project
const connectButton = document.getElementById("connect-button");
const output = document.getElementById("output");
let port;

connectButton.addEventListener('click', async () => {
  if ('usb' in navigator) {
    // Attempt to access a USB device using WebUSB
    try {
      const usbDevice = await navigator.usb.requestDevice({ filters: [{ vendorId: 0x1A86, productId: 0x7523 }] });
      // Access granted, you can work with the USB device here
      console.log('USB device access granted');
    } catch (error) {
      // USB device access denied or other errors
      console.error('USB device access denied or error:', error);
    }
  } else if ('serial' in navigator) {
    // Access the serial port if WebUSB is not supported
    connectToSerialPort();
  } else {
    console.error('WebUSB and Serial API not supported in this browser.');
  }
});

async function connectToSerialPort() {
  if (!port) {
    try {
      port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      console.log("Serial port connected.");
      startReadingData();
      hideConnectButton();
    } catch (error) {
      console.error("Error connecting to the serial port:", error);
    }
  } else {
    console.log("Serial port is already connected.");
  }
}

async function startReadingData() {
  const reader = port.readable.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const data = new TextDecoder().decode(value);
      output.textContent = data; // Update the output element with the received data
    }
  } catch (error) {
    console.error("Error reading serial data:", error);
  } finally {
    await reader.releaseLock();
    port.close();
    port = null;
    console.log("Serial port closed.");
  }
}


function hideConnectButton() {
  const connectButton = document.getElementById("connect-button");
  connectButton.style.display = "none";
}


// Function to update the output element with received data
function updateOutput(data) {
  const output = document.getElementById("output");
  output.textContent = data;
}



function updateTotalPriceAndCartDisplay() {
  // Calculate the total price
  compareProductWeight(currentProduct);
  const totalPrice = calculateTotalPrice();

  // Update the total price display
  const totalPriceElement = document.getElementById("total-price");
  totalPriceElement.textContent = `Total Price: $${totalPrice.toFixed(2)}`;

  // Update the hidden input field with the total price value
  const hiddenTotalPriceInput = document.getElementById("hidden-total-price");
  hiddenTotalPriceInput.value = totalPrice.toFixed(2);
  // Update the cart display
  updateCartDisplay();

  const totalAmountElement = document.getElementById("total-amount");
  totalAmountElement.textContent = `$${calculateTotalPrice().toFixed(2)}`;
  // Enable the purchase button if the total price is greater than 0
  const purchaseButton = document.getElementById("purchase-button");
  purchaseButton.disabled = totalPrice <= 0;
}

// Function to toggle the payment section visibility
function togglePaymentSection() {
  const paymentSection = document.getElementById("payment-section");
  paymentSection.classList.toggle("hidden");

  // Retrieve the total price from the hidden input field and display it
  const purchaseButton = document.getElementById("purchase-button");
  const totalPriceElement = document.getElementById("total-price");
  purchaseButton.classList.add("hidden");
  totalPriceElement.classList.add("hidden");
  const hiddenTotalPriceInput = document.getElementById("hidden-total-price");
  const totalAmountElement = document.getElementById("total-amount");
  const totalPrice = parseFloat(hiddenTotalPriceInput.value);
  if (totalAmountElement) {
      totalAmountElement.textContent = `$${totalPrice.toFixed(2)}`;
  }
}

// Load Google Sheets API client library and initialize it
gapi.load("client", initGoogleSheetsAPI);