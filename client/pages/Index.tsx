import { useState, useRef, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, Search, Target, Zap, BarChart3, Brain, Activity, X, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PredictionSkeleton } from "@/components/PredictionSkeleton";
import { CountUpAnimation } from "@/components/CountUpAnimation";
import { PredictionHistory } from "@/components/PredictionHistory";
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

        {/* Loading State */}
        {loading && <PredictionSkeleton />}

        {/* Prediction Results */}
        {prediction && !loading && (
          <div className="space-y-6 mb-12">
            {/* Main Prediction Card */}
            <Card className={cn(
              "border-2 transition-all duration-500 animate-in slide-in-from-bottom-4",
              prediction.prediction === "BUY" ? "border-success/50 bg-success/5" :
              prediction.prediction === "SELL" ? "border-destructive/50 bg-destructive/5" :
              "border-warning/50 bg-warning/5"
            )}>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center space-x-2 text-2xl animate-in fade-in duration-700">
                  <span className="font-mono tracking-wider">{prediction.symbol}</span>
                  <span className={cn(
                    "flex items-center space-x-1 transition-all duration-300 animate-in zoom-in-50",
                    getPredictionColor(prediction.prediction)
                  )}>
                    <span className="animate-pulse">
                      {getPredictionIcon(prediction.prediction)}
                    </span>
                    <span className="font-bold">{prediction.prediction}</span>
                  </span>
                </CardTitle>
                <CardDescription className="animate-in fade-in duration-500 delay-200">
                  {prediction.timeframe === "today" ? "Today's" : "Tomorrow's"} Trading Recommendation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Confidence Score */}
                  <div className="text-center group">
                    <div className={cn(
                      "text-4xl font-bold mb-2 transition-all duration-500 animate-in zoom-in-75 delay-300",
                      "group-hover:scale-110 transform",
                      getConfidenceColor(prediction.confidence)
                    )}>
                      <CountUpAnimation value={prediction.confidence} />%
                    </div>
                    <p className="text-muted-foreground animate-in fade-in delay-500">Confidence Level</p>
                    <div className={cn(
                      "mt-2 h-2 bg-muted rounded-full overflow-hidden",
                      "animate-in slide-in-from-left delay-700"
                    )}>
                      <div
                        className={cn(
                          "h-full transition-all duration-1000 ease-out",
                          prediction.confidence >= 80 ? "bg-success" :
                          prediction.confidence >= 60 ? "bg-warning" : "bg-destructive"
                        )}
                        style={{ width: `${prediction.confidence}%` }}
                      />
                    </div>
                  </div>

                  {/* Model Accuracy */}
                  <div className="text-center group">
                    <div className="text-4xl font-bold mb-2 text-chart-1 transition-all duration-500 animate-in zoom-in-75 delay-400 group-hover:scale-110 transform">
                      <CountUpAnimation value={prediction.accuracy} />%
                    </div>
                    <p className="text-muted-foreground animate-in fade-in delay-600">Model Accuracy</p>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden animate-in slide-in-from-right delay-800">
                      <div
                        className="h-full bg-chart-1 transition-all duration-1000 ease-out"
                        style={{ width: `${prediction.accuracy}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Analysis Details */}
            <Card className="animate-in slide-in-from-bottom-4 delay-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 animate-in fade-in delay-500">
                  <Activity className="h-5 w-5 animate-pulse" />
                  <span>Technical Analysis</span>
                </CardTitle>
                <CardDescription className="animate-in fade-in delay-600">
                  Key indicators used in the prediction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "RSI", value: prediction.features.rsi, delay: "delay-700" },
                    { label: "Trend", value: prediction.features.trend, delay: "delay-[800ms]" },
                    { label: "Volatility", value: prediction.features.volatility, delay: "delay-[900ms]" },
                    { label: "Volume", value: prediction.features.volume_trend, delay: "delay-[1000ms]" }
                  ].map((item, index) => (
                    <div
                      key={item.label}
                      className={cn(
                        "text-center p-4 rounded-lg bg-muted/50 transition-all duration-300",
                        "hover:bg-muted/70 hover:scale-105 transform",
                        "animate-in slide-in-from-bottom-2",
                        item.delay
                      )}
                    >
                      <div className="text-lg font-semibold mb-1">
                        {typeof item.value === 'number' ?
                          <CountUpAnimation value={item.value} duration={800} /> :
                          item.value
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: Brain,
              iconBg: "bg-primary/10",
              iconColor: "text-primary",
              title: "AI-Powered Analysis",
              description: "Advanced machine learning algorithms analyze multiple technical indicators including RSI, MACD, and Bollinger Bands.",
              delay: "delay-100"
            },
            {
              icon: Target,
              iconBg: "bg-chart-1/10",
              iconColor: "text-chart-1",
              title: "High Accuracy",
              description: "Our models achieve 75-90% accuracy through comprehensive backtesting and continuous learning from market data.",
              delay: "delay-200"
            },
            {
              icon: Zap,
              iconBg: "bg-chart-2/10",
              iconColor: "text-chart-2",
              title: "Real-Time Predictions",
              description: "Get instant trading recommendations for any stock symbol with confidence scores and detailed technical analysis.",
              delay: "delay-300"
            }
          ].map((feature, index) => (
            <Card
              key={feature.title}
              className={cn(
                "transition-all duration-300 hover:shadow-lg hover:scale-105 transform",
                "animate-in slide-in-from-bottom-4",
                feature.delay
              )}
            >
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className={cn("p-2 rounded-lg transition-all duration-300 hover:scale-110", feature.iconBg)}>
                    <feature.icon className={cn("h-6 w-6", feature.iconColor)} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
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
