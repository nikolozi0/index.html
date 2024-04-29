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
    console.log("Google Sheets API Response:", values); 

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
    return null; 
  } catch (error) {
    console.error("Error reading products from Google Sheets:", error);
    return null;
  }
}

// Function to remove a product from the cart and update the cart display
function removeFromCart(product) {
  if (cartProducts.has(product.barcode)) {
    const removedProduct = cartProducts.get(product.barcode);
    cartProducts.delete(product.barcode);
    const weightDifference = removedProduct.accumulatedWeight;
    updateTotalPriceAndCartDisplay();
    updateCartDisplay();
    const newAccumulatedWeight = calculateAccumulatedWeight();
    compareProductWeight(newAccumulatedWeight);
  }
}

// Function to add a product to the cart and update the cart display
function addToCart(product) {
  const newProduct = { ...product, quantity: 1, accumulatedWeight: product.weight ? product.weight : 0 };
  cartProducts.set(product.barcode + '_' + Date.now(), newProduct); // Append a unique identifier to treat each addition as a new product
  
  updateTotalPriceAndCartDisplay();
  updateCartDisplay();
  compareProductWeight();
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
  const selectedLanguage = document.getElementById("language-select").value;


  cartProducts.forEach((product) => {
   const outerDiv = document.createElement("div");
   outerDiv.classList.add("outerDiv");

   const poductImage = document.createElement("img");
   poductImage.classList.add("poductImage");
   poductImage.src = product.image;
   outerDiv.appendChild(poductImage);


    const nameElement = document.createElement("p");
    nameElement.textContent = `${product.name}`;
    nameElement.classList.add("price_name");
    outerDiv.appendChild(nameElement);

    const spanDiv = document.createElement("div");
    spanDiv.classList.add("spanDiv");
    outerDiv.appendChild(spanDiv);

    const spanName = document.createElement("span");
    spanName.classList.add("spanName");
    if (product.weight >= 1) {
      spanName.textContent = `${product.weight} kg`;
    } else {
      spanName.textContent = `${product.weight} g`;
    }
    spanDiv.appendChild(spanName);

    const divUnification = document.createElement("div");
    divUnification.classList.add("divUnification");
    outerDiv.appendChild(divUnification);

    const priceDiv = document.createElement("div");
    priceDiv.classList.add("priceDiv");
    divUnification.appendChild(priceDiv);

    const spanPrice = document.createElement("span");
    spanPrice.classList.add("spanPrice");
    spanPrice.textContent = `${product.price.toFixed(2)} ₾`;
    priceDiv.appendChild(spanPrice);


    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete_button");
    deleteButton.textContent = translations[selectedLanguage].deleteButton;
    deleteButton.addEventListener("click", () => {
      cartProducts.forEach((value, key) => {
        if (value === product) {
          cartProducts.delete(key);
        }
      });
    

      removeFromCart(product);
      updateTotalPriceAndCartDisplay();
      updateCartDisplay();
      compareProductWeight();
    });

    divUnification.appendChild(deleteButton);
    cartItems.appendChild(outerDiv);
    
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
      addToCart(product);
      retrieveCurrentWeight().then((currentWeight) => {
        compareProductWeight(currentWeight);
      });
    } else {
      console.log("Product not found for barcode:", barcode);
    }
  });
}

let previousWeight = 0;
let currentWeight = 0; 

// Function to compare the product's weight and display the result
function compareProductWeight() {
  const weightDisplayElement = document.getElementById("output");
  const currentWeightText = weightDisplayElement ? weightDisplayElement.textContent : "";
  let currentWeight;

  // Check if currentWeightText is a valid number
  if (!isNaN(parseFloat(currentWeightText))) {
    currentWeight = parseFloat(currentWeightText);
  } else {
    console.log("Invalid weight data received:", currentWeightText);
    return; 
  }

  const accumulatedWeight = calculateAccumulatedWeight();
  const weightDifference = Math.abs(currentWeight - accumulatedWeight);
  const roundedWeightDifference = weightDifference.toFixed(3);


  console.log("Current Weight:", currentWeight);
  console.log("Accumulated Weight:", accumulatedWeight);
  console.log("Weight Difference:", weightDifference);

  const accumulatedWeightElement = document.getElementById("accumulated-Weight");
  const weightComparisonResultElement = document.getElementById("weight-comparison-result");
  const selectedLanguage = document.getElementById("language-select").value;

  if (weightDifference <= 0.1) {
    weightComparisonResultElement.textContent = `Weight matches within tolerance.`;
  } else {
    weightComparisonResultElement.textContent = `Weight weightdifference detected: ${roundedWeightDifference} units.`;
  }

  accumulatedWeightElement.textContent = `${translations[selectedLanguage].accumulatedWeight}${accumulatedWeight.toFixed(3)} units`;

  accumulatedWeightElement.classList.remove("hidden");
  weightComparisonResultElement.classList.remove("hidden");

  if (accumulatedWeight <= 0) {
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

    if (currentWeight) {
      // Trigger weight comparison only if there's a product and weight changed
      compareProductWeight(currentWeight);
    }
  }
}, 100);


const nfcerrortext = document.getElementById("nfcerrortext");

async function connectNFC() {
  try {
    await nfcDevice.connect();
    console.log('NFC device connected');
    nfcDevice.startNFCScanning();
  } catch (error) {
    console.error('Error connecting to NFC device:', error);
  }
}

class DeviceNFC {
  constructor() {
    this.reader = null;
  }

  async init() {
    try {
      if (!("NDEFReader" in window)) {
        throw new Error("NFC is not supported by this browser.");
      }
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
          resolve(true); 
        };
      });
    } catch (error) {
      throw new Error("Error while initializing NFC: " + error);
    }
  }
}

const nfcDevice = {
  serialPort: null,
  reader: null,
  writer: null,
  isConnected: false, // Add a flag to track the connection state
  connect: async function () {
    if (this.isConnected) {
      // Serial port is already connected, start NFC scanning
      this.startNFCScanning();
      return;
    }

    try {
      // Request access to the serial port
      const port = await navigator.serial.requestPort();

      await port.open({ baudRate: 115200 });

      this.serialPort = port;
      this.reader = port.readable.getReader();
      this.writer = port.writable.getWriter();
      this.isConnected = true; // Set the connection flag to true

      console.log('Serial port opened');

      // Handle incoming data from the serial port
      this.reader.read().then(this.processData.bind(this));

      // Handle errors
      port.ondisconnect = () => {
        console.log('Serial port disconnected');
        this.isConnected = false; // Reset the connection flag
      };
      port.onerror = (error) => {
        console.error('Serial port error:', error);
        nfcerrortext.textContent = `Error: ${error}`;
      };

      // Start scanning for NFC tags after serial port connection
      this.startNFCScanning();
    } catch (error) {
      console.error('Error connecting to serial port:', error);
      nfcerrortext.textContent = `Error: ${error}`;
    }
  },
  processData: function ({ done, value }) {
    if (done) {
      console.log('Serial port disconnected');
      return;
    }

    const message = new TextDecoder().decode(value);
    if (message.includes('noTag')) {
      nfcerrortext.textContent = 'No NFC tag detected.';
    } else if (message.includes('System initialized')) {
      console.log('System initialized');
    } else {
      nfcerrortext.textContent = `დამორჩილებულ არს`;
    }
    //NFC tag ID: ${message}
    this.reader.read().then(this.processData.bind(this));
  },
  startNFCScanning: function () {
    if (!this.serialPort || !this.writer) {
      nfcerrortext.textContent = 'Serial port not connected.';
      return;
    }

    const data = new TextEncoder().encode('scanNFC\n');
    this.writer.write(data);

    // Wait for the NFC scan event
    this.reader.onreading = () => {
      console.log('NFC tag scanned');
     
      // Continue scanning for NFC tags
      this.startNFCScanning();
    };
  },
};

const nfcTestButton = document.getElementById('nfc-test-button'); 
const paymentButton = document.getElementById('payment-button');
if (nfcTestButton || paymentButton) {
  nfcTestButton.addEventListener('click', () => {
    nfcerrortext.textContent = 'Scanning NFC tag...';
    nfcDevice.connect();
    nfcDevice.waitForNFCScan();
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

let scannedBarcode = "";

window.addEventListener("keypress", (event) => {
  const key = String.fromCharCode(event.keyCode || event.which);

  if (/^\d+$/.test(key)) {
    scannedBarcode += key;
  } else if (event.key === "Enter") {
    handleBarcodeInput(scannedBarcode);
    scannedBarcode = "";
  }
});
  }).catch((error) => {
    console.error('Error initializing Google Sheets API:', error);
  });
  
}



// Get the elements from the HTML document
const connectButton = document.getElementById("connect-button");
const output = document.getElementById("output");

let port;

async function connect() {
  const serialConnected = await connectWithWebSerial();
  if (!serialConnected) {
    console.log('Attempting to connect using WebUSB API...');
    const usbConnected = await connectWithWebUSB();
    if (!usbConnected) {
      console.log('Failed to connect using both Web Serial and WebUSB APIs.');
    }
  }

}

async function connectWithWebSerial() {
  if (!('serial' in navigator)) {
    console.log('Web Serial API not supported in this browser.');
    return false; // Web Serial API not supported.
  }

  try {
    port = await navigator.serial.requestPort(); 
    await port.open({ baudRate: 9600 }); 
    
    console.log('Connected using Web Serial API.');
    hideConnectButton()
    startReadingData(); 
    return true; 
  } catch (error) {
    console.error('Failed to connect with Web Serial API:', error);
    return false; 
  }
}

async function connectWithWebUSB() {
  if (!('usb' in navigator)) {
    console.log('WebUSB API not supported in this browser.');
    return false; 
  }

  try {
    const device = await navigator.usb.requestDevice({ filters: [{ vendorId: 0x1A86 }] });
    await device.open();
    await device.selectConfiguration(1); 
    await device.claimInterface(0); 
    console.log('Connected using WebUSB API.');
    port = device; 
    hideConnectButton()
    startReadingData(); 
    return true; 
  } catch (error) {
    console.error('Failed to connect with WebUSB API:', error);
    return false; 
  }
}

async function startReadingData() {
  if (!port) {
    console.log("Serial port is not opened.");
    return;
  }

  const textDecoder = new TextDecoderStream();
  port.readable.pipeTo(textDecoder.writable);
  const reader = textDecoder.readable.getReader();

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.log("Stream closed or reader canceled.");
        break;
      }
      updateWeightDisplay(value.trim()); // Update the weight display with the new value
    }
  } catch (error) {
    console.error('Error during data reading:', error);
  } finally {
    reader.releaseLock();
  }
}

function updateWeightDisplay(data) {
  const weightDisplayElement = document.getElementById("output");
  const selectedLanguage = document.getElementById("language-select").value;

  if (weightDisplayElement) {
    // Remove non-printable and special characters from the data
    const cleanedData = data.replace(/[^\x20-\x7E]/g, '');

    const weight = parseFloat(cleanedData);
    if (!isNaN(weight)) {
      weightDisplayElement.textContent = `${translations[selectedLanguage].weight}${weight} grams`;
    } else {
      console.log("Invalid weight data received:", data);
    }
  }
}

//Handle the case where the received data is not a valid number
function updateWeightDisplay(data) {
  const weightDisplayElement = document.getElementById("output");

  if (weightDisplayElement) {
    const weight = parseFloat(data);
    if (!isNaN(weight)) {
      weightDisplayElement.textContent = `${weight} grams`;
    } else {
      console.log("Invalid weight data received:", data);
      
    }
  }
}

// Call connect() when the "Connect" button is clicked
connectButton.addEventListener("click", connect);

function hideConnectButton() {
  const connectButton = document.getElementById("connect-button");
  connectButton.style.display = "none";
}

function updateTotalPriceAndCartDisplay() {
  const totalPrice = calculateTotalPrice();
  const selectedLanguage = document.getElementById("language-select").value;


  // Update the total price display
  const totalPriceElement = document.getElementById("total-price");
  totalPriceElement.textContent = `${translations[selectedLanguage].totalPrice}${totalPrice.toFixed(2)}`;

  // Update the hidden input field with the total price value
  const hiddenTotalPriceInput = document.getElementById("hidden-total-price");
  hiddenTotalPriceInput.value = totalPrice.toFixed(2);
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


const translations = {
  en: {
    headerTitle: "Smart Cart Software",
    totalPrice: "Total Price: ₾",
    totalAmount: "Total Amount: ₾",
    purchaseButton: "Purchase",
    paymentSection: "Payment Section",
    transactionHistory: "Transaction History",
    transactionEntry: "Amount: , Transaction ID: ",
    accumulatedWeight: "Accumulated weight: ",
    nfcErrorText: "Scanning NFC card...",
    nfcSuccessText: "NFC card has been scanned successfully!",
    nfcFailureText: "No NFC card detected.",
    deleteButton: "Delete",
    connectButton: "connect to arduino",
    priceName: " - ₾"
  },
  ka: {
    headerTitle: "ჭკვიანი ურიკა",
    totalPrice: "სრული ფასი: ₾",
    totalAmount: "სრული თანხა: ₾",
    purchaseButton: "შეძენა",
    paymentSection: "გადახდის სექცია",
    transactionHistory: "ტრანზაქციების ისტორია",
    transactionEntry: "თანხა: , ტრანზაქციის ID: ",
    connectButton: "სასწორთან დაკავშირება",
    nfcErrorText: "მიმდინარეობს NFC ბარათის სკანირება...",
    nfcSuccessText: "NFC ბარათი წარმატებით იქნა სკანირებული!",
    accumulatedWeight: "დაგროვილი წონა: ",
    nfcFailureText: "NFC ბარათი არ იქნა აღმოჩენილი.",
    deleteButton: "წაშლა",
    priceName: " - ₾"
  }
};

function changeLanguage() {
  const selectedLanguage = document.getElementById("language-select").value;
  const headerTitle = document.querySelector("header h1");
  const totalPriceElement = document.getElementById("total-price");
  const totalAmountElement = document.getElementById("total-amount");
  const purchaseButton = document.getElementById("purchase-button");
  const paymentSection = document.getElementById("payment-section");
  const transactionHistoryElement = document.getElementById("transaction-history");
  const nfcErrorText = document.getElementById("nfcerrortext");
  const deleteButtons = document.querySelectorAll(".delete_button");
  const connectButton = document.getElementById("connect-button");


  if (headerTitle && translations[selectedLanguage]) {
    headerTitle.textContent = translations[selectedLanguage].headerTitle;
    totalPriceElement.textContent = `${translations[selectedLanguage].totalPrice}`;
    totalAmountElement.textContent = `${translations[selectedLanguage].totalAmount}`;
    purchaseButton.textContent = translations[selectedLanguage].purchaseButton;
    paymentSection.textContent = translations[selectedLanguage].paymentSection;
    transactionHistoryElement.textContent = translations[selectedLanguage].transactionHistory;
    nfcErrorText.textContent = translations[selectedLanguage].nfcErrorText;
    connectButton.textContent = translations[selectedLanguage].connectButton;

    deleteButtons.forEach(button => {
      button.textContent = translations[selectedLanguage].deleteButton;
    });
  }
}

document.getElementById("language-select").addEventListener("change", changeLanguage);

gapi.load("client", initGoogleSheetsAPI);
