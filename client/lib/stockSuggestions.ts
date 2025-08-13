export const POPULAR_STOCKS = [
  // US Stocks
  { symbol: "AAPL", name: "Apple Inc.", market: "US" },
  { symbol: "MSFT", name: "Microsoft Corporation", market: "US" },
  { symbol: "GOOGL", name: "Alphabet Inc.", market: "US" },
  { symbol: "AMZN", name: "Amazon.com Inc.", market: "US" },
  { symbol: "TSLA", name: "Tesla Inc.", market: "US" },
  { symbol: "NVDA", name: "NVIDIA Corporation", market: "US" },
  { symbol: "META", name: "Meta Platforms Inc.", market: "US" },
  { symbol: "NFLX", name: "Netflix Inc.", market: "US" },
  { symbol: "BABA", name: "Alibaba Group", market: "US" },
  { symbol: "V", name: "Visa Inc.", market: "US" },
  
  // Indian Stocks
  { symbol: "RELIANCE", name: "Reliance Industries Ltd.", market: "IN" },
  { symbol: "TCS", name: "Tata Consultancy Services", market: "IN" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd.", market: "IN" },
  { symbol: "INFY", name: "Infosys Ltd.", market: "IN" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd.", market: "IN" },
  { symbol: "ITC", name: "ITC Ltd.", market: "IN" },
  { symbol: "SBIN", name: "State Bank of India", market: "IN" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd.", market: "IN" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", market: "IN" },
  { symbol: "LT", name: "Larsen & Toubro Ltd.", market: "IN" },
  { symbol: "ASIANPAINT", name: "Asian Paints Ltd.", market: "IN" },
  { symbol: "MARUTI", name: "Maruti Suzuki India", market: "IN" },
  { symbol: "AXISBANK", name: "Axis Bank Ltd.", market: "IN" },
  { symbol: "HCLTECH", name: "HCL Technologies Ltd.", market: "IN" },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement Ltd.", market: "IN" },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", market: "IN" },
  { symbol: "TITAN", name: "Titan Company Ltd.", market: "IN" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd.", market: "IN" },
  { symbol: "NESTLEIND", name: "Nestle India Ltd.", market: "IN" },
  { symbol: "WIPRO", name: "Wipro Ltd.", market: "IN" }
];

export function searchStocks(query: string) {
  if (!query.trim()) return [];
  
  const searchTerm = query.toLowerCase();
  return POPULAR_STOCKS
    .filter(stock => 
      stock.symbol.toLowerCase().includes(searchTerm) ||
      stock.name.toLowerCase().includes(searchTerm)
    )
    .slice(0, 8); // Limit to 8 suggestions
}
