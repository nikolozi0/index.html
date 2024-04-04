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
    const li = document.createElement("li");
   const imageElement = document.createElement("img");
    imageElement.src = product.image;
    li.appendChild(imageElement);


    const nameElement = document.createElement("p")
    nameElement.textContent = `${product.name}${translations[selectedLanguage].priceName}${product.price}`;
    nameElement.classList.add("price_name");
    li.appendChild(nameElement);
    

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
      addToCart(product);
      retrieveCurrentWeight().then((currentWeight) => {
        compareProductWeight(currentWeight);
      });
    } else {
      console.log("Product not found for barcode:", barcode);
    }
  });
}

function retrieveCurrentWeight() {
  return new Promise((resolve) => {
    // Simulate an asynchronous operation (replace with actual async code)
    setTimeout(() => {
      const currentWeight = 100; // Replace with the actual weight retrieval logic
      resolve(currentWeight);
    }, 1000); // Simulate a 1-second delay
  });
}

let previousWeight = 0;
let currentWeight = 0; // Define the variable here

// Function to compare the product's weight and display the result
function compareProductWeight() {
  
  const currentWeightText = document.getElementById("output").textContent;
  const currentWeight = parseFloat(currentWeightText);


  const accumulatedWeight = calculateAccumulatedWeight();
  const weightDifference = Math.abs(currentWeight - accumulatedWeight);

  const accumulatedWeightElement = document.getElementById("accumulated-Weight");
  const weightComparisonResultElement = document.getElementById("weight-comparison-result");
  const selectedLanguage = document.getElementById("language-select").value;

 

  if (weightDifference <= 10) {
    weightComparisonResultElement.textContent = `Weight matches within tolerance.`;
  } else {
    weightComparisonResultElement.textContent = `Weight discrepancy detected: ${weightDifference} units.`;
  }

  // Update UI elements as necessary
  accumulatedWeightElement.textContent = `${translations[selectedLanguage].accumulatedWeight}${accumulatedWeight.toFixed(2)} units`;

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

    if (currentWeight) {
      // Trigger weight comparison only if there's a product and weight changed
      compareProductWeight(currentWeight);
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
          resolve(true); // Resolve the promise when NFC scan event occurs
        };
      });
    } catch (error) {
      throw new Error("Error while initializing NFC: " + error);
    }
  }
}

const nfcDevice = {
  watchEnabled: false,
  connect: async function() {
    if (!('NDEFReader' in window)) {
      nfcerrortext.textContent = 'Web NFC API is not supported in this browser.';
      return;
    }

    try {
      const ndef = new NDEFReader();
      await ndef.scan();

      ndef.addEventListener('reading', () => {
        nfcerrortext.textContent = 'Scanning NFC tag...';
      });

      ndef.addEventListener('readingerror', (event) => {
        nfcerrortext.textContent = `Error while scanning NFC tag: ${event.error}`;
      });

      ndef.addEventListener('reading', (event) => {
        const message = nfcDecoder(event.message);
        nfcerrortext.textContent = `NFC tag read: ${message}`;
      });
    } catch (error) {
      nfcerrortext.textContent = `Error connecting to NFC device: ${error}`;
    }
  },
};

function nfcDecoder(message) {
  // Implement your logic to decode the NFC message here
  // Return the decoded message as a string
  return message.data.map((record) =>
    String.fromCharCode.apply(null, record.data)
  ).join('');
}

const nfcTestButton = document.getElementById('nfc-test-button');
if (nfcTestButton) {
  nfcTestButton.addEventListener('click', () => {
    nfcDevice.connect();
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

// Declare the variables for the device and the port
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
    port = await navigator.serial.requestPort(); // Removed 'const' to update the global 'port'
    await port.open({ baudRate: 9600 }); // Adjust baudRate as needed.
    
    console.log('Connected using Web Serial API.');
    hideConnectButton()
    startReadingData(); // Start reading data after successful connection
    return true; // Connection successful.
    hideConnectButton()
  } catch (error) {
    console.error('Failed to connect with Web Serial API:', error);
    return false; // Connection failed.
  }
}

async function connectWithWebUSB() {
  if (!('usb' in navigator)) {
    console.log('WebUSB API not supported in this browser.');
    return false; // WebUSB API not supported.
  }

  try {
    const device = await navigator.usb.requestDevice({ filters: [{ vendorId: 0x1A86 }] });
    await device.open();
    await device.selectConfiguration(1); // The configuration value might be different for your device.
    await device.claimInterface(0); // The interface number might be different for your device.
    console.log('Connected using WebUSB API.');
    port = device; // Assuming 'port' should be assigned the device for consistency
    hideConnectButton()
    startReadingData(); // Start reading data after successful connection
    return true; // Connection successful.
  } catch (error) {
    console.error('Failed to connect with WebUSB API:', error);
    return false; // Connection failed.
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

function updateWeightDisplay(weight) {
  const weightDisplayElement = document.getElementById("output");
  const selectedLanguage = document.getElementById("language-select").value;

  if (weightDisplayElement) {
    weightDisplayElement.textContent = `${translations[selectedLanguage].weight}${weight} grams`;
  }
}

// Call connect() when the "Connect" button is clicked
connectButton.addEventListener("click", connect);

function hideConnectButton() {
  const connectButton = document.getElementById("connect-button");
  connectButton.style.display = "none";
}

function updateTotalPriceAndCartDisplay() {
  // Calculate the total price
  const totalPrice = calculateTotalPrice();
  const selectedLanguage = document.getElementById("language-select").value;


  // Update the total price display
  const totalPriceElement = document.getElementById("total-price");
  totalPriceElement.textContent = `${translations[selectedLanguage].totalPrice}${totalPrice.toFixed(2)}`;

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

    // Update the text content of all delete buttons
    deleteButtons.forEach(button => {
      button.textContent = translations[selectedLanguage].deleteButton;
    });
  }
}

// Call this function whenever the language selection changes
document.getElementById("language-select").addEventListener("change", changeLanguage);
// Load Google Sheets API client library and initialize it
gapi.load("client", initGoogleSheetsAPI);
