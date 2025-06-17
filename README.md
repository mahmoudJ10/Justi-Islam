# Justi-Islam
# 🕌 Inheritance & Zakat Calculator (Jordanian Law)

This is a **web-based application** that helps users calculate:
1. **Islamic inheritance shares** based on **Jordanian Personal Status Law**.
2. **Zakat obligation** based on the real-time price of gold.

---

## 📌 Features

### ⚖️ Inheritance Calculator
- Calculates shares for all primary heirs: father, mother, grandparents, children, spouses, siblings, etc.
- Follows the official **Jordanian Personal Status Law**.
- Includes Arabic legal references for every calculated share.
- Handles complex scenarios, including partial shares, residuary (ʿaṣaba) distribution, and exclusion cases.

### 💰 Zakat Calculator
- Calculates annual Zakat on **gold, cash, and other assets**.
- Automatically fetches the **live price of gold (24k)** for accurate Nisab threshold comparison.
- Supports both Arabic and English inputs.

---

## 🚨 Important Notice

> ⚠️ **Gold price is fetched via a limited external API**.  
> API calls are subject to rate limits. You may experience delays or fallback to cached data if the limit is exceeded.

To avoid hitting rate limits:
- Do not refresh the page repeatedly.
- Use the gold price feature sparingly when testing.

---

## 🛠 Technologies Used

- **Frontend:** HTML, CSS, JavaScript
- **External APIs:** Gold price data provider => goldapi.io/api 

---

## 🧾 Legal References

All inheritance calculations are based on:
- **Jordanian Personal Status Law (قانون الأحوال الشخصية الأردني)**  
  Including Articles related to shares of:
  - Parents
  - Grandparents
  - Spouses
  - Children and grandchildren
  - Siblings (full, paternal, and maternal)
  - Exclusion and residuary rules

---

## 📦 Future Enhancements

- Add support for **ذوي الأرحام** (extended relatives not currently covered).
- Add optional **estate expense calculator** (debts, funeral costs, will up to 1/3).
- Export reports in PDF.
- Multi-language support.

---

## 📬 Contact & Contributions

Contributions and suggestions are welcome.  
Please contact us via GitHub issues or email for bugs, feature requests, or collaboration proposals.

---

## 🧑‍⚖️ Disclaimer

This tool is intended for **educational and planning purposes** only.  
Always consult a qualified scholar or legal expert for final inheritance rulings.

