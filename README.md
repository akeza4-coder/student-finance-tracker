# ApexFinance // Advanced Client-Side Responsive Student Tracker

An accessible, responsive, vanilla web application designed for comprehensive tracking of student financial metrics. Built without external library frameworks, utilizing decoupled architectures and strict WCAG compliant protocols.

## ✨ Engineered Feature Core Matrix

- **Multi-Breakpoint Matrix Fluid Interface:** Custom layouts optimized via mobile-first processing paradigms targeting `360px`, `768px`, and `1024px` viewport view configurations.
- **Dynamic RegEx Query Filter Core:** Interactive input engine leveraging regular expressions with dynamic native context marking tags (`<mark>`).
- **Target Ceiling Tracking Engine:** Live operational budget monitoring linked to a smart `aria-live` status/alert announcement framework.
- **Data Serialization Gateway:** Secure ingestion and verification pipelines using JSON schema standard data tracking configurations.

## 🔍 RegEx Expression Catalog Reference Matrix

| Application Context Target | Expression Pattern Blueprint | Functional Purpose | Testing Case Execution Example |
| :--- | :--- | :--- | :--- |
| **Description/Title Core** | `^\S(?:.*\S)?$` | Eliminates leading/trailing whitespace variations | `  Invalid Spacing ` (Fails) |
| **Numeric Cash Volumes** | `^(0\|[1-9]\d*)(\.\d{1,2})?$` | Validates monetary strings (max 2 decimals) | `45.50` (Passes) |
| **ISO System Datestamps** | `^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$` | Enforces structural YYYY-MM-DD inputs | `2026-06-15` (Passes) |
| **Category Standard Labels**| `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | Allows strings with safe standard interior spaces | `Books-And-Supplies` (Passes) |
| **Duplicate Word Extraction**| `\b(\w+)\s+\1\b` | Flags matching duplicate consecutive tokens | `Insurance Insurance` (Fails) |

## ⌨️ Accessibility Mapping Blueprint

- **`Tab` / `Shift + Tab`**: Cycles focus through interactive elements in natural sequential order.
- **`Space` / `Enter`**: Selects drop-downs, submits forms, triggers actions, and navigates layout links.
- **`Skip to Content Link`**: Instantly bypasses the primary header nav to target the main `#main-content` node directly.
- **`ARIA Live Announcement Core`**: Dynamically notifies screen readers when view states alter, updates occur, or thresholds are exceeded.