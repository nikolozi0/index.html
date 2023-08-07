// // Google Sheets API settings
// const SPREADSHEET_ID = "15sfxHgPlCvcYxFRwtx9cAjT_k8Y_4Lp48SSYvIxx4Rs"; // Replace with your actual Google Sheets ID
// const API_KEY = "AIzaSyCU7DGoc9M3LDkccUZeFITDc5jBoGqnkA8"; // Replace with your actual API Key

// Google Sheets API settings
const SPREADSHEET_ID = "15sfxHgPlCvcYxFRwtx9cAjT_k8Y_4Lp48SSYvIxx4Rs"; // Replace with your actual Google Sheets ID

// Keep track of the products in the cart with a Map
const cartProducts = new Map();

// Function to find a product by its barcode from Google Sheets data
async function findProductByBarcodeFromGoogleSheets(barcode) {
  try {
    const sheetRange = 'Sheet1!A1:Z1000'; // Update the sheet name and range to include image URLs (Column D)
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetRange,
    });

    const values = response.result.values;
    console.log("Google Sheets API Response:", values); // Log the API response
    if (values && values.length) {
      const product = values.find((row) => row[2] === barcode);
      if (product) {
        const [name, price, _, image] = product;
        return { barcode, name, price: parseFloat(price), image };
      }
    }
    return null; // Barcode not found in the Google Sheets data
  } catch (error) {
    console.error("Error reading products from Google Sheets:", error);
    return null;
  }
}

// ... (Your existing code above)

// Function to remove a product from the cart and update the cart display
// Function to remove a product from the cart and update the cart display
function removeFromCart(product) {
  console.log("Removing product:", product); // Log the product being removed

  if (cartProducts.has(product.barcode)) {
    const cartProduct = cartProducts.get(product.barcode);
    if (cartProduct.quantity > 1) {
      cartProduct.quantity--;
    } else {
      cartProducts.delete(product.barcode);
    }
  }

  // Update the total price and cart display
  updateTotalPriceAndCartDisplay();
}


// Function to add a product to the cart and update the cart display
function addToCart(product) {
  // Check if the product is already in the cart
  if (cartProducts.has(product.barcode)) {
    // If it is, increment the product quantity in the cart
    const cartProduct = cartProducts.get(product.barcode);
    cartProduct.quantity++;
  } else {
    // If it's a new product, add it to the cart with a quantity of 1
    cartProducts.set(product.barcode, { ...product, quantity: 1 });
  }

  // Update the total price and cart display
  updateTotalPriceAndCartDisplay();
}

function calculateTotalPrice() {
  let totalPrice = 0;
  cartProducts.forEach((product) => {
      totalPrice += product.price * product.quantity;
  });
  return totalPrice;
}

// Function to update the total price display on the webpage


// Function to update the cart display
function updateCartDisplay() {
  const cartItems = document.getElementById("cart-items");
  cartItems.innerHTML = ""; // Clear the cart items before updating

  // Loop through the cart products and add them to the cart display
  cartProducts.forEach((product) => {
    const li = document.createElement("li");
    li.textContent = `${product.name} - $${product.price} (Quantity: ${product.quantity})`;

    const imageElement = document.createElement("img");
    imageElement.src = product.image;
    li.appendChild(imageElement);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      // When the delete button is clicked, remove the product from the cart
      cartProducts.delete(product.barcode);
      removeFromCart(product);

      updateCartDisplay(); // Update the cart display after removing the product
    });

    li.appendChild(deleteButton);
    cartItems.appendChild(li);
  });
}




// Function to handle barcode input from the "Barcode to PC" application
function handleBarcodeInput(barcode) {
  console.log("Scanned barcode:", barcode); // Log the barcode value

  // Check if the barcode is empty or undefined
  if (!barcode) {
    console.log("Barcode value is empty or undefined.");
    return;
  }

  findProductByBarcodeFromGoogleSheets(barcode).then((product) => {
    if (product) {
      addToCart(product);
    } else {
      console.log("Product not found for barcode:", barcode);
    }
  });
}

// Define the processPayment function
function processPayment() {
  console.log("Payment processing...");

  // Get references to the payment status and total amount elements
  const paymentStatusElement = document.getElementById("payment-status");
  const totalAmountElement = document.getElementById("total-amount");

  // Update the total amount if needed
  const totalPrice = calculateTotalPrice(); // Calculate the total price
  totalAmountElement.textContent = `$${totalPrice.toFixed(2)}`;
  initiateNFCScanning();

}


// Initialize Google Sheets API
function initGoogleSheetsAPI() {
  gapi.client.init({
    apiKey: 'AIzaSyCU7DGoc9M3LDkccUZeFITDc5jBoGqnkA8', // Replace with your actual API Key
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

function calculateTotalPrice() {
  let totalPrice = 0;
  cartProducts.forEach((product) => {
    totalPrice += product.price * product.quantity;
  });
  return totalPrice;
}


// Function to handle scanned NFC data
function handleScannedNFCData(scannedData) {
  // Assuming scannedData contains relevant information (e.g., payment details)

  // Trigger payment process using bank's API
  processPaymentWithBankAPI(scannedData);
}

function initiateNFCScanning() {
  // Check if NFC API is available
  if ('NDEFReader' in window) {
    const nfcReader = new NDEFReader();
    nfcReader.onreading = async (event) => {
      try {
        const ndefMessage = await nfcReader.read();
        const firstRecord = ndefMessage.records[0];
        const scannedData = new TextDecoder().decode(firstRecord.data);

        // Handle the scanned NFC data (e.g., initiate payment process)
        processPaymentWithNFCData(scannedData);
      } catch (error) {
        console.error('Error reading NFC tag:', error);
        // Display NFC reading error message to the user
        const paymentStatusElement = document.getElementById("payment-status");
        paymentStatusElement.textContent = "Error reading NFC tag";
      }
    };
    nfcReader.scan();
  } else {
    // NFC API not available
    // Display message or provide alternative user experience
    const paymentStatusElement = document.getElementById("payment-status");
    paymentStatusElement.textContent = "NFC not supported";
  }
}




function updateTotalPriceAndCartDisplay() {
  // Calculate the total price
  
  const totalPrice = calculateTotalPrice();

  // Update the total price display
  const totalPriceElement = document.getElementById("total-price");
  totalPriceElement.textContent = `Total Price: $${totalPrice.toFixed(2)}`;

  // Update the hidden input field with the total price value
  const hiddenTotalPriceInput = document.getElementById("hidden-total-price");
  hiddenTotalPriceInput.value = totalPrice.toFixed(2);
  // Update the cart display
  updateCartDisplay();

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
