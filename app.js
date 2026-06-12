const suggestedPortfolio = [
  {
    id: "cdb105",
    name: "CDB liquidez diaria 105% CDI",
    detail: "Banco A - emissor diferente, com cobertura do FGC",
    type: "cdi",
    factor: 1.05,
    annualFee: 0,
    allocation: 0.35,
  },
  {
    id: "cdb110",
    name: "CDB liquidez diaria 110% CDI",
    detail: "Banco B - maior retorno, tambem limitado ao FGC",
    type: "cdi",
    factor: 1.1,
    annualFee: 0,
    allocation: 0.25,
  },
  {
    id: "tesouro",
    name: "Tesouro Selic",
    detail: "Titulo publico federal pos-fixado pela Selic",
    type: "selic",
    factor: 1,
    annualFee: 0.002,
    allocation: 0.3,
  },
  {
    id: "fundoDi",
    name: "Fundo DI conservador",
    detail: "Fundo de liquidez diaria, baixa taxa e carteira pos-fixada",
    type: "cdi",
    factor: 0.995,
    annualFee: 0.002,
    allocation: 0.1,
  },
];

let portfolio = [];

const fields = {
  initialAmount: document.querySelector("#initialAmount"),
  startDate: document.querySelector("#startDate"),
  endDate: document.querySelector("#endDate"),
  cdiRate: document.querySelector("#cdiRate"),
  selicRate: document.querySelector("#selicRate"),
  taxRate: document.querySelector("#taxRate"),
  finalValue: document.querySelector("#finalValue"),
  netProfit: document.querySelector("#netProfit"),
  netReturn: document.querySelector("#netReturn"),
  businessDays: document.querySelector("#businessDays"),
  effectiveDate: document.querySelector("#effectiveDate"),
  portfolioRows: document.querySelector("#portfolioRows"),
  allocationChart: document.querySelector("#allocationChart"),
  evolutionRows: document.querySelector("#evolutionRows"),
  evolutionChart: document.querySelector("#evolutionChart"),
  resetPortfolio: document.querySelector("#resetPortfolio"),
};

const holidays = new Set(["2026-06-04"]);
const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const percentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const decimalFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isBusinessDay(date) {
  const weekday = date.getUTCDay();
  return weekday !== 0 && weekday !== 6 && !holidays.has(toIsoDate(date));
}

function nextBusinessDay(date) {
  let current = new Date(date);
  while (!isBusinessDay(current)) {
    current = addDays(current, 1);
  }
  return current;
}

function businessDatesBetween(start, end) {
  const dates = [];
  if (end < start) return dates;

  let current = new Date(start);
  while (current <= end) {
    if (isBusinessDay(current)) {
      dates.push(new Date(current));
    }
    current = addDays(current, 1);
  }
  return dates;
}

function readAssumptions() {
  return {
    initialAmount: Number(fields.initialAmount.value) || 0,
    startDate: parseDate(fields.startDate.value),
    endDate: parseDate(fields.endDate.value),
    cdiRate: (Number(fields.cdiRate.value) || 0) / 100,
    selicRate: (Number(fields.selicRate.value) || 0) / 100,
    taxRate: (Number(fields.taxRate.value) || 0) / 100,
  };
}

function resetPortfolioAmounts() {
  const { initialAmount } = readAssumptions();
  portfolio = suggestedPortfolio.map((asset) => ({
    ...asset,
    amount: roundCurrency(initialAmount * asset.allocation),
  }));
  render();
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

function annualRateFor(asset, assumptions) {
  const baseRate = asset.type === "selic" ? assumptions.selicRate : assumptions.cdiRate;
  return Math.max(0, baseRate * asset.factor - asset.annualFee);
}

function calculateAsset(asset, businessDays, assumptions) {
  const annualRate = annualRateFor(asset, assumptions);
  const grossReturn = Math.pow(1 + annualRate, businessDays / 252) - 1;
  const grossProfit = asset.amount * grossReturn;
  const tax = grossProfit * assumptions.taxRate;
  const netProfit = grossProfit - tax;

  return {
    ...asset,
    annualRate,
    grossReturn,
    grossProfit,
    tax,
    netProfit,
    finalAmount: asset.amount + netProfit,
  };
}

function calculatePortfolio(businessDays, assumptions) {
  const assets = portfolio.map((asset) => calculateAsset(asset, businessDays, assumptions));
  const invested = assets.reduce((sum, asset) => sum + asset.amount, 0);
  const grossProfit = assets.reduce((sum, asset) => sum + asset.grossProfit, 0);
  const tax = assets.reduce((sum, asset) => sum + asset.tax, 0);
  const netProfit = assets.reduce((sum, asset) => sum + asset.netProfit, 0);
  const finalAmount = invested + netProfit;

  return {
    assets,
    invested,
    grossProfit,
    tax,
    netProfit,
    finalAmount,
    netReturn: invested > 0 ? netProfit / invested : 0,
  };
}

function describeRate(asset) {
  if (asset.type === "selic") {
    return `Selic - ${decimalFormatter.format(asset.annualFee * 100)}% a.a. custodia`;
  }

  if (asset.annualFee > 0) {
    return `${decimalFormatter.format(asset.factor * 100)}% CDI - ${decimalFormatter.format(
      asset.annualFee * 100,
    )}% a.a. taxa`;
  }

  return `${decimalFormatter.format(asset.factor * 100)}% do CDI`;
}

function render() {
  const assumptions = readAssumptions();
  const effectiveStart = nextBusinessDay(assumptions.startDate);
  const businessDates = businessDatesBetween(effectiveStart, assumptions.endDate);
  const businessDays = businessDates.length;
  const result = calculatePortfolio(businessDays, assumptions);

  fields.finalValue.textContent = moneyFormatter.format(result.finalAmount);
  fields.netProfit.textContent = moneyFormatter.format(result.netProfit);
  fields.netReturn.textContent = percentFormatter.format(result.netReturn);
  fields.businessDays.textContent = String(businessDays);
  fields.effectiveDate.textContent = `Aplicacao efetiva: ${dateFormatter.format(effectiveStart)}`;

  renderPortfolioRows(result.assets);
  renderAllocationChart(result.assets, result.invested);
  renderEvolution(businessDates, assumptions);
}

function renderPortfolioRows(assets) {
  fields.portfolioRows.replaceChildren();

  assets.forEach((asset) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const amountCell = document.createElement("td");
    const rateCell = document.createElement("td");
    const profitCell = document.createElement("td");
    const finalCell = document.createElement("td");

    const name = document.createElement("strong");
    name.textContent = asset.name;
    const detail = document.createElement("small");
    detail.textContent = asset.detail;
    nameCell.append(name, detail);

    const amountInput = document.createElement("input");
    amountInput.className = "amount-input";
    amountInput.type = "number";
    amountInput.min = "0";
    amountInput.step = "1000";
    amountInput.value = String(roundCurrency(asset.amount));
    amountInput.addEventListener("input", () => {
      const target = portfolio.find((item) => item.id === asset.id);
      if (target) {
        target.amount = Number(amountInput.value) || 0;
        render();
      }
    });
    amountCell.append(amountInput);

    rateCell.textContent = describeRate(asset);
    profitCell.className = "positive";
    profitCell.textContent = moneyFormatter.format(asset.netProfit);
    finalCell.textContent = moneyFormatter.format(asset.finalAmount);

    row.append(nameCell, amountCell, rateCell, profitCell, finalCell);
    fields.portfolioRows.append(row);
  });
}

function renderAllocationChart(assets, invested) {
  fields.allocationChart.replaceChildren();

  assets.forEach((asset) => {
    const percent = invested > 0 ? asset.amount / invested : 0;
    const row = document.createElement("div");
    row.className = "bar-row";

    const label = document.createElement("div");
    label.className = "bar-label";

    const name = document.createElement("span");
    name.textContent = asset.name;
    const value = document.createElement("strong");
    value.textContent = percentFormatter.format(percent);
    label.append(name, value);

    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${Math.max(0, Math.min(100, percent * 100))}%`;
    track.append(fill);

    row.append(label, track);
    fields.allocationChart.append(row);
  });
}

function renderEvolution(businessDates, assumptions) {
  const data = businessDates.map((date, index) => {
    const result = calculatePortfolio(index + 1, assumptions);
    return {
      date,
      businessDays: index + 1,
      value: result.finalAmount,
    };
  });

  renderEvolutionTable(data);
  renderEvolutionChart(data);
}

function renderEvolutionTable(data) {
  fields.evolutionRows.replaceChildren();

  data.forEach((item) => {
    const row = document.createElement("tr");
    const dateCell = document.createElement("td");
    const daysCell = document.createElement("td");
    const valueCell = document.createElement("td");

    dateCell.textContent = dateFormatter.format(item.date);
    daysCell.textContent = String(item.businessDays);
    valueCell.textContent = moneyFormatter.format(item.value);

    row.append(dateCell, daysCell, valueCell);
    fields.evolutionRows.append(row);
  });
}

function renderEvolutionChart(data) {
  const svg = fields.evolutionChart;
  svg.replaceChildren();
  svg.setAttribute("viewBox", "0 0 820 280");

  if (data.length === 0) {
    const empty = svgText(410, 140, "Selecione uma data de avaliacao posterior ao inicio.");
    empty.setAttribute("text-anchor", "middle");
    svg.append(empty);
    return;
  }

  const width = 820;
  const height = 280;
  const padding = { top: 22, right: 26, bottom: 42, left: 86 };
  const values = data.map((item) => item.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(1, maxValue - minValue);

  const pointFor = (item, index) => {
    const x =
      padding.left +
      (data.length === 1 ? 0.5 : index / (data.length - 1)) *
        (width - padding.left - padding.right);
    const y =
      height -
      padding.bottom -
      ((item.value - minValue) / range) * (height - padding.top - padding.bottom);
    return [x, y];
  };

  const points = data.map(pointFor);
  const linePath = points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L ${points.at(-1)[0].toFixed(2)} ${
    height - padding.bottom
  } L ${points[0][0].toFixed(2)} ${height - padding.bottom} Z`;

  svg.append(svgLine(padding.left, height - padding.bottom, width - padding.right, height - padding.bottom));
  svg.append(svgLine(padding.left, padding.top, padding.left, height - padding.bottom));

  const area = svgPath(areaPath, "chart-area");
  const line = svgPath(linePath, "chart-line");
  svg.append(area, line);

  const first = data[0];
  const last = data.at(-1);
  svg.append(svgLabel(padding.left, height - 14, dateFormatter.format(first.date), "start"));
  svg.append(svgLabel(width - padding.right, height - 14, dateFormatter.format(last.date), "end"));
  svg.append(svgLabel(12, padding.top + 6, moneyFormatter.format(maxValue), "start"));
  svg.append(svgLabel(12, height - padding.bottom, moneyFormatter.format(minValue), "start"));

  [points[0], points.at(-1)].forEach(([x, y]) => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("class", "chart-dot");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", "5");
    svg.append(dot);
  });
}

function svgPath(d, className) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("class", className);
  return path;
}

function svgLine(x1, y1, x2, y2) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", "#cbd8d1");
  line.setAttribute("stroke-width", "2");
  return line;
}

function svgText(x, y, text) {
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x", x);
  label.setAttribute("y", y);
  label.setAttribute("class", "axis-label");
  label.textContent = text;
  return label;
}

function svgLabel(x, y, text, anchor) {
  const label = svgText(x, y, text);
  label.setAttribute("text-anchor", anchor);
  return label;
}

[
  fields.startDate,
  fields.endDate,
  fields.cdiRate,
  fields.selicRate,
  fields.taxRate,
].forEach((field) => field.addEventListener("input", render));

fields.initialAmount.addEventListener("input", resetPortfolioAmounts);
fields.resetPortfolio.addEventListener("click", resetPortfolioAmounts);

resetPortfolioAmounts();
