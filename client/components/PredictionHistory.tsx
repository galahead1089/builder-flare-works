import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, TrendingUp, TrendingDown, Minus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoricalPrediction {
  id: string;
  symbol: string;
  prediction: "BUY" | "SELL" | "HOLD";
  confidence: number;
  timeframe: "today" | "tomorrow";
  timestamp: number;
}

export function PredictionHistory() {
  const [history, setHistory] = useState<HistoricalPrediction[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("predictionHistory");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        // Ignore invalid JSON
      }
    }
  }, []);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("predictionHistory");
  };

  const getPredictionIcon = (pred: string) => {
    switch (pred) {
      case "BUY":
        return <TrendingUp className="h-3 w-3" />;
      case "SELL":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getPredictionColor = (pred: string) => {
    switch (pred) {
      case "BUY":
        return "text-success border-success/20 bg-success/10";
      case "SELL":
        return "text-destructive border-destructive/20 bg-destructive/10";
      default:
        return "text-warning border-warning/20 bg-warning/10";
    }
  };

  const calculateSuccessRate = () => {
    if (history.length === 0) return 0;

    // Simple mock success rate calculation based on confidence
    const totalConfidence = history.reduce(
      (sum, pred) => sum + pred.confidence,
      0,
    );
    return Math.round(totalConfidence / history.length);
  };

  if (history.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Prediction History</span>
            <Badge variant="outline">
              {history.length} prediction{history.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20">
              {calculateSuccessRate()}% avg confidence
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isVisible ? "Hide" : "Show"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isVisible && (
        <CardContent>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {history
              .slice()
              .reverse()
              .map((pred) => (
                <div
                  key={pred.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "flex items-center space-x-1",
                        getPredictionColor(pred.prediction),
                      )}
                    >
                      {getPredictionIcon(pred.prediction)}
                      <span>{pred.prediction}</span>
                    </Badge>
                    <span className="font-medium">{pred.symbol}</span>
                    <Badge variant="secondary" className="text-xs">
                      {pred.timeframe}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                    <span>{pred.confidence}% confidence</span>
                    <span>{new Date(pred.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
