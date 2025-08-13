import { useState, useRef, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, Search, Target, Zap, BarChart3, Brain, Activity, X, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PredictionSkeleton } from "@/components/PredictionSkeleton";
import { searchStocks, POPULAR_STOCKS } from "@/lib/stockSuggestions";
import { cn } from "@/lib/utils";

interface PredictionResult {
  symbol: string;
  prediction: "BUY" | "SELL" | "HOLD";
  confidence: number;
  accuracy: number;
  timeframe: "today" | "tomorrow";
  features: {
    rsi: number;
    trend: string;
    volatility: string;
    volume_trend: string;
  };
}

export default function Index() {
  const [symbol, setSymbol] = useState("");
  const [timeframe, setTimeframe] = useState<"today" | "tomorrow">("tomorrow");
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<typeof POPULAR_STOCKS>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentStockSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        // Ignore invalid JSON
      }
    }
  }, []);

  // Handle clicks outside suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePredict = async () => {
    const trimmedSymbol = symbol.trim().toUpperCase();
    if (!trimmedSymbol) {
      setError("Please enter a stock symbol");
      return;
    }

    setLoading(true);
    setError("");
    setShowSuggestions(false);

    // Add to recent searches
    const newRecentSearches = [trimmedSymbol, ...recentSearches.filter(s => s !== trimmedSymbol)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentStockSearches', JSON.stringify(newRecentSearches));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: trimmedSymbol,
          timeframe
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get prediction");
      }

      const result = await response.json();
      setPrediction(result);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError("Request timed out. Please try again.");
        } else {
          setError(err.message);
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !showSuggestions) {
      handlePredict();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setSymbol(value);

    if (value.trim()) {
      const searchResults = searchStocks(value);
      setSuggestions(searchResults);
      setShowSuggestions(searchResults.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (stockSymbol: string) => {
    setSymbol(stockSymbol);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const clearError = () => {
    setError("");
  };

  const getPredictionColor = (pred: string) => {
    switch (pred) {
      case "BUY": return "text-success";
      case "SELL": return "text-destructive";
      default: return "text-warning";
    }
  };

  const getPredictionIcon = (pred: string) => {
    switch (pred) {
      case "BUY": return <TrendingUp className="h-5 w-5" />;
      case "SELL": return <TrendingDown className="h-5 w-5" />;
      default: return <Minus className="h-5 w-5" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-success";
    if (confidence >= 60) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">TradePredict AI</h1>
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Brain className="h-3 w-3" />
              <span>ML Powered</span>
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            AI-Powered Stock Prediction
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get tomorrow's trading signals with advanced machine learning analysis. 
            Enter any stock symbol and receive instant buy/sell recommendations.
          </p>

          {/* Search Interface */}
          <Card className="max-w-lg mx-auto mb-8">
            <CardContent className="p-6">
              {/* Timeframe Selection */}
              <div className="mb-4">
                <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as "today" | "tomorrow")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="today" className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Today</span>
                    </TabsTrigger>
                    <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="relative mb-4">
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Input
                      ref={inputRef}
                      placeholder="Enter stock symbol (e.g., AAPL, RELIANCE, TCS)"
                      value={symbol}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      onFocus={() => {
                        if (symbol.trim()) {
                          const searchResults = searchStocks(symbol);
                          setSuggestions(searchResults);
                          setShowSuggestions(searchResults.length > 0);
                        }
                      }}
                      className="pr-8"
                      autoComplete="off"
                    />
                    {symbol && (
                      <button
                        onClick={() => {
                          setSymbol("");
                          setShowSuggestions(false);
                          inputRef.current?.focus();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div
                        ref={suggestionsRef}
                        className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
                      >
                        {suggestions.map((stock) => (
                          <button
                            key={stock.symbol}
                            onClick={() => handleSuggestionClick(stock.symbol)}
                            className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center justify-between group"
                          >
                            <div>
                              <div className="font-medium">{stock.symbol}</div>
                              <div className="text-xs text-muted-foreground">{stock.name}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {stock.market}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handlePredict}
                    disabled={loading || !symbol.trim()}
                    size="icon"
                    className="shrink-0"
                  >
                    {loading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && !showSuggestions && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Recent searches:</p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => {
                          setSymbol(search);
                          inputRef.current?.focus();
                        }}
                        className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <Alert className="border-destructive/50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{error}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearError}
                      className="h-auto p-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Prediction Results */}
        {prediction && (
          <div className="space-y-6 mb-12">
            {/* Main Prediction Card */}
            <Card className="border-2">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
                  <span>{prediction.symbol}</span>
                  <span className={cn("flex items-center space-x-1", getPredictionColor(prediction.prediction))}>
                    {getPredictionIcon(prediction.prediction)}
                    <span>{prediction.prediction}</span>
                  </span>
                </CardTitle>
                <CardDescription>
                  {prediction.timeframe === "today" ? "Today's" : "Tomorrow's"} Trading Recommendation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Confidence Score */}
                  <div className="text-center">
                    <div className={cn("text-4xl font-bold mb-2", getConfidenceColor(prediction.confidence))}>
                      {prediction.confidence}%
                    </div>
                    <p className="text-muted-foreground">Confidence Level</p>
                  </div>

                  {/* Model Accuracy */}
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2 text-chart-1">
                      {prediction.accuracy}%
                    </div>
                    <p className="text-muted-foreground">Model Accuracy</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Analysis Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Technical Analysis</span>
                </CardTitle>
                <CardDescription>Key indicators used in the prediction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-lg font-semibold mb-1">{prediction.features.rsi}</div>
                    <div className="text-sm text-muted-foreground">RSI</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-lg font-semibold mb-1">{prediction.features.trend}</div>
                    <div className="text-sm text-muted-foreground">Trend</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-lg font-semibold mb-1">{prediction.features.volatility}</div>
                    <div className="text-sm text-muted-foreground">Volatility</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-lg font-semibold mb-1">{prediction.features.volume_trend}</div>
                    <div className="text-sm text-muted-foreground">Volume</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">AI-Powered Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced machine learning algorithms analyze multiple technical indicators including RSI, MACD, and Bollinger Bands.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-chart-1/10 rounded-lg">
                  <Target className="h-6 w-6 text-chart-1" />
                </div>
                <CardTitle className="text-lg">High Accuracy</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Our models achieve 75-90% accuracy through comprehensive backtesting and continuous learning from market data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-chart-2/10 rounded-lg">
                  <Zap className="h-6 w-6 text-chart-2" />
                </div>
                <CardTitle className="text-lg">Real-Time Predictions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Get instant trading recommendations for any stock symbol with confidence scores and detailed technical analysis.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Disclaimer:</strong> This is for educational purposes only. Stock trading involves risk and predictions should not be considered as financial advice. 
              Always conduct your own research and consider consulting with a financial advisor before making investment decisions.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
