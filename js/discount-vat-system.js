/**
 * Discount & VAT System for Philippine POS
 * Handles discount types, VAT calculations, and receipt formatting
 */

// Global state for current discount
let currentDiscount = {
    type: 'none',
    rate: 0,
    label: 'No Discount',
    isVatExempt: false
};

/**
 * Select discount type and update UI
 * @param {string} type - Discount type ('none', 'senior', 'pwd')
 * @param {number} rate - Discount percentage (0-100)
 * @param {string} label - Display label
 */
function selectDiscountType(type, rate, label) {
    // Update global state
    currentDiscount.type = type;
    currentDiscount.rate = rate;
    currentDiscount.label = label;

    // Senior Citizen and PWD are VAT-exempt
    currentDiscount.isVatExempt = (type === 'senior' || type === 'pwd');

    // Update button states
    const buttons = document.querySelectorAll('.discount-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        }
    });

    // Recalculate order total
    calculateOrderTotal();

    // Show notification
    if (type !== 'none') {
        showDiscountNotification(label, rate, currentDiscount.isVatExempt);
    }
}

function calculateVatBreakdown(amount, isVatExempt) {
    const VAT_RATE = 0.12;
    const safeAmount = Number(amount) || 0;

    if (safeAmount <= 0) {
        return { vatableAmount: 0, vatExemptAmount: 0, vatAmount: 0 };
    }

    if (isVatExempt) {
        return { vatableAmount: 0, vatExemptAmount: safeAmount, vatAmount: 0 };
    }

    const vatableAmount = safeAmount / (1 + VAT_RATE);
    const vatAmount = safeAmount - vatableAmount;

    return { vatableAmount, vatExemptAmount: 0, vatAmount };
}

/**
 * Calculate order totals with discount and VAT
 */
function calculateOrderTotal() {
    // Get cart items (assuming global cartItems array exists)
    if (typeof cartItems === 'undefined') {
        console.warn('cartItems not found');
        return;
    }

    // Calculate subtotal
    let subtotal = 0;
    cartItems.forEach(item => {
        subtotal += item.price * item.quantity;
    });

    // Calculate discount amount
    const discountAmount = (subtotal * currentDiscount.rate) / 100;
    const afterDiscount = subtotal - discountAmount;

    // VAT breakdown (12% inclusive pricing, exempt for eligible discounts)
    const { vatableAmount, vatExemptAmount, vatAmount } = calculateVatBreakdown(afterDiscount, currentDiscount.isVatExempt);
    const total = afterDiscount;

    // Update UI
    updateOrderSummaryUI(subtotal, discountAmount, vatableAmount, vatExemptAmount, vatAmount, total);
}

/**
 * Update order summary UI elements
 */
function updateOrderSummaryUI(subtotal, discountAmount, vatableAmount, vatExemptAmount, vatAmount, total) {
    // Update subtotal
    document.getElementById('orderSubtotal').textContent = subtotal.toFixed(2);

    // Update discount line
    if (discountAmount > 0) {
        document.getElementById('discountLine').style.display = 'flex';
        document.getElementById('discountLabel').textContent = currentDiscount.label;
        document.getElementById('orderDiscount').textContent = discountAmount.toFixed(2);
    } else {
        document.getElementById('discountLine').style.display = 'none';
    }

    // Update VAT breakdown (now always zero VAT)
    document.getElementById('orderVatableSales').textContent = vatableAmount.toFixed(2);
    document.getElementById('orderVatExempt').textContent = vatExemptAmount.toFixed(2);
    document.getElementById('orderVAT').textContent = vatAmount.toFixed(2);

    // Update total
    document.getElementById('orderTotal').textContent = total.toFixed(2);
}

/**
 * Show discount notification
 */
function showDiscountNotification(label, rate, isVatExempt) {
    const message = `${label} discount applied (${rate}%)${isVatExempt ? ' - VAT EXEMPT' : ''}`;

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'discount-notification';
    notification.innerHTML = `
        <span class="notification-icon">✓</span>
        <span class="notification-text">${message}</span>
    `;

    // Add to body
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Generate receipt with discount and VAT details
 * @param {object} transaction - Transaction data
 */
function updateReceiptDisplay(transaction) {
    const toNumber = (val) => {
        const num = Number(val);
        return Number.isFinite(num) ? num : 0;
    };

    // Rebuild receipt markup to match desired slip format (once)
    const receiptRoot = document.getElementById('receipt');
    if (receiptRoot && !receiptRoot.dataset.customized) {
        receiptRoot.dataset.customized = 'true';
        receiptRoot.innerHTML = `
            <div class="receipt-header">
                <h4>Jowen's Kitchen Cafe</h4>
                <p class="receipt-subtitle">Pantay Cawong, Calaca City</p>
                <p class="receipt-subtitle">09620517657</p>
                <p class="receipt-subtitle">ORDER SLIP</p>
            </div>
            <div class="receipt-divider"></div>
            <p class="receipt-info">Date: <span id="receipt-date"></span></p>
            <p class="receipt-info">Receipt #: <span id="receipt-ordernumber"></span></p>
            <p class="receipt-info">Cashier: <span id="receipt-cashier"></span></p>
            <div class="receipt-divider"></div>
            <div id="receipt-items"></div>
            <div class="receipt-divider"></div>
            <div class="receipt-summary">
                <div class="receipt-line">
                    <span>Subtotal:</span>
                    <span>₱<span id="receipt-subtotal">0.00</span></span>
                </div>
                <div class="receipt-line" id="receipt-discount-line" style="display: none;">
                    <span>Discount (<span id="receipt-discount-label"></span>):</span>
                    <span class="discount-text">-₱<span id="receipt-discount">0.00</span></span>
                </div>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-total-line">
                <span class="receipt-total-label">TOTAL:</span>
                <span class="receipt-total-amount">₱<span id="receipt-total">0.00</span></span>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-payment" id="receipt-payment-section" style="display: none;">
                <div class="receipt-line">
                    <span>Payment:</span>
                    <span id="receipt-payment-method">Cash</span>
                </div>
                <div class="receipt-line">
                    <span>Tendered:</span>
                    <span>₱<span id="receipt-tendered">0.00</span></span>
                </div>
                <div class="receipt-line">
                    <span>Change:</span>
                    <span>₱<span id="receipt-change">0.00</span></span>
                </div>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-footer">
                <p>Thank you for your purchase!</p>
            </div>
        `;
    }

    // Update basic info
    document.getElementById('receipt-date').textContent = new Date(transaction.occurred_at).toLocaleString();
    document.getElementById('receipt-ordernumber').textContent = transaction.reference || 'N/A';
    const cashierEl = document.getElementById('receipt-cashier');
    if (cashierEl) {
        cashierEl.textContent = transaction.cashier || (window.currentUsername || 'Cashier');
    }

    // Update items
    const itemsContainer = document.getElementById('receipt-items');
    itemsContainer.innerHTML = '';
    if (transaction.items && transaction.items.length > 0) {
        transaction.items.forEach(item => {
            const itemLine = document.createElement('div');
            itemLine.className = 'receipt-item-line';
            itemLine.innerHTML = `
                <span class="item-name">${item.product_name}</span>
                <span class="item-qty">₱${parseFloat(item.unit_price).toFixed(2)} × ${item.quantity}</span>
                <span class="item-total">₱${(item.unit_price * item.quantity).toFixed(2)}</span>
            `;
            itemsContainer.appendChild(itemLine);
        });
    }

    // Update totals
    const subtotal = toNumber(transaction.subtotal);
    const discountAmount = toNumber(transaction.discount_amount);
    const discountType = transaction.discount_type;
    const total = toNumber(transaction.total || (subtotal - discountAmount));

    const isVatExempt = transaction.vat_exempt_amount > 0 ||
        transaction.is_vat_exempt === true ||
        (discountType && ['senior', 'pwd'].includes(discountType.toString().toLowerCase()));

    const fallbackVat = calculateVatBreakdown(total, isVatExempt);
    const vatableAmount = toNumber(
        (typeof transaction.vatable_amount !== 'undefined') ? transaction.vatable_amount : fallbackVat.vatableAmount
    );
    const vatExemptAmount = toNumber(
        (typeof transaction.vat_exempt_amount !== 'undefined') ? transaction.vat_exempt_amount : fallbackVat.vatExemptAmount
    );
    const vatAmount = toNumber(
        (typeof transaction.vat_amount !== 'undefined') ? transaction.vat_amount : fallbackVat.vatAmount
    );

    document.getElementById('receipt-subtotal').textContent = subtotal.toFixed(2);

    // Show/hide discount line
    if (discountAmount > 0 && discountType) {
        document.getElementById('receipt-discount-line').style.display = 'flex';
        document.getElementById('receipt-discount-label').textContent = getDiscountLabel(discountType);
        document.getElementById('receipt-discount').textContent = discountAmount.toFixed(2);

        // Show discount type
        document.getElementById('receipt-discount-type-line').style.display = 'block';
        document.getElementById('receipt-discount-type').textContent = getDiscountLabel(discountType).toUpperCase();
    } else {
        document.getElementById('receipt-discount-line').style.display = 'none';
        document.getElementById('receipt-discount-type-line').style.display = 'none';
    }

    // Update VAT breakdown
    const receiptVatBlock = document.querySelector('.receipt-vat-breakdown');
    if (receiptVatBlock) receiptVatBlock.style.display = 'block';
    const receiptVatable = document.getElementById('receipt-vatable');
    const receiptVatExempt = document.getElementById('receipt-vat-exempt');
    const receiptVat = document.getElementById('receipt-vat');
    if (receiptVatable) receiptVatable.textContent = vatableAmount.toFixed(2);
    if (receiptVatExempt) receiptVatExempt.textContent = vatExemptAmount.toFixed(2);
    if (receiptVat) receiptVat.textContent = vatAmount.toFixed(2);

    const totalEl = document.getElementById('receipt-total');
    if (totalEl) totalEl.textContent = total.toFixed(2);

    // Update payment info if available
    if (transaction.payment_method) {
        document.getElementById('receipt-payment-section').style.display = 'block';
        document.getElementById('receipt-payment-method').textContent = transaction.payment_method.charAt(0).toUpperCase() + transaction.payment_method.slice(1);
        document.getElementById('receipt-tendered').textContent = (transaction.amount_tendered || 0).toFixed(2);
        document.getElementById('receipt-change').textContent = (transaction.change_amount || 0).toFixed(2);
    }
}

/**
 * Get discount label from type
 */
function getDiscountLabel(type) {
    const labels = {
        'none': 'No Discount',
        'senior': 'Senior Citizen',
        'pwd': 'PWD'
    };
    return labels[type] || type;
}

/**
 * Prepare transaction data for API submission
 * @param {array} items - Cart items
 * @param {object} paymentInfo - Payment details
 * @returns {object} Transaction data
 */
function prepareTransactionData(items, paymentInfo) {
    // Calculate totals
    let subtotal = 0;
    items.forEach(item => {
        subtotal += item.price * item.quantity;
    });

    const discountAmount = (subtotal * currentDiscount.rate) / 100;
    const afterDiscount = subtotal - discountAmount;

    const { vatableAmount, vatExemptAmount, vatAmount } = calculateVatBreakdown(afterDiscount, currentDiscount.isVatExempt);

    return {
        subtotal: subtotal,
        discount_type: currentDiscount.type,
        discount_amount: discountAmount,
        tax_amount: vatAmount, // For backward compatibility
        vatable_amount: vatableAmount,
        vat_exempt_amount: vatExemptAmount,
        vat_amount: vatAmount,
        total: afterDiscount,
        payment_method: paymentInfo.method || 'cash',
        amount_tendered: paymentInfo.tendered || 0,
        change_amount: paymentInfo.change || 0,
        items: items.map(item => ({
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price
        }))
    };
}

/**
 * Reset discount to default (no discount)
 */
function resetDiscount() {
    selectDiscountType('none', 0, 'No Discount');
}

// Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        selectDiscountType,
        calculateOrderTotal,
        updateReceiptDisplay,
        prepareTransactionData,
        resetDiscount,
        currentDiscount
    };
}
