import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
    { value: "paye", label: "PAYE (Pay As You Earn)", description: "Personal income tax for employees" },
    { value: "vat", label: "VAT (Value Added Tax)", description: "7.5% on goods and services" },
    { value: "cit", label: "CIT (Company Income Tax)", description: "30% on company profits" },
    { value: "withholding", label: "Withholding Tax", description: "Various rates on payments" },
  ];

  const calculatePAYE = (grossIncome: number) => {
    const breakdown: string[] = [];

    breakdown.push(`Gross Income: ₦${grossIncome.toLocaleString()}`);

    // Tax-Free Allowance = Higher of ₦200,000 or (1% + 20% of Gross Income)
    const percentageAllowance = (grossIncome * 0.01) + (grossIncome * 0.20);
    const taxFreeAllowance = Math.max(200000, percentageAllowance);
    breakdown.push(`Tax-Free Allowance: ₦${Math.round(taxFreeAllowance).toLocaleString()}`);
    breakdown.push(`  (Higher of ₦200,000 or 21% of income)`);

    const taxableIncome = Math.max(0, grossIncome - taxFreeAllowance);
    breakdown.push(`Taxable Income: ₦${Math.round(taxableIncome).toLocaleString()}`);
    breakdown.push(``);
    breakdown.push(`Progressive Tax Calculation:`);

    // Progressive tax rates
    let tax = 0;
    let remaining = taxableIncome;

    const bands = [
      { limit: 300000, rate: 0.07, label: "First ₦300,000" },
      { limit: 300000, rate: 0.11, label: "Next ₦300,000" },
      { limit: 500000, rate: 0.15, label: "Next ₦500,000" },
      { limit: 500000, rate: 0.19, label: "Next ₦500,000" },
      { limit: 1600000, rate: 0.21, label: "Next ₦1,600,000" },
      { limit: Infinity, rate: 0.24, label: "Above ₦3,200,000" }
    ];

    for (const band of bands) {
      if (remaining <= 0) break;

      const bandAmount = Math.min(remaining, band.limit);
      const bandTax = bandAmount * band.rate;
      tax += bandTax;

      if (bandAmount > 0) {
        breakdown.push(`  ${band.label} @ ${(band.rate * 100)}%: ₦${Math.round(bandTax).toLocaleString()}`);
      }

      remaining -= bandAmount;
    }

    breakdown.push(``);
    breakdown.push(`Total PAYE Tax: ₦${Math.round(tax).toLocaleString()}`);

    return { tax: Math.round(tax), breakdown };
  };

  const calculateVAT = (salesAmount: number) => {
    // VAT = Output VAT - Input VAT (assuming no input VAT for simplification)
    const vatRate = 0.075; // 7.5% VAT rate in Nigeria
    const outputVAT = salesAmount * vatRate;

    const breakdown: string[] = [
      `Sales/Revenue: ₦${salesAmount.toLocaleString()}`,
      `VAT Rate: 7.5%`,
      ``,
      `Output VAT (7.5% of Sales): ₦${Math.round(outputVAT).toLocaleString()}`,
      `Less: Input VAT: ₦0 (not included)`,
      ``,
      `VAT Payable: ₦${Math.round(outputVAT).toLocaleString()}`
    ];

    return { tax: Math.round(outputVAT), breakdown };
  };

  const calculateCIT = (taxableProfit: number) => {
    // CIT rates based on company turnover
    let citRate: number;
    let rateDescription: string;

    if (taxableProfit < 25000000) {
      citRate = 0; // Small companies below ₦25m
      rateDescription = "Small Company (Below ₦25m turnover): 0%";
    } else if (taxableProfit < 100000000) {
      citRate = 0.20; // Medium companies ₦25m - ₦100m
      rateDescription = "Medium Company (₦25m - ₦100m turnover): 20%";
    } else {
      citRate = 0.30; // Large companies above ₦100m
      rateDescription = "Large Company (Above ₦100m turnover): 30%";
    }

    const cit = taxableProfit * citRate;

    const breakdown: string[] = [
      `Taxable Profit: ₦${taxableProfit.toLocaleString()}`,
      ``,
      rateDescription,
      ``,
      `CIT Amount: ₦${Math.round(cit).toLocaleString()}`
    ];

    return { tax: Math.round(cit), breakdown };
  };

  const calculateWithholding = (paymentAmount: number) => {
    // WHT rates vary by payment type - using 5% for contracts/services
    const whtRate = 0.05; // 5% for contracts, commissions, consultancy, professional services
    const wht = paymentAmount * whtRate;

    const breakdown: string[] = [
      `Payment Amount: ₦${paymentAmount.toLocaleString()}`,
      `Payment Type: Contracts/Professional Services`,
      `WHT Rate: 5%`,
      ``,
      `WHT to be Deducted: ₦${Math.round(wht).toLocaleString()}`,
      `Net Payment to Supplier: ₦${Math.round(paymentAmount - wht).toLocaleString()}`,
      ``,
      `Note: Other WHT rates apply:`,
      `  • Dividends, Interest, Rent: 10%`,
      `  • This WHT is an advance tax payment`
    ];

    return { tax: Math.round(wht), breakdown };
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
