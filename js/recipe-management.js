/**
 * Recipe Management JavaScript
 * Handles adding ingredients to products, cost calculation, and profitability display
 */

// Global array to store ingredients being added to the current product
// Use window object to ensure it's truly global
if (typeof window.productIngredients === 'undefined') {
    window.productIngredients = [];
}
// Create a local reference for convenience
var productIngredients = window.productIngredients;

/**
 * Initialize the ingredient select dropdown when menu form is opened
 */
function initializeIngredientSelect() {
    const select = document.getElementById('ingredientSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- Select Ingredient --</option>';

    inventory.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.item} (${item.qty} ${item.unit} available)`;
        option.dataset.unit = item.unit;
        option.dataset.cost = item.costPerUnit || 0;
        select.appendChild(option);
    });
}

/**
 * Add ingredient to the product being created
 */
function addIngredientToProduct() {
    const ingredientSelect = document.getElementById('ingredientSelect');
    const quantityInput = document.getElementById('ingredientQuantity');
    const unitInput = document.getElementById('ingredientUnit');
    const costInput = document.getElementById('ingredientCost');

    const inventoryItemId = parseInt(ingredientSelect.value);
    const quantity = parseFloat(quantityInput.value);
    const unit = unitInput.value.trim();
    const costPerUnit = parseFloat(costInput.value);

    if (!inventoryItemId || !quantity || !unit || isNaN(costPerUnit)) {
        alert('Please fill in all ingredient fields');
        return;
    }

    // Get ingredient name
    const selectedOption = ingredientSelect.options[ingredientSelect.selectedIndex];
    const ingredientName = selectedOption.textContent.split('(')[0].trim();

    // Check if ingredient already added
    const existing = productIngredients.find(ing => ing.inventoryItemId === inventoryItemId);
    if (existing) {
        alert('This ingredient is already added. Remove it first if you want to change it.');
        return;
    }

    // Add to ingredients array
    const ingredient = {
        inventoryItemId,
        ingredientName,
        quantity,
        unit,
        costPerUnit,
        totalCost: quantity * costPerUnit
    };

    productIngredients.push(ingredient);

    // Clear form
    ingredientSelect.value = '';
    quantityInput.value = '';
    unitInput.value = '';
    costInput.value = '';

    // Refresh display
    displayIngredientsList();
    updateProfitabilityPreview();
}

/**
 * Remove ingredient from the list
 */
function removeIngredientFromProduct(index) {
    productIngredients.splice(index, 1);
    displayIngredientsList();
    updateProfitabilityPreview();
}

/**
 * Display the list of added ingredients
 */
function displayIngredientsList() {
    const container = document.getElementById('ingredientsList');
    if (!container) return;

    if (productIngredients.length === 0) {
        container.innerHTML = '<div class="ingredients-empty">No ingredients added yet. Add ingredients using the form below.</div>';
        return;
    }

    container.innerHTML = productIngredients.map((ing, index) => `
        <div class="ingredient-item">
            <div class="ingredient-info">
                <div class="ingredient-name">${ing.ingredientName}</div>
                <div class="ingredient-quantity">${ing.quantity} ${ing.unit}</div>
                <div class="ingredient-cost">₱${ing.costPerUnit.toFixed(4)}/unit</div>
                <div class="ingredient-total">₱${ing.totalCost.toFixed(2)}</div>
            </div>
            <div class="ingredient-actions">
                <button type="button" class="btn-remove-ingredient" onclick="removeIngredientFromProduct(${index})">
                    Remove
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Update the profitability preview in real-time
 */
function updateProfitabilityPreview() {
    const priceInput = document.getElementById('newItemPrice');
    const sellingPrice = parseFloat(priceInput.value) || 0;

    // Calculate total cost from ingredients
    const totalCost = productIngredients.reduce((sum, ing) => sum + ing.totalCost, 0);

    // Calculate profit and margin
    const grossProfit = sellingPrice - totalCost;
    const profitMargin = sellingPrice > 0 ? ((grossProfit / sellingPrice) * 100) : 0;

    // Update display
    document.getElementById('previewCost').textContent = `₱${totalCost.toFixed(2)}`;
    document.getElementById('previewPrice').textContent = `₱${sellingPrice.toFixed(2)}`;

    const profitElement = document.getElementById('previewProfit');
    profitElement.textContent = `₱${grossProfit.toFixed(2)}`;
    profitElement.className = 'profit-value ' + (grossProfit >= 0 ? 'positive' : 'negative');

    const marginElement = document.getElementById('previewMargin');
    marginElement.textContent = `${profitMargin.toFixed(2)}%`;
    marginElement.className = 'profit-value ' + (profitMargin >= 0 ? 'positive' : 'negative');
}

/**
 * Auto-fill cost per unit when ingredient is selected
 */
document.addEventListener('DOMContentLoaded', function() {
    const ingredientSelect = document.getElementById('ingredientSelect');
    const costInput = document.getElementById('ingredientCost');
    const unitInput = document.getElementById('ingredientUnit');

    if (ingredientSelect && costInput && unitInput) {
        ingredientSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption.value) {
                const cost = selectedOption.dataset.cost || 0;
                const unit = selectedOption.dataset.unit || '';

                costInput.value = cost;
                unitInput.value = unit;
            } else {
                costInput.value = '';
                unitInput.value = '';
            }
        });
    }

    // Update profitability when price changes
    const priceInput = document.getElementById('newItemPrice');
    if (priceInput) {
        priceInput.addEventListener('input', updateProfitabilityPreview);
    }
});

/**
 * Note: Modal handling is now done in openProductModal function in script.js
 * This override is kept for backward compatibility but may not be needed
 */
const originalToggleForm = window.toggleForm;
window.toggleForm = function(formId) {
    if (typeof originalToggleForm === 'function') {
        originalToggleForm(formId);
    }

    if (formId === 'menuFormContainer') {
        const form = document.getElementById(formId);
        if (form && !form.classList.contains('hidden')) {
            initializeIngredientSelect();
            window.productIngredients = [];
            productIngredients = window.productIngredients;
            displayIngredientsList();
            updateProfitabilityPreview();
        }
    }
};

/**
 * Enhanced addMenuItem function to include recipe ingredients
 */
const originalAddMenuItem = window.addMenuItem;
window.addMenuItem = async function() {
    const name = document.getElementById('newItemName').value.trim();
    const price = parseFloat(document.getElementById('newItemPrice').value);
    const categoryId = document.getElementById('newItemCategory').value;
    const imageFile = document.getElementById('newItemImage').files[0];

    if (!name || !price || !categoryId) {
        alert('Please fill in Product Name, Category, and Price');
        return;
    }

    try {
        // First, create the product using the original function
        let imageName = '';

        // Upload image if provided
        if (imageFile) {
            const formData = new FormData();
            formData.append('image', imageFile);

            const uploadResponse = await fetch('php/upload_image.php', {
                method: 'POST',
                body: formData
            });

            const uploadResult = await uploadResponse.json();
            if (uploadResult.success) {
                imageName = uploadResult.filename;
            } else {
                throw new Error('Image upload failed: ' + (uploadResult.error || 'Unknown error'));
            }
        }

        // Create product
        const productResponse = await fetch('php/api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resource: 'products',
                action: 'create',
                data: {
                    name,
                    price,
                    categoryId,
                    image: imageName
                }
            })
        });

        const productResult = await productResponse.json();
        if (!productResult.success) {
            throw new Error('Failed to create product: ' + (productResult.error || 'Unknown error'));
        }

        // Get the product ID from the created product
        // Match by both name AND category to avoid confusion with duplicate names
        let productId = null;

        const newProduct = productResult.data.products.find(p =>
            p.name === name && p.categoryId === categoryId
        );

        if (newProduct) {
            productId = newProduct.id;
            console.log('Found product by name and category:', productId);
        } else {
            // Fallback: try to find by ID if the API returns it directly
            productId = productResult.data.product_id || productResult.data.id;

            if (!productId) {
                // Last resort: find the most recently created product with this name
                const matchingProducts = productResult.data.products.filter(p => p.name === name);
                if (matchingProducts.length > 0) {
                    // Get the one with the highest ID (most recent)
                    const lastProduct = matchingProducts.reduce((prev, current) =>
                        (current.id > prev.id) ? current : prev
                    );
                    productId = lastProduct.id;
                    console.log('Found product by highest ID:', productId);
                } else {
                    throw new Error('Product created but could not find ID');
                }
            }
        }

        // Now add all recipe ingredients
        if (productIngredients.length > 0) {
            for (const ingredient of productIngredients) {
                await fetch('php/api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resource: 'recipes',
                        action: 'add-ingredient',
                        data: {
                            product_id: productId,
                            inventory_item_id: ingredient.inventoryItemId,
                            quantity: ingredient.quantity,
                            unit: ingredient.unit,
                            notes: null
                        }
                    })
                });
            }

            // Update inventory item costs if needed
            for (const ingredient of productIngredients) {
                await fetch('php/api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resource: 'inventory-cost',
                        action: 'update',
                        data: {
                            inventory_item_id: ingredient.inventoryItemId,
                            cost_per_unit: ingredient.costPerUnit
                        }
                    })
                });
            }
        }

        // Reload data
        if (typeof reloadData === 'function') {
            await reloadData();
        }

        // Clear form
        document.getElementById('newItemName').value = '';
        document.getElementById('newItemPrice').value = '';
        document.getElementById('newItemImage').value = '';
        document.getElementById('newItemCategory').value = '';
        window.productIngredients = [];
        productIngredients = window.productIngredients;
        displayIngredientsList();
        updateProfitabilityPreview();

        // Close modal (handled in script.js)
        if (typeof closeProductModal === 'function') {
            closeProductModal();
        }

        // Refresh display
        if (typeof displayMenuItems === 'function') {
            displayMenuItems();
        }

        alert('Product and recipe added successfully!');
    } catch (error) {
        console.error('Error adding product:', error);
        alert('Failed to add product: ' + error.message);
    }
};

/**
 * Display menu items with profitability information
 */
const originalDisplayMenuItems = window.displayMenuItems;
window.displayMenuItems = async function() {
    // Call original function
    if (typeof originalDisplayMenuItems === 'function') {
        originalDisplayMenuItems();
    }

    // Fetch profitability data for all products
    try {
        const response = await fetch('php/api.php?resource=profitability&action=get-all');
        const result = await response.json();

        if (result.success && result.data.products) {
            const profitabilityData = {};
            result.data.products.forEach(p => {
                profitabilityData[p.id] = p;
            });

            // Add profitability info to each menu item card
            document.querySelectorAll('.menu-item-card').forEach(card => {
                const productId = card.dataset.productId;
                const profit = profitabilityData[productId];

                if (profit && profit.costPrice > 0) {
                    // Check if profitability info already exists
                    let profitDiv = card.querySelector('.menu-item-profitability');
                    if (!profitDiv) {
                        profitDiv = document.createElement('div');
                        profitDiv.className = 'menu-item-profitability';
                        card.appendChild(profitDiv);
                    }

                    const status = profit.profitMarginPercentage > 50 ? 'excellent' :
                                 profit.profitMarginPercentage > 30 ? 'good' :
                                 profit.profitMarginPercentage > 0 ? 'low' : 'loss';

                    profitDiv.innerHTML = `
                        <div class="cost-info">
                            <span class="cost-label">Cost:</span>
                            <span class="cost-value">₱${profit.costPrice.toFixed(2)}</span>
                        </div>
                        <div class="cost-info">
                            <span class="cost-label">Profit:</span>
                            <span class="cost-value">₱${profit.grossProfit.toFixed(2)}</span>
                        </div>
                        <div class="profitability-badge ${status}">
                            ${profit.profitMarginPercentage.toFixed(1)}% margin
                        </div>
                    `;
                }
            });
        }
    } catch (error) {
        console.error('Error loading profitability data:', error);
    }
};
