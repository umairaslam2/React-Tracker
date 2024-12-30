import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import monthlyData from "../data"

const Dashboard = () => {
  

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return localStorage.getItem("selectedMonth") || "January";
  });
  const [sharesInHand, setSharesInHand] = useState({});
  const [cashInHand, setCashInHand] = useState(0);
  const [amountPurchased, setAmountPurchased] = useState(0);
  const [amountSold, setAmountSold] = useState(0);
  const [profitLoss, setProfitLoss] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [remainingInShares, setRemainingInShares] = useState(0); 
  const calculateSummary = (selectedMonth) => {
    let shares = {};
    let cash = 0;
    let purchased = 0;
    let sold = 0;
    let profitLoss = 0;
    let remainingInShares = 0;
    const transactionsWithProfit = [];
    const allMonths = Object.keys(monthlyData);
    const chart = [];

    for (const month of allMonths) {
      let monthPurchased = 0;
      let monthSold = 0;

      monthlyData[month].forEach((transaction) => {
        const { type, symbol, quantity, price } = transaction;

        if (type === "BUY") {
          if (!shares[symbol]) shares[symbol] = { quantity: 0, totalCost: 0 };
          shares[symbol].quantity += quantity;
          shares[symbol].totalCost += quantity * price;
          cash -= quantity * price;
          purchased += quantity * price;
          monthPurchased += quantity;
        } else if (type === "SELL") {
          if (!shares[symbol] || shares[symbol].quantity < quantity) {
            transactionsWithProfit.push({
              ...transaction,
              profit: "Error: Insufficient Shares",
            });
          } else {
            const avgCost = shares[symbol].totalCost / shares[symbol].quantity;
            const profit = quantity * (price - avgCost);
            shares[symbol].quantity -= quantity;
            shares[symbol].totalCost -= quantity * avgCost;
            cash += quantity * price;
            sold += quantity * price;
            profitLoss += profit;
            monthSold += quantity;
            transactionsWithProfit.push({ ...transaction, profit });
          }
        }
      });

      remainingInShares = purchased - sold;

      chart.push({
        month,
        purchased: monthPurchased,
        sold: monthSold,
      });

      if (month === selectedMonth) break;
    }

    for (const symbol in shares) {
      if (shares[symbol].quantity === 0) delete shares[symbol];
    }

    setSharesInHand(shares);
    setCashInHand(cash);
    setAmountPurchased(purchased);
    setAmountSold(sold);
    setProfitLoss(profitLoss);
    setTransactions(
      monthlyData[selectedMonth].map((t) => {
        const profitEntry = transactionsWithProfit.find((tp) => tp.date === t.date && tp.symbol === t.symbol);
        return profitEntry ? { ...t, profit: profitEntry.profit } : t;
      })
    );
    setChartData(chart);
    setRemainingInShares(remainingInShares);  
  };

  useEffect(() => {
    calculateSummary(selectedMonth);
    localStorage.setItem("selectedMonth", selectedMonth);
  }, [selectedMonth]);

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", backgroundColor: "#f5f5f5", color: "#333" }}>
      <h2 style={{ textAlign: "center", color: "#333" }}>Stock Dashboard</h2>
      <div style={{ marginBottom: "20px" }}>
        <label>Select Month: </label>
        <select
          value={selectedMonth}
          onChange={handleMonthChange}
          style={{
            padding: "5px",
            fontSize: "16px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        >
          {Object.keys(monthlyData).map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#fff", borderRadius: "5px" }}>
        <h3>Summary for {selectedMonth}</h3>
        <p><strong>Amount Purchased:</strong> ${amountPurchased.toFixed(2)}</p>
        <p><strong>Amount Sold:</strong> ${amountSold.toFixed(2)}</p>
        <p><strong>Profit/Loss:</strong> ${profitLoss.toFixed(2)}</p>
        <p><strong>Amount Remaining in Shares:</strong> ${remainingInShares.toFixed(2)}</p> {/* Updated calculation */}
        <p><strong>Shares Remaining:</strong> {Object.entries(sharesInHand).map(([symbol, { quantity }]) => `${symbol}: ${quantity}`).join(", ")}</p>
      </div>
      <table
        border="1"
        style={{
          width: "100%",
          textAlign: "center",
          borderCollapse: "collapse",
          border: "1px solid #ccc",
          backgroundColor: "#fff",
          color: "#333",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#e0e0e0" }}>
            <th>Date</th>
            <th>Symbol</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>Purchase Price</th>
            <th>Selling Price</th>
            <th>Total</th>
            <th>Profit/Loss</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, index) => (
            <tr key={index} style={{ borderBottom: "1px solid #ccc" }}>
              <td>{t.date}</td>
              <td>{t.symbol}</td>
              <td style={{ color: t.type === "BUY" ? "green" : "red" }}>{t.type}</td>
              <td>{t.quantity}</td>
              <td>${t.type === "BUY" ? t.price.toFixed(2) : "-"}</td>
              <td>${t.type === "SELL" ? t.price.toFixed(2) : "-"}</td>
              <td>${(t.quantity * t.price).toFixed(2)}</td>
              <td style={{ color: typeof t.profit === "number" && t.profit > 0 ? "green" : "red" }}>
                {t.profit && typeof t.profit === "number" ? `$${t.profit.toFixed(2)}` : t.profit || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <BarChart
        width={600}
        height={300}
        data={chartData}
        style={{ marginTop: "20px", backgroundColor: "#fff", padding: "10px", borderRadius: "5px" }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="purchased" fill="#8884d8" />
        <Bar dataKey="sold" fill="#82ca9d" />
      </BarChart>
    </div>
  );
};

export default Dashboard;
