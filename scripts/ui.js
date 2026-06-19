// This file controls the screen layout, buttons, and display updates
const CURRENCY_GLYPHS = { RWF: "Frw", USD: "$", EUR: "€" };

document.addEventListener('DOMContentLoaded', () => {
  setupClickHandlersLayout();
  refreshUserDisplay();
});

function setupClickHandlersLayout() {
  document.getElementById('transaction-mutation-form').addEventListener('submit', handleFormSubmitAction);
  document.getElementById('form-cancel-btn').addEventListener('click', clearFormFieldsLayout);
  document.getElementById('sort-selector').addEventListener('change', refreshUserDisplay);
  document.getElementById('sort-order-selector').addEventListener('change', refreshUserDisplay);
  document.getElementById('search-input').addEventListener('input', processLiveSearchInput);
  
  document.getElementById('clear-search-btn').addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('search-error-msg').textContent = '';
    window.currentSearchRegex = null;
    refreshUserDisplay();
  });

  document.getElementById('save-settings-btn').addEventListener('click', saveConfigSettings);
  document.getElementById('data-export-btn').addEventListener('click', downloadBackupFile);
  document.getElementById('data-import-input').addEventListener('change', uploadBackupFile);

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPageId = link.getAttribute('href').substring(1);
      document.querySelectorAll('.app-section').forEach(page => page.style.display = 'none');
      document.querySelectorAll('.nav-link').forEach(l => { l.classList.remove('active'); });

      document.getElementById(targetPageId).style.display = 'block';
      link.classList.add('active');
    });
  });

  document.querySelectorAll('.app-section').forEach((page, index) => { if (index !== 0) page.style.display = 'none'; });
}

function refreshUserDisplay() {
  const currentAppState = StateManager.getState();
  const symbolToken = CURRENCY_GLYPHS[currentAppState.settings.currency || "RWF"];
  
  document.querySelectorAll('.active-currency-sym').forEach(el => el.textContent = symbolToken);
  
  loadDropdownCategoryOptions(currentAppState.settings.categories || ["Food", "Housing", "Transport", "Books", "Other"]);
  runDashboardCalculations(currentAppState, symbolToken);
  buildExpensesTable(currentAppState);
}

function loadDropdownCategoryOptions(categories) {
  const selectBox = document.getElementById('input-category');
  if (!selectBox) return;
  const savedValue = selectBox.value;
  selectBox.innerHTML = '';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat; opt.textContent = cat; selectBox.appendChild(opt);
  });
  if (savedValue) selectBox.value = savedValue;
}

function runDashboardCalculations(state, currencySymbol) {
  const list = state.transactions || [];
  const currentLimit = state.settings.budgetCap || 50000;
  
  document.getElementById('stat-total-count').textContent = list.length;
  
  const totalCost = list.reduce((total, record) => total + parseFloat(record.amount || 0), 0);
  document.getElementById('stat-total-amount').textContent = totalCost.toLocaleString();

  const trackingMap = {};
  list.forEach(item => { trackingMap[item.category] = (trackingMap[item.category] || 0) + parseFloat(item.amount || 0); });
  let leadingCategory = '—'; let maxCostValue = -1;
  for (const [cat, value] of Object.entries(trackingMap)) {
    if (value > maxCostValue) { maxCostValue = value; leadingCategory = cat; }
  }
  document.getElementById('stat-top-category').textContent = leadingCategory;

  document.getElementById('cap-limit-display').textContent = `${currentLimit.toLocaleString()} ${currencySymbol}`;
  const unspentBalanceValue = currentLimit - totalCost;
  document.getElementById('cap-remaining-display').textContent = `${unspentBalanceValue.toLocaleString()} ${currencySymbol}`;
  
  const progressBarElement = document.getElementById('cap-progress-bar');
  const percentageValueRatio = Math.min((totalCost / currentLimit) * 100, 100);
  if (progressBarElement) progressBarElement.style.width = `${percentageValueRatio}%`;

  const feedbackBannerElement = document.getElementById('cap-live-feedback');
  if (feedbackBannerElement) {
    if (totalCost > currentLimit) {
      feedbackBannerElement.className = "cap-status-banner danger";
      feedbackBannerElement.textContent = `Warning: Over budget by ${Math.abs(unspentBalanceValue).toLocaleString()} ${currencySymbol}!`;
    } else {
      feedbackBannerElement.className = "cap-status-banner safe";
      feedbackBannerElement.textContent = "Your spending is under control and within your budget limit.";
    }
  }
}

function buildExpensesTable(state) {
  const tableBodyTarget = document.getElementById('ledger-rows-target');
  if (!tableBodyTarget) return;
  tableBodyTarget.innerHTML = '';
  let activeListItemsArray = [...(state.transactions || [])];

  const searchRegex = window.currentSearchRegex;
  if (searchRegex) {
    activeListItemsArray = activeListItemsArray.filter(item => 
      searchRegex.test(item.description) || searchRegex.test(item.category)
    );
  }

  const sortField = document.getElementById('sort-selector').value || 'date';
  const sortOrder = document.getElementById('sort-order-selector').value || 'desc';

  activeListItemsArray.sort((alpha, beta) => {
    let aVal = alpha[sortField]; let bVal = beta[sortField];
    if (sortField === 'amount') { aVal = parseFloat(aVal); bVal = parseFloat(bVal); }
    return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  if (activeListItemsArray.length === 0) {
    tableBodyTarget.innerHTML = `<tr><td colspan="5" style="text-align:center; color:gray;">No expenses logged yet. Go ahead and add one below!</td></tr>`;
    return;
  }

  activeListItemsArray.forEach(record => {
    const tableRowDOMElement = document.createElement('tr');
    tableRowDOMElement.innerHTML = `
      <td>${record.date}</td>
      <td>${record.description}</td>
      <td>${record.category}</td>
      <td>${parseFloat(record.amount).toLocaleString()}</td>
      <td>
        <button class="btn btn-secondary edit-action" data-id="${record.id}">Edit</button>
        <button class="btn btn-danger delete-action" data-id="${record.id}">Delete</button>
      </td>
    `;
    tableRowDOMElement.querySelector('.edit-action').addEventListener('click', () => editTargetRowItem(record.id));
    tableRowDOMElement.querySelector('.delete-action').addEventListener('click', () => removeTargetRowItem(record.id));
    tableBodyTarget.appendChild(tableRowDOMElement);
  });
}

function handleFormSubmitAction(e) {
  e.preventDefault();
  const id = document.getElementById('form-record-id').value || 'id_' + Date.now();
  const description = document.getElementById('input-description').value;
  const amount = document.getElementById('input-amount').value;
  const date = document.getElementById('input-date').value;
  const category = document.getElementById('input-category').value;

  const descValidation = runFieldDiagnostic('description', description);
  const amountValidation = runFieldDiagnostic('amount', amount);
  const dateValidation = runFieldDiagnostic('date', date);

  document.getElementById('err-description').textContent = descValidation.message;
  document.getElementById('err-amount').textContent = amountValidation.message;
  document.getElementById('err-date').textContent = dateValidation.message;

  if (!descValidation.valid || !amountValidation.valid || !dateValidation.valid) return;

  StateManager.addOrUpdateTransaction({ id, description, amount: parseFloat(amount), date, category });
  
  clearFormFieldsLayout();
  refreshUserDisplay(); 
}

function editTargetRowItem(id) {
  const item = StateManager.getState().transactions.find(t => t.id === id);
  if (!item) return;

  document.getElementById('form-record-id').value = item.id;
  document.getElementById('input-description').value = item.description;
  document.getElementById('input-amount').value = item.amount;
  document.getElementById('input-date').value = item.date;
  document.getElementById('input-category').value = item.category;

  document.getElementById('form-submit-btn').textContent = "Update Expense";
  document.getElementById('form-cancel-btn').style.display = 'inline-flex';
}

function removeTargetRowItem(id) {
  if (confirm("Are you sure you want to delete this expense?")) {
    StateManager.deleteTransaction(id);
    refreshUserDisplay();
  }
}

function clearFormFieldsLayout() {
  document.getElementById('transaction-mutation-form').reset();
  document.getElementById('form-record-id').value = '';
  document.getElementById('form-submit-btn').textContent = "Save Expense";
  document.getElementById('form-cancel-btn').style.display = 'none';
}

function processLiveSearchInput(e) {
  try {
    const safelyCompiledRegex = compileSafeRegex(e.target.value, 'i');
    document.getElementById('search-error-msg').textContent = '';
    window.currentSearchRegex = safelyCompiledRegex;
    refreshUserDisplay();
  } catch (err) {
    document.getElementById('search-error-msg').textContent = `Invalid search rule layout.`;
  }
}

function saveConfigSettings() {
  StateManager.updateSettings(document.getElementById('settings-budget-cap').value, document.getElementById('settings-currency-selector').value);
  refreshUserDisplay();
}

function downloadBackupFile() {
  const outputStringPayload = JSON.stringify(StateManager.getState().transactions, null, 2);
  const streamBlobData = new Blob([outputStringPayload], { type: 'application/json' });
  const virtualDownloadAnchorElement = document.createElement('a');
  virtualDownloadAnchorElement.href = URL.createObjectURL(streamBlobData); virtualDownloadAnchorElement.download = 'my_expense_backup.json'; virtualDownloadAnchorElement.click();
}

function uploadBackupFile(e) {
  const pointerFileReference = e.target.files[0]; if (!pointerFileReference) return;
  const fileStreamReaderEngine = new FileReader();
  fileStreamReaderEngine.onload = function(evt) {
    try {
      const parsedArrayMatrixData = JSON.parse(evt.target.result);
      if (validateIncomingJSON(parsedArrayMatrixData)) { StateManager.saveState({ ...StateManager.getState(), transactions: parsedArrayMatrixData }); refreshUserDisplay(); }
      else { alert("The data format inside this backup file is invalid."); }
    } catch { alert("Could not open file. Make sure it is a valid JSON file."); }
  };
  fileStreamReaderEngine.readAsText(pointerFileReference);
}