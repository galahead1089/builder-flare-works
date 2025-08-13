import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, Search, Target, Zap, BarChart3, Brain, Activity, Smartphone, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  growwRecommendation?: {
    canBuy: boolean;
    steps: string[];
    notes: string[];
  };
}

export default function Index() {
  const [symbol, setSymbol] = useState("");
  const [timeframe, setTimeframe] = useState<"today" | "tomorrow">("tomorrow");
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePredict = async () => {
    if (!symbol.trim()) {
      setError("Please enter a stock symbol");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: symbol.trim(),
          timeframe
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get prediction");
      }

      const result = await response.json();
      setPrediction(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePredict();
    }
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
                    <TabsTrigger value="today">Today's Prediction</TabsTrigger>
                    <TabsTrigger value="tomorrow">Tomorrow's Prediction</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="Enter stock symbol (e.g., AAPL, RELIANCE, TCS)"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={handlePredict}
                  disabled={loading}
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
              {error && (
                <p className="text-destructive text-sm">{error}</p>
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

            {/* GROWW App Recommendations */}
            {prediction.growwRecommendation && (
              <Card className={cn("border-2", prediction.growwRecommendation.canBuy ? "border-success/50" : "border-warning/50")}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Smartphone className="h-5 w-5" />
                    <span>GROWW App Recommendation</span>
                    {prediction.growwRecommendation.canBuy ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-warning" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    {prediction.growwRecommendation.canBuy
                      ? "Ready to buy on GROWW app"
                      : "Not recommended for purchase"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {prediction.growwRecommendation.canBuy && prediction.growwRecommendation.steps.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 text-success">How to buy on GROWW:</h4>
                      <ol className="space-y-2">
                        {prediction.growwRecommendation.steps.map((step, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                              {index + 1}
                            </span>
                            <span className="text-sm">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {prediction.growwRecommendation.notes.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Important Notes:</h4>
                      <ul className="space-y-2">
                        {prediction.growwRecommendation.notes.map((note, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-warning">•</span>
                            <span className="text-sm text-muted-foreground">{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
