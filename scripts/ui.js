import { StateManager } from './state.js';
import { runFieldDiagnostic } from './validators.js';
import { compileSafeRegex, executeHighlightMark } from './search.js';
import { validateIncomingJSON } from './storage.js';

// Exchange Conversion Indexes Core Metrics (Manual Rates)
const FX_INDEX = { USD: 1.0, EUR: 0.92, GBP: 0.78 };
const CURRENCY_GLYPHS = { USD: "$", EUR: "€", GBP: "£" };

document.addEventListener('DOMContentLoaded', () => {
  initializeCoreDOMHooks();
  renderAppEcosystem();
});

function initializeCoreDOMHooks() {
  // Primary Action Hook Injections
  const txForm = document.getElementById('transaction-mutation-form');
  txForm.addEventListener('submit', handleFormSubmission);
  
  document.getElementById('form-cancel-btn').addEventListener('click', clearFormState);
  
  // Filter Matrix System Hooks
  document.getElementById('sort-selector').addEventListener('change', runDynamicSortSync);
  document.getElementById('sort-order-selector').addEventListener('change', runDynamicSortSync);
  
  // Real-time RegEx Compilation Loop Hook
  document.getElementById('search-input').addEventListener('input', processingLiveSearchQuery);
  document.getElementById('clear-search-btn').addEventListener('click', () => {
    const input = document.getElementById('search-input');
    input.value = '';
    document.getElementById('search-error-msg').textContent = '';
    StateManager.setSearchPattern(null);
    renderAppEcosystem();
  });

  // Settings Panel Commit Hooks
  document.getElementById('save-settings-btn').addEventListener('click', applySettingsModifications);
  
  // File System Data Serialization Infrastructure Hooks
  document.getElementById('data-export-btn').addEventListener('click', executeDatabaseExport);
  document.getElementById('data-import-input').addEventListener('change', executeDatabaseIngestion);

  // Accessible Navigation Multi-View Architecture Routing System
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionTargetId = link.getAttribute('href').substring(1);
      
      document.querySelectorAll('.app-section').forEach(sec => sec.style.display = 'none');
      document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('active');
        l.removeAttribute('aria-current');
      });

      document.getElementById(sectionTargetId).style.display = 'block';
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
      
      announceToAriaScreenReader(`Mapsd view channel to ${sectionTargetId}`);
    });
  });

  // Initialize view state layout rendering visibility rules
  document.querySelectorAll('.app-section').forEach((sec, idx) => {
    if (idx !== 0) sec.style.display = 'none';
  });
}

function announceToAriaScreenReader(message, processingLevel = 'polite') {
  const announcer = document.getElementById('aria-announcer');
  announcer.setAttribute('aria-live', processingLevel === 'assertive' ? 'assertive' : 'polite');
  announcer.textContent = message;
  // Flushes tracking buffer after output cycle runs
  setTimeout(() => { announcer.textContent = ''; }, 3000); 
}

function renderAppEcosystem() {
  const state = StateManager.getState();
  const glyph = CURRENCY_GLYPHS[state.settings.currency];
  
  // Refresh standard layout text metric values
  document.querySelectorAll('.active-currency-sym').forEach(el => el.textContent = glyph);
  
  populateFormDropdowns(state.settings.categories);
  processCalculatedMetricsAndCharts(state, glyph);
  processFilteredLedgerTable(state);
}

function populateFormDropdowns(categories) {
  const catSelect = document.getElementById('input-category');
  const currentSelectionValue = catSelect.value;
  catSelect.innerHTML = '';
  categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    catSelect.appendChild(opt);
  });
  if (currentSelectionValue) catSelect.value = currentSelectionValue;
}

function processCalculatedMetricsAndCharts(state, glyph) {
  const records = state.transactions;
  const targetCap = state.settings.budgetCap;
  
  document.getElementById('stat-total-count').textContent = records.length;
  
  // Compute global summation inside the active base conversion matrix scale
  const totalInBaseUSD = records.reduce((sum, current) => sum + current.amount, 0);
  const conversionRateValue = FX_INDEX[state.settings.currency];
  const convertedTotalSumValue = totalInBaseUSD * conversionRateValue;
  
  document.getElementById('stat-total-amount').textContent = convertedTotalSumValue.toFixed(2);

  // Compute the top spending stream category
  const mappingFrequencies = {};
  records.forEach(r => { mappingFrequencies[r.category] = (mappingFrequencies[r.category] || 0) + r.amount; });
  let maximalCategoryToken = '—';
  let extremeValuePeak = -1;
  for (const [cat, sumValue] of Object.entries(mappingFrequencies)) {
    if (sumValue > extremeValuePeak) { extremeValuePeak = sumValue; maximalCategoryToken = cat; }
  }
  document.getElementById('stat-top-category').textContent = maximalCategoryToken;

  // Process operational limits and ARIA live feedback warnings
  document.getElementById('cap-limit-display').textContent = `${glyph}${targetCap.toFixed(2)}`;
  const remainingValueDelta = targetCap - convertedTotalSumValue;
  document.getElementById('cap-remaining-display').textContent = `${glyph}${remainingValueDelta.toFixed(2)}`;
  
  const progressBarElement = document.getElementById('cap-progress-bar');
  const percentageCapRatioValue = Math.min((convertedTotalSumValue / targetCap) * 100, 100);
  progressBarElement.style.width = `${percentageCapRatioValue}%`;
  progressBarElement.setAttribute('aria-valuenow', Math.round(percentageCapRatioValue));

  const alertContainerBanner = document.getElementById('cap-live-feedback');
  if (convertedTotalSumValue > targetCap) {
    alertContainerBanner.className = "cap-status-banner danger";
    alertContainerBanner.textContent = `Warning: Budget allocation ceiling crossed by ${glyph}${Math.abs(remainingValueDelta).toFixed(2)}!`;
    alertContainerBanner.setAttribute('role', 'alert');
    progressBarElement.style.backgroundColor = 'var(--system-error)';
  } else {
    alertContainerBanner.className = "cap-status-banner safe";
    alertContainerBanner.textContent = "Safe Mode active. Financial metrics reside within functional guidelines.";
    alertContainerBanner.setAttribute('role', 'status');
    progressBarElement.style.backgroundColor = 'var(--color-primary)';
  }

  // Draw the 7-day transaction velocity chart
  generateHistoricalVelocityTrendChart(records);
}

function generateHistoricalVelocityTrendChart(records) {
  const chartWrapper = document.getElementById('trend-chart-render');
  chartWrapper.innerHTML = '';
  
  // Compute matching past boundaries arrays
  const generatedDayColumnsArray = [];
  for (let i = 6; i >= 0; i--) {
    const datePointer = new Date();
    datePointer.setDate(datePointer.getDate() - i);
    generatedDayColumnsArray.push(datePointer.toISOString().split('T')[0]);
  }

  const mappingVolumeAggregateValues = {};
  generatedDayColumnsArray.forEach(d => mappingVolumeAggregateValues[d] = 0);
  records.forEach(r => { if (mappingVolumeAggregateValues[r.date] !== undefined) mappingVolumeAggregateValues[r.date] += r.amount; });

  const absolutePeakVolumeMax = Math.max(...Object.values(mappingVolumeAggregateValues), 10);

  generatedDayColumnsArray.forEach(dateKeyString => {
    const aggregateValue = mappingVolumeAggregateValues[dateKeyString];
    const columnPercentageScaleHeight = (aggregateValue / absolutePeakVolumeMax) * 100;
    
    const formattedShortDateMonth = dateKeyString.substring(5); // Strips year down to MM-DD
    
    const blockWrapperElement = document.createElement('div');
    blockWrapperElement.className = 'chart-column-wrapper';
    blockWrapperElement.innerHTML = `
      <div class="chart-bar" style="height: ${columnPercentageScaleHeight}%" title="Aggregate Volume: ${aggregateValue.toFixed(2)}"></div>
      <div class="chart-label">${formattedShortDateMonth}</div>
    `;
    chartWrapper.appendChild(blockWrapperElement);
  });
}

function processFilteredLedgerTable(state) {
  const bodyTarget = document.getElementById('ledger-rows-target');
  bodyTarget.innerHTML = '';
  
  let structuralRecordsResult = [...state.transactions];
  const targetConversionFXRate = FX_INDEX[state.settings.currency];

  // Run filtering logic if an active search query pattern exists
  if (state.activeSearchQuery) {
    structuralRecordsResult = structuralRecordsResult.filter(item => 
      state.activeSearchQuery.test(item.description) || 
      state.activeSearchQuery.test(item.category)
    );
  }

  // Run internal data sorting calculations
  structuralRecordsResult.sort((alpha, beta) => {
    let comparisonValueA = alpha[state.sortField];
    let comparisonValueB = beta[state.sortField];

    if (typeof comparisonValueA === 'string') {
      return state.sortOrder === 'asc' 
        ? comparisonValueA.localeCompare(comparisonValueB) 
        : comparisonValueB.localeCompare(comparisonValueA);
    } else {
      return state.sortOrder === 'asc' 
        ? comparisonValueA - comparisonValueB 
        : comparisonValueB - comparisonValueA;
    }
  });

  if (structuralRecordsResult.length === 0) {
    bodyTarget.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No transaction ledgers fall under current filter boundaries.</td></tr>`;
    return;
  }

  structuralRecordsResult.forEach(record => {
    const convertedRowVolumeDisplay = (record.amount * targetConversionFXRate).toFixed(2);
    const compiledSearchExpressionPattern = state.activeSearchQuery;

    const modifiedDescriptionStringHTML = executeHighlightMark(record.description, compiledSearchExpressionPattern);
    const modifiedCategoryStringHTML = executeHighlightMark(record.category, compiledSearchExpressionPattern);

    const tableRowDOMElement = document.createElement('tr');
    tableRowDOMElement.innerHTML = `
      <td data-label="Execution Date">${record.date}</td>
      <td data-label="Description">${modifiedDescriptionStringHTML}</td>
      <td data-label="Category">${modifiedCategoryStringHTML}</td>
      <td data-label="Volume">${convertedRowVolumeDisplay}</td>
      <td data-label="Action Controls">
        <button class="btn btn-secondary btn-sm edit-action-trigger" data-id="${record.id}" style="padding:0.35rem 0.75rem; margin-right:0.5rem; font-size:0.8rem;">Edit</button>
        <button class="btn btn-danger btn-sm delete-action-trigger" data-id="${record.id}" style="padding:0.35rem 0.75rem; font-size:0.8rem;">Delete</button>
      </td>
    `;

    // Intercept action button listeners
    tableRowDOMElement.querySelector('.edit-action-trigger').addEventListener('click', () => triggerInlineRowModifications(record.id));
    tableRowDOMElement.querySelector('.delete-action-trigger').addEventListener('click', () => fireDestructiveRecordDeletion(record.id));

    bodyTarget.appendChild(tableRowDOMElement);
  });
}

function processingLiveSearchQuery(e) {
  const searchBarStringVal = e.target.value;
  const errorMsgBlock = document.getElementById('search-error-msg');
  
  if (!searchBarStringVal) {
    errorMsgBlock.textContent = '';
    StateManager.setSearchPattern(null);
    renderAppEcosystem();
    return;
  }

  try {
    const safeCompiledRegexObj = compileSafeRegex(searchBarStringVal, 'i');
    errorMsgBlock.textContent = '';
    StateManager.setSearchPattern(safeCompiledRegexObj);
    renderAppEcosystem();
  } catch (err) {
    // Graceful routing of syntax parsing failures during runtime regex parsing
    errorMsgBlock.textContent = `RegEx Synthesis Fault: ${err.message}`;
  }
}

function runDynamicSortSync() {
  const f = document.getElementById('sort-selector').value;
  const o = document.getElementById('sort-order-selector').value;
  StateManager.setSort(f, o);
  renderAppEcosystem();
}

function handleFormSubmission(e) {
  e.preventDefault();
  
  const idValue = document.getElementById('form-record-id').value;
  const descValue = document.getElementById('input-description').value;
  const amountValue = document.getElementById('input-amount').value;
  const dateValue = document.getElementById('input-date').value;
  const catValue = document.getElementById('input-category').value;

  // Run full verification pipeline validations
  const dDiag = runFieldDiagnostic('description', descValue);
  const aDiag = runFieldDiagnostic('amount', amountValue);
  const tDiag = runFieldDiagnostic('date', dateValue);

  document.getElementById('err-description').textContent = dDiag.message;
  document.getElementById('err-amount').textContent = aDiag.message;
  document.getElementById('err-date').textContent = tDiag.message;

  if (!dDiag.valid || !aDiag.valid || !tDiag.valid) {
    announceToAriaScreenReader("Form evaluation failed. Review configuration criteria constraints.", "assertive");
    return;
  }

  // Adjust input payload downward to baseline system reference value (USD) if user saves in foreign currency
  const state = StateManager.getState();
  const conversionNormalizationIndexValue = FX_INDEX[state.settings.currency];
  const standardNormalizedUSDVolumeValue = parseFloat(amountValue) / conversionNormalizationIndexValue;

  const transactionPayloadData = {
    description: descValue,
    amount: standardNormalizedUSDVolumeValue,
    date: dateValue,
    category: catValue
  };

  if (idValue) transactionPayloadData.id = idValue;

  StateManager.addOrUpdateTransaction(transactionPayloadData);
  clearFormState();
  renderAppEcosystem();
  announceToAriaScreenReader("Transaction successfully written to data vault.");
}

function triggerInlineRowModifications(id) {
  const state = StateManager.getState();
  const targetTx = state.transactions.find(t => t.id === id);
  if (!targetTx) return;

  const currentActiveConversionIndex = FX_INDEX[state.settings.currency];

  document.getElementById('form-record-id').value = targetTx.id;
  document.getElementById('input-description').value = targetTx.description;
  document.getElementById('input-amount').value = (targetTx.amount * currentActiveConversionIndex).toFixed(2);
  document.getElementById('input-date').value = targetTx.date;
  document.getElementById('input-category').value = targetTx.category;

  document.getElementById('form-submit-btn').textContent = "Apply In-Place Mutation";
  document.getElementById('form-cancel-btn').style.display = 'inline-flex';
  
  document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('input-description').focus();
}

function fireDestructiveRecordDeletion(id) {
  if (confirm("Execute removal sequence on targeted dataset row? This operation is permanent.")) {
    StateManager.deleteTransaction(id);
    renderAppEcosystem();
    announceToAriaScreenReader("Record erased from persistent system matrix lines.", "assertive");
  }
}

function clearFormState() {
  document.getElementById('transaction-mutation-form').reset();
  document.getElementById('form-record-id').value = '';
  document.getElementById('err-description').textContent = '';
  document.getElementById('err-amount').textContent = '';
  document.getElementById('err-date').textContent = '';
  document.getElementById('form-submit-btn').textContent = "Commit Transaction";
  document.getElementById('form-cancel-btn').style.display = 'none';
}

function applySettingsModifications() {
  const capVal = document.getElementById('settings-budget-cap').value;
  const currencySelectorVal = document.getElementById('settings-currency-selector').value;

  StateManager.updateSettings(capVal, currencySelectorVal);
  renderAppEcosystem();
  announceToAriaScreenReader("Global environment parameter matrices updated successfully.");
}

function executeDatabaseExport() {
  const state = StateManager.getState();
  const serializedOutputPayloadString = JSON.stringify(state.transactions, null, 2);
  
  const systemDataBlobStream = new Blob([serializedOutputPayloadString], { type: 'application/json' });
  const virtualDownloadLinkAnchor = document.createElement('a');
  
  virtualDownloadLinkAnchor.href = URL.createObjectURL(systemDataBlobStream);
  virtualDownloadLinkAnchor.download = `ledger_manifest_export_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(virtualDownloadLinkAnchor);
  virtualDownloadLinkAnchor.click();
  document.body.removeChild(virtualDownloadLinkAnchor);
  
  announceToAriaScreenReader("Ecosystem memory array packaged and downloaded successfully.");
}

function executeDatabaseIngestion(e) {
  const fileReferencePointer = e.target.files[0];
  if (!fileReferencePointer) return;

  const streamReaderEngine = new FileReader();
  streamReaderEngine.onload = function(evt) {
    try {
      const parsedDataMatrixPayload = JSON.parse(evt.target.result);
      if (validateIncomingJSON(parsedDataMatrixPayload)) {
        StateManager.ingestImportedArray(parsedDataMatrixPayload);
        renderAppEcosystem();
        announceToAriaScreenReader("JSON Database successfully verified and mounted to local storage.");
      } else {
        alert("Verification Failure: JSON payload contains schema architecture errors.");
        announceToAriaScreenReader("Ingestion blocked due to schema field formatting anomalies.", "assertive");
      }
    } catch {
      alert("Syntax Error: Targeted file fails basic JSON parsing parameters.");
    }
  };
  streamReaderEngine.readAsText(fileReferencePointer);
}