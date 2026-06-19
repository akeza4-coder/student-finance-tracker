import { StateManager } from './state.js';
import { runFieldDiagnostic } from './validators.js';
import { compileSafeRegex, executeHighlightMark } from './search.js';
import { validateIncomingJSON } from './storage.js';

const FX_INDEX = { RWF: 1.0, USD: 0.00074, EUR: 0.00069 };
const CURRENCY_GLYPHS = { RWF: "Frw", USD: "$", EUR: "€" };

document.addEventListener('DOMContentLoaded', () => {
  seedFriendlyInitialSampleData();
  setupClickHandlersLayout();
  refreshUserDisplay();
});

function seedFriendlyInitialSampleData() {
  const currentState = StateManager.getState();
  if (!currentState.transactions || currentState.transactions.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(); d.setDate(d.getDate() - 1); const formatYesterday = yesterday.toISOString().split('T')[0];
    
    const sampleItems = [
      { id: "item_01", description: "Campus Cafeteria Lunch", amount: 2500, category: "Food", date: today },
      { id: "item_02", description: "MTN Mobile Airtime Topup Plan", amount: 1000, category: "Other", date: today },
      { id: "item_03", description: "Software Engineering Textbook Bundle", amount: 15000, category: "Books", date: formatYesterday }
    ];
    
    sampleItems.forEach(item => StateManager.addOrUpdateTransaction(item));
  }
}

function setupClickHandlersLayout() {
  document.getElementById('transaction-mutation-form').addEventListener('submit', handleFormSubmitAction);
  document.getElementById('form-cancel-btn').addEventListener('click', dropEditingState);
  document.getElementById('sort-selector').addEventListener('change', refreshSortedDisplay);
  document.getElementById('sort-order-selector').addEventListener('change', refreshSortedDisplay);
  document.getElementById('search-input').addEventListener('input', processLiveSearchInput);
  
  document.getElementById('clear-search-btn').addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('search-error-msg').textContent = '';
    StateManager.setSearchPattern(null);
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
      document.querySelectorAll('.nav-link').forEach(l => { l.classList.remove('active'); l.removeAttribute('aria-current'); });

      document.getElementById(targetPageId).style.display = 'block';
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
      announceScreenReaderStatus(`Opened the ${targetPageId} tab channel`);
    });
  });

  document.querySelectorAll('.app-section').forEach((page, index) => { if (index !== 0) page.style.display = 'none'; });
}

function announceScreenReaderStatus(msg) {
  const box = document.getElementById('aria-announcer');
  box.textContent = msg;
  setTimeout(() => { box.textContent = ''; }, 3000);
}

function refreshUserDisplay() {
  const currentAppState = StateManager.getState();
  
  if (currentAppState.settings.currency === "RWF" && currentAppState.settings.budgetCap === 500) {
    currentAppState.settings.budgetCap = 50000;
    document.getElementById('settings-budget-cap').value = 50000;
  }

  const symbolToken = CURRENCY_GLYPHS[currentAppState.settings.currency];
  document.querySelectorAll('.active-currency-sym').forEach(el => el.textContent = symbolToken);
  
  loadDropdownCategoryOptions(currentAppState.settings.categories);
  runDashboardCalculations(currentAppState, symbolToken);
  buildExpensesTable(currentAppState);
}

function loadDropdownCategoryOptions(categories) {
  const selectBox = document.getElementById('input-category');
  selectBox.innerHTML = '';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat; opt.textContent = cat; selectBox.appendChild(opt);
  });
}

function runDashboardCalculations(state, currencySymbol) {
  const list = state.transactions;
  const currentLimit = state.settings.budgetCap;
  document.getElementById('stat-total-count').textContent = list.length;
  
  const sumUSD = list.reduce((total, record) => total + record.amount, 0);
  const calculatedTotalAmount = sumUSD * FX_INDEX[state.settings.currency];
  document.getElementById('stat-total-amount').textContent = calculatedTotalAmount.toFixed(0);

  const trackingMap = {};
  list.forEach(item => { trackingMap[item.category] = (trackingMap[item.category] || 0) + item.amount; });
  let leadingCategory = '—'; let maxCostValue = -1;
  for (const [cat, value] of Object.entries(trackingMap)) {
    if (value > maxCostValue) { maxCostValue = value; leadingCategory = cat; }
  }
  document.getElementById('stat-top-category').textContent = leadingCategory;

  document.getElementById('cap-limit-display').textContent = `${currentLimit.toLocaleString()} ${currencySymbol}`;
  const unspentBalanceValue = currentLimit - calculatedTotalAmount;
  document.getElementById('cap-remaining-display').textContent = `${unspentBalanceValue.toLocaleString()} ${currencySymbol}`;
  
  const progressBarElement = document.getElementById('cap-progress-bar');
  const percentageValueRatio = Math.min((calculatedTotalAmount / currentLimit) * 100, 100);
  progressBarElement.style.width = `${percentageValueRatio}%`;

  const feedbackBannerElement = document.getElementById('cap-live-feedback');
  if (calculatedTotalAmount > currentLimit) {
    feedbackBannerElement.className = "cap-status-banner danger";
    feedbackBannerElement.textContent = `Warning: Budget limit exceeded by ${Math.abs(unspentBalanceValue).toLocaleString()} ${currencySymbol}!`;
  } else {
    feedbackBannerElement.className = "cap-status-banner safe";
    feedbackBannerElement.textContent = "Your spending is under control and within your budget limit.";
  }

  drawWeeklyVisualChart(list);
}

function drawWeeklyVisualChart(list) {
  const chartWrapperElement = document.getElementById('trend-chart-render');
  chartWrapperElement.innerHTML = '';
  const datesArray = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); datesArray.push(d.toISOString().split('T')[0]);
  }
  const dateMap = {}; datesArray.forEach(d => dateMap[d] = 0);
  list.forEach(record => { if (dateMap[record.date] !== undefined) dateMap[record.date] += record.amount; });
  const extremeMaxPeak = Math.max(...Object.values(dateMap), 10);

  datesArray.forEach(day => {
    const aggregateCost = dateMap[day];
    const columnPercentageScaleHeight = (aggregateCost / extremeMaxPeak) * 100;
    const graphicColumnWrapper = document.createElement('div');
    graphicColumnWrapper.className = 'chart-column-wrapper';
    graphicColumnWrapper.innerHTML = `<div class="chart-bar" style="height: ${columnPercentageScaleHeight}%"></div>`;
    chartWrapperElement.appendChild(graphicColumnWrapper);
  });
}

function buildExpensesTable(state) {
  const tableBodyTarget = document.getElementById('ledger-rows-target');
  tableBodyTarget.innerHTML = '';
  let activeListItemsArray = [...state.transactions];
  const fxConversionValue = FX_INDEX[state.settings.currency];

  if (state.activeSearchQuery) {
    activeListItemsArray = activeListItemsArray.filter(item => 
      state.activeSearchQuery.test(item.description) || state.activeSearchQuery.test(item.category)
    );
  }

  activeListItemsArray.sort((alpha, beta) => {
    let comparisonValueA = alpha[state.sortField]; let comparisonValueB = beta[state.sortField];
    return state.sortOrder === 'asc' ? (comparisonValueA > comparisonValueB ? 1 : -1) : (comparisonValueA < comparisonValueB ? 1 : -1);
  });

  if (activeListItemsArray.length === 0) {
    tableBodyTarget.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No records found matching your search terms.</td></tr>`;
    return;
  }

  activeListItemsArray.forEach(record => {
    const tableRowDOMElement = document.createElement('tr');
    tableRowDOMElement.innerHTML = `
      <td data-label="Date Purchased">${record.date}</td>
      <td data-label="Item Description">${executeHighlightMark(record.description, state.activeSearchQuery)}</td>
      <td data-label="Category">${executeHighlightMark(record.category, state.activeSearchQuery)}</td>
      <td data-label="Cost">${(record.amount * fxConversionValue).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
      <td data-label="Actions">
        <button class="btn btn-secondary edit-action" data-id="${record.id}">Edit</button>
        <button class="btn btn-danger delete-action" data-id="${record.id}">Delete</button>
      </td>
    `;
    tableRowDOMElement.querySelector('.edit-action').addEventListener('click', () => editTargetRowItem(record.id));
    tableRowDOMElement.querySelector('.delete-action').addEventListener('click', () => removeTargetRowItem(record.id));
    tableBodyTarget.appendChild(tableRowDOMElement);
  });
}

function processLiveSearchInput(e) {
  try {
    const safelyCompiledRegex = compileSafeRegex(e.target.value, 'i');
    document.getElementById('search-error-msg').textContent = '';
    StateManager.setSearchPattern(safelyCompiledRegex);
    refreshUserDisplay();
  } catch (err) {
    document.getElementById('search-error-msg').textContent = `Invalid search rule layout.`;
  }
}

function refreshSortedDisplay() {
  StateManager.setSort(document.getElementById('sort-selector').value, document.getElementById('sort-order-selector').value);
  refreshUserDisplay();
}

function handleFormSubmitAction(e) {
  e.preventDefault();
  const id = document.getElementById('form-record-id').value;
  const description = document.getElementById('input-description').value;
  const amount = document.getElementById('input-amount').value;
  const date = document.getElementById('input-date').value;
  const category = document.getElementById('input-category').value;

  const descValidationReport = runFieldDiagnostic('description', description);
  const amountValidationReport = runFieldDiagnostic('amount', amount);
  const dateValidationReport = runFieldDiagnostic('date', date);

  document.getElementById('err-description').textContent = descValidationReport.message;
  document.getElementById('err-amount').textContent = amountValidationReport.message;
  document.getElementById('err-date').textContent = dateValidationReport.message;

  if (!descValidationReport.valid || !amountValidationReport.valid || !dateValidationReport.valid) return;

  const currencyNormalizationScaleIndexValue = FX_INDEX[StateManager.getState().settings.currency];
  StateManager.addOrUpdateTransaction({ id, description, amount: parseFloat(amount) / currencyNormalizationScaleIndexValue, date, category });
  clearFormFieldsLayout();
  refreshUserDisplay();
}

function editTargetRowItem(id) {
  const targetedItemDataModel = StateManager.getState().transactions.find(t => t.id === id);
  if (!targetedItemDataModel) return;
  const currencyNormalizationScaleIndexValue = FX_INDEX[StateManager.getState().settings.currency];

  document.getElementById('form-record-id').value = targetedItemDataModel.id;
  document.getElementById('input-description').value = targetedItemDataModel.description;
  document.getElementById('input-amount').value = (targetedItemDataModel.amount * currencyNormalizationScaleIndexValue).toFixed(0);
  document.getElementById('input-date').value = targetedItemDataModel.date;
  document.getElementById('input-category').value = targetedItemDataModel.category;

  document.getElementById('form-submit-btn').textContent = "Update Expense";
  document.getElementById('form-cancel-btn').style.display = 'inline-flex';
  document.getElementById('form-section').style.display = 'block';
  document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
}

function removeTargetRowItem(id) {
  if (confirm("Are you sure you want to permanently delete this expense item?")) {
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

function dropEditingState() {
  clearFormFieldsLayout();
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
      if (validateIncomingJSON(parsedArrayMatrixData)) { StateManager.ingestImportedArray(parsedArrayMatrixData); refreshUserDisplay(); }
      else { alert("The data format inside this backup file is invalid."); }
    } catch { alert("Could not open file. Make sure it is a valid JSON file."); }
  };
  fileStreamReaderEngine.readAsText(pointerFileReference);
}