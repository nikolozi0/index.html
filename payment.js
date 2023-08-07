
// payment.js

// ... (Your existing payment logic)

// Define the processPayment function
function processPayment() {
    const totalAmountElement = document.getElementById("total-amount");
    console.log("Total Amount Element:", totalAmountElement);

    const paymentStatusElement = document.getElementById("payment-status");
    if (paymentStatusElement) {
      paymentStatusElement.textContent = "Payment Processing...";
  
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
            paymentStatusElement.textContent = "Error reading NFC tag";
          }
        };
        nfcReader.scan();
      } else {
        // NFC API not available
        // Display message or provide alternative user experience
        paymentStatusElement.textContent = "NFC not supported";
      }
    }
  }
  
  // Call the function to display the total amount when the payment page is loaded
  displayTotalAmount();
  
  // Attach the function to the button's click event
  const purchaseButton = document.querySelector(".payment-button");
  if (purchaseButton) {
    purchaseButton.addEventListener("click", processPayment);
  }
  
  // Function to process payment using NFC data
  function processPaymentWithNFCData(nfcData) {
    // Assuming nfcData contains relevant information (e.g., payment details)
    
    // Trigger payment process using bank's API
    processPaymentWithBankAPI(nfcData);
  }
  