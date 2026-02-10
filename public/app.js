const stockInForm = document.getElementById("stockInForm");
const receiptForm = document.getElementById("receiptForm");
const stockTable = document.getElementById("stockTable");
const summary = document.getElementById("summary");
const movements = document.getElementById("movements");

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "İşlem başarısız");
  return data;
}

function renderDashboard(data) {
  stockTable.innerHTML = data.items
    .map(
      (item) => `
      <tr>
        <td>${item.category}</td>
        <td>${item.productName}</td>
        <td>${item.quantity}</td>
        <td>${item.unitPrice.toFixed(2)} ₺</td>
        <td>${new Date(item.lastUpdatedAt).toLocaleString("tr-TR")}</td>
      </tr>`
    )
    .join("");

  summary.innerHTML = `
    <p><strong>Toplam Ürün:</strong> ${data.summary.uniqueProducts}</p>
    <p><strong>Toplam Stok Değeri:</strong> ${data.summary.totalStockValue.toFixed(2)} ₺</p>
    <p><strong>Düşük Stok:</strong> ${data.summary.lowStock.map((x) => `${x.productName} (${x.quantity})`).join(", ") || "Yok"}</p>
  `;

  movements.innerHTML = data.movements
    .map(
      (move) => `<li>[${move.type}] ${move.productName} - ${move.quantity} (${new Date(move.createdAt).toLocaleString("tr-TR")})</li>`
    )
    .join("");
}

async function loadDashboard() {
  const data = await request("/api/dashboard");
  renderDashboard(data);
}

stockInForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(stockInForm);
  await request("/api/stock/in", {
    method: "POST",
    body: JSON.stringify({
      items: [
        {
          productName: formData.get("productName"),
          quantity: Number(formData.get("quantity")),
          unitPrice: Number(formData.get("unitPrice"))
        }
      ]
    })
  });
  stockInForm.reset();
  await loadDashboard();
});

receiptForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(receiptForm);
  await request("/api/receipt/analyze", {
    method: "POST",
    body: JSON.stringify({ receiptText: formData.get("receiptText") })
  });
  receiptForm.reset();
  await loadDashboard();
});

loadDashboard().catch((error) => {
  summary.innerHTML = `<p class="error">${error.message}</p>`;
});
