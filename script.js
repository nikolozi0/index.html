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

    updateAccumulatedWeight(-weightDifference);
    updateTotalPriceAndCartDisplay();
    updateCartDisplay();
    const newAccumulatedWeight = calculateAccumulatedWeight();
    compareProductWeight(newAccumulatedWeight);
  }
}

function updateAccumulatedWeight(weightChange) {
  let accumulatedWeight = calculateAccumulatedWeight();
  accumulatedWeight += weightChange; // Add or subtract weight change
}

// Function to add a product to the cart and update the cart display
function addToCart(product) {
  const newProduct = { ...product, quantity: 1, accumulatedWeight: product.weight ? product.weight : 0 };
  cartProducts.set(product.barcode + '_' + Date.now(), newProduct); 

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

  if (purchaseButtonClicked) {
    console.log("Cannot add new products after clicking the Purchase button.");
    return;
  }

  findProductByBarcodeFromGoogleSheets(barcode).then((product) => {
    if (product) {
      addToCart(product);
     
      // compareProductWeight(currentWeight);
      
    } else {
      console.log("Product not found for barcode:", barcode);
    }
  });
}

let currentWeight = 0; 


// Function to compare the product's weight and display the result
function compareProductWeight() {
  const weightDisplayElement = document.getElementById("output");
  const currentWeightText = weightDisplayElement ? weightDisplayElement.textContent : "";
  let currentWeight;
  let isWeightToleranceValid = false;

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

  weightDisplayElement.textContent = currentWeight.toFixed(2);

  console.log("Current Weight:", currentWeight);
  console.log("Accumulated Weight:", accumulatedWeight);
  console.log("Weight Difference:", weightDifference);

  const accumulatedWeightElement = document.getElementById("accumulated-Weight");
  const weightComparisonResultElement = document.getElementById("weight-comparison-result");
  const selectedLanguage = document.getElementById("language-select").value;
  const purchaseButton = document.getElementById("purchase-button");

  

  if (cartProducts.size > 0) {
    if (weightDifference <= 0.020) {
      weightComparisonResultElement.textContent = `Weight matches within tolerance.`;
      weightComparisonResultElement.style.color = 'green'; // Set text color to green
      purchaseButton.disabled = false; // Enable the purchase button
      weightComparisonResultElement.classList.remove("hidden");
      isWeightToleranceValid = true; // Set the weight tolerance as valid
    } else {
      weightComparisonResultElement.textContent = `Weight weightdifference detected: ${roundedWeightDifference} g.`;
      weightComparisonResultElement.style.color = 'red'; // Set text color to red
      purchaseButton.disabled = true; // Disable the purchase button
      weightComparisonResultElement.classList.remove("hidden");
      isWeightToleranceValid = false; // Set the weight tolerance as invalid
    }
  } else {
    weightComparisonResultElement.classList.add("hidden");
    // purchaseButton.disabled = true;
    isWeightToleranceValid = false; // Set the weight tolerance as invalid when the cart is empty
  }

  // accumulatedWeightElement.textContent = `${translations[selectedLanguage].accumulatedWeight}${accumulatedWeight.toFixed(3)} units`;

  // if (!purchaseButtonClicked) {
  //   // accumulatedWeightElement.classList.remove("hidden");
  //   weightComparisonResultElement.classList.remove("hidden");
  // }

  if (accumulatedWeight < 0) {
    // accumulatedWeightElement.classList.add("hidden");
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
}, 0);





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


// const nfcerrortext = document.getElementById("nfcerrortext");
const output = document.getElementById("output");
const paymentStatus = document.getElementById("payment-status");
let device, server, isConnected = false, nfcTestActive = false;

async function handleData(service) {
  const characteristic = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
  await characteristic.startNotifications();

  characteristic.addEventListener('characteristicvaluechanged', (event) => {
    const value = event.target.value;
    const decoder = new TextDecoder('utf-8');
    const decodedValue = decoder.decode(value);

    
      const weightValue = parseFloat(decodedValue);
      if (!isNaN(weightValue)) {
        output.textContent = `${weightValue.toFixed(4)}`;
      } else {
        console.log("Invalid weight data received:", decodedValue);
      }
    if (decodedValue.startsWith('NFC:')) {
      paymentStatus.textContent = 'Payment successful';
      console.log('Payment successful');
      const otherElements = document.querySelectorAll("#payment-section > :not(#payment-status)");
      otherElements.forEach(element => {
        element.style.display = "none";
      });
      setTimeout(() => {
        location.reload();
      }, 2000);
    } else {
      const weightValue = parseFloat(decodedValue);
      if (!isNaN(weightValue)) {
        output.textContent = `${weightValue.toFixed(4)}`;
      } else {
        console.log("Invalid weight data received:", decodedValue);
      }
    }
  });
}

async function connectBluetoothAndNFC() {
  if (!('bluetooth' in navigator)) {
    console.error('Web Bluetooth API not supported in this browser.');
    return;
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['0000ffe0-0000-1000-8000-00805f9b34fb'] }]
    });

    console.log('Bluetooth device connected:', device.name);

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
    await handleData(service);

    device.addEventListener('gattserverdisconnected', () => {
      console.log('Bluetooth device disconnected');
      isConnected = false;
      const connectButton = document.getElementById("connect-button");
      connectButton.style.display = "block";
    });

    const connectButton = document.getElementById("connect-button");
    connectButton.style.display = "none"; 
    isConnected = true;
  } catch (error) {
    console.error('Error connecting to Bluetooth device:', error);
  }
}

const connectButton = document.getElementById("connect-button");
connectButton.addEventListener("click", async () => {
  connectButton.disabled = true;
  await connectBluetoothAndNFC();
  connectButton.style.display = "none";
});

const paymentOptions = document.querySelectorAll(".payment-option");

paymentOptions.forEach((option) => {
  option.addEventListener("click", () => {
    if (isConnected && !nfcTestActive) {
      nfcScanActive = true;
      nfcTestActive = true;
      paymentStatus.textContent += 'Processing payment...\n';
      console.log('Payment process activated');

      // Reset nfcScanActive flag after 10 seconds
      setTimeout(() => {
        nfcScanActive = false;
      }, 10000);
    } else {
      console.log('Bluetooth device is not connected or NFC scan is already active.');
    }
  });
});

// const nfcTestButton = document.getElementById('nfc-test-button');
// nfcTestButton.addEventListener('click', () => {
//   if (isConnected) {
//     nfcTestActive = true;
//     nfcerrortext.textContent += 'Scanning NFC tag...\n';
//     console.log('NFC test activated');
//   } else {
//     console.log('Bluetooth device is not connected.');
//   }
// });

// const paymentButton = document.getElementById("payment-button");
// paymentButton.addEventListener("click", () => {
//   if (isConnected) {
//     nfcTestActive = true;
//     paymentStatus.textContent += 'Processing payment...\n';
//     console.log('Payment process activated');
//   } else {
//     console.log('Bluetooth device is not connected.');
//   }
// });



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

let purchaseButtonClicked = false;

const purchaseButton = document.getElementById("purchase-button");
purchaseButton.addEventListener("click", () => {
  togglePaymentSection();
  purchaseButtonClicked = true; // Set the flag to true when the purchase button is clicked
});

// Function to toggle the payment section visibility
function togglePaymentSection() {
  const paymentSection = document.getElementById("payment-section");
  const cartDiv = document.querySelector(".cart");
  const accumulatedWeightElement = document.getElementById("accumulated-Weight");
  const weightComparisonResultElement = document.getElementById("weight-comparison-result");

 
      accumulatedWeightElement.classList.add("hidden");
      weightComparisonResultElement.classList.add("hidden");
      paymentSection.classList.remove("hidden");

      // Create a back button
      const backButton = document.getElementById("back_b");

      backButton.addEventListener("click", undoTogglePaymentSection);
  

  purchaseButtonClicked = true; // Set the flag to true when the purchase button is clicked
}

function undoTogglePaymentSection() {
  const paymentSection = document.getElementById("payment-section");
  const cartDiv = document.querySelector(".cart");
  const accumulatedWeightElement = document.getElementById("accumulated-Weight");
  const weightComparisonResultElement = document.getElementById("weight-comparison-result");

 
      // Remove the payment section from the cart div
      accumulatedWeightElement.classList.remove("hidden");
      weightComparisonResultElement.classList.remove("hidden");
      paymentSection.classList.add("hidden");

    
  

  purchaseButtonClicked = false; 
}

  
// const backButton = document.querySelector("#payment-section");
// const paymentSection = document.getElementById("payment-section");
// const weightComparisonResultElement = document.getElementById("weight-comparison-result");
// const accumulatedWeightElement = document.getElementById("accumulated-Weight");
// const cartSection = document.querySelector(".cart");

// backButton.addEventListener("click", () => {
//     paymentSection.classList.add("hidden");
//     cartSection.classList.remove("hidden");
//     weightComparisonResultElement.classList.remove("hidden");
//     accumulatedWeightElement.classList.remove("hidden");

    
//     paymentStatus.textContent = ""; // Clear the payment status
//     purchaseButton.disabled = false; // Re-enable the "Purchase" button

//     // Add any other logic or UI updates needed for the cart view
// });



// let purchaseButtonClicked = false;
// const purchaseButton = document.getElementById("purchase-button");
// purchaseButton.addEventListener("click", () => {
//   const accumulatedWeightElement = document.getElementById("accumulated-Weight");
//   // const weightComparisonResultElement = documentgetElementById("weight-comparison-result");

//   accumulatedWeightElement.classList.add("hidden");
//   // weightComparisonResultElement.classList.add("hidden");

//   // Check if there are items in the cart using product barcodes as keys
//   const hasItemsInCart = Object.keys(cartProducts).size > 0; // Assuming cartProducts is a Map

//   // const isWeightToleranceValid = !weightComparisonResultElement.classList.contains('hidden');

//   if (!hasItemsInCart && isWeightToleranceValid) {
//     togglePaymentSection();
//   } else {
//     console.log("Cart is empty or weight tolerance is incorrect.");
//   }

//   purchaseButtonClicked = true; // Set the flag to true when the purchase button is clicked
// });

const translations = {
  en: {
    headerTitle: "CartWell",
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
    headerTitle: "ქართველი",
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

