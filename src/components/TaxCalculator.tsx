import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  calculatePAYE2026, 
  calculateVAT2026, 
  calculateCIT2026, 
  calculateWithholdingTax2026,
  formatTaxBreakdown 
} from "@/lib/nigerian-tax-2026";

interface TaxCalculatorProps {
  onCalculated: (taxAmount: number, income: number, breakdown: string[], taxType: string) => void;
}

const TaxCalculator = ({ onCalculated }: TaxCalculatorProps) => {
  const [income, setIncome] = useState("");
  const [taxType, setTaxType] = useState("paye");
  const [taxAmount, setTaxAmount] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [taxBreakdown, setTaxBreakdown] = useState<string[]>([]);

  const taxTypes = [
    { value: "paye", label: "PAYE (Pay As You Earn) - 2026 Rates", description: "Personal income tax with new progressive rates" },
    { value: "vat", label: "VAT (Value Added Tax)", description: "7.5% on goods and services (expanded exemptions)" },
    { value: "cit", label: "CIT (Company Income Tax)", description: "Progressive rates based on company size" },
    { value: "withholding", label: "Withholding Tax", description: "Various rates on payments" },
  ];

  const calculatePAYE = (grossIncome: number) => {
    // Use 2026 tax rates
    const result = calculatePAYE2026(grossIncome);
    const breakdown = formatTaxBreakdown(result);
    
    return { tax: result.totalTax, breakdown };
  };

  const calculateVAT = (salesAmount: number) => {
    // Use 2026 VAT calculation (with exemptions support)
    const result = calculateVAT2026(salesAmount, false);
    
    const breakdown: string[] = [
      `Sales/Revenue: ₦${salesAmount.toLocaleString()}`,
      `VAT Rate: ${(result.vatRate * 100).toFixed(1)}%`,
      ``,
      result.exempt 
        ? `This transaction is VAT exempt (2026 expanded exemptions)`
        : `Output VAT (${(result.vatRate * 100).toFixed(1)}% of Sales): ₦${result.vatAmount.toLocaleString()}`,
      ``,
      `VAT Payable: ₦${result.vatAmount.toLocaleString()}`,
      ``,
      `Note: VAT exemptions apply to food, rent, education, healthcare, and public transport`
    ];

    return { tax: result.vatAmount, breakdown };
  };

  const calculateCIT = (taxableProfit: number) => {
    // Use 2026 CIT calculation
    const result = calculateCIT2026(taxableProfit);

    const breakdown: string[] = [
      `Taxable Profit: ₦${taxableProfit.toLocaleString()}`,
      ``,
      result.category,
      ``,
      `CIT Amount: ₦${result.citAmount.toLocaleString()}`
    ];

    return { tax: result.citAmount, breakdown };
  };

  const calculateWithholding = (paymentAmount: number) => {
    // Use 2026 WHT calculation (defaulting to contracts/professional)
    const result = calculateWithholdingTax2026(paymentAmount, 'contracts');

    const breakdown: string[] = [
      `Payment Amount: ₦${paymentAmount.toLocaleString()}`,
      `Payment Type: ${result.paymentType} Services`,
      `WHT Rate: ${(result.whtRate * 100).toFixed(0)}%`,
      ``,
      `WHT to be Deducted: ₦${result.whtAmount.toLocaleString()}`,
      `Net Payment to Supplier: ₦${result.netPayment.toLocaleString()}`,
      ``,
      `Note: Other WHT rates apply (2026):`,
      `  • Dividends, Interest, Rent: 10%`,
      `  • Contracts, Professional Services: 5%`,
      `  • This WHT is an advance tax payment`
    ];

    return { tax: result.whtAmount, breakdown };
  };

  const handleCalculate = () => {
    const incomeValue = parseFloat(income);

    if (isNaN(incomeValue) || incomeValue <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);

    setTimeout(() => {
      let result;

      switch (taxType) {
        case "paye":
          result = calculatePAYE(incomeValue);
          break;
        case "vat":
          result = calculateVAT(incomeValue);
          break;
        case "cit":
          result = calculateCIT(incomeValue);
          break;
        case "withholding":
          result = calculateWithholding(incomeValue);
          break;
        default:
          result = calculatePAYE(incomeValue);
      }

      setTaxAmount(result.tax);
      setTaxBreakdown(result.breakdown);
      
      if (result.tax <= 0) {
        setIsCalculating(false);
        toast({
          title: "No Tax Liability",
          description: "Based on your input, you have no tax liability at this time.",
        });
        return;
      }
      
      onCalculated(result.tax, incomeValue, result.breakdown, taxType);
      setIsCalculating(false);

      toast({
        title: "Tax Calculated",
        description: `Your tax liability: ₦${result.tax.toLocaleString()}`,
      });
    }, 1000);
  };

  return (
    <Card className="shadow-strong border-border/50">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-accent flex items-center justify-center">
            <Calculator className="w-5 h-5 text-accent-foreground" />
          </div>
          <CardTitle>Calculate Your Tax</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="taxType">Tax Type</Label>
            <Select value={taxType} onValueChange={setTaxType}>
              <SelectTrigger>
                <SelectValue placeholder="Select tax type" />
              </SelectTrigger>
              <SelectContent>
                {taxTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="income">
              {taxType === "paye" ? "Annual Income" :
               taxType === "cit" ? "Annual Profit" : "Amount"} (₦)
            </Label>
            <Input
              id="income"
              type="number"
              placeholder="e.g., 2,400,000"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground">
              {taxType === "paye" ? "Enter your total annual income before tax" :
               taxType === "vat" ? "Enter the transaction amount" :
               taxType === "cit" ? "Enter your company's annual profit" :
               "Enter the payment amount subject to withholding"}
            </p>
          </div>

          {taxAmount !== null && (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-gradient-secondary border border-secondary/20">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-secondary-foreground/80 font-medium">Your Tax Liability</p>
                    <p className="text-3xl font-bold text-secondary-foreground">
                      ₦{taxAmount.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-secondary-foreground/60" />
                </div>
              </div>

              {taxBreakdown.length > 0 && (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm font-medium mb-2">Calculation Breakdown:</p>
                  <ul className="space-y-1">
                    {taxBreakdown.map((line, index) => (
                      <li key={index} className="text-xs text-muted-foreground">{line}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <Button
            size="lg"
            onClick={handleCalculate}
            disabled={isCalculating}
            className="w-full"
          >
            {isCalculating ? "Calculating..." : "Calculate Tax"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaxCalculator;
