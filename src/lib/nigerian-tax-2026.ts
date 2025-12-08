/**
 * Nigerian Tax Law 2026 Compliance Module
 * Implements the new progressive tax rates effective January 1, 2026
 */

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  label: string;
}

export interface TaxCalculationResult {
  grossIncome: number;
  taxableIncome: number;
  totalTax: number;
  breakdown: TaxBreakdown[];
  effectiveRate: number;
  netIncome: number;
}

export interface TaxBreakdown {
  bracket: string;
  amount: number;
  rate: number;
  tax: number;
}

/**
 * Nigerian Personal Income Tax Rates 2026
 * Effective January 1, 2026
 */
export const NIGERIAN_TAX_BRACKETS_2026: TaxBracket[] = [
  {
    min: 0,
    max: 800000,
    rate: 0.0,
    label: 'First ₦800,000'
  },
  {
    min: 800000,
    max: 3000000,
    rate: 0.15,
    label: 'Next ₦2,200,000'
  },
  {
    min: 3000000,
    max: 12000000,
    rate: 0.18,
    label: 'Next ₦9,000,000'
  },
  {
    min: 12000000,
    max: 25000000,
    rate: 0.21,
    label: 'Next ₦13,000,000'
  },
  {
    min: 25000000,
    max: 50000000,
    rate: 0.23,
    label: 'Next ₦25,000,000'
  },
  {
    min: 50000000,
    max: Infinity,
    rate: 0.25,
    label: 'Above ₦50,000,000'
  }
];

/**
 * Calculate Personal Income Tax (PAYE) according to Nigerian Tax Law 2026
 */
export function calculatePAYE2026(grossIncome: number): TaxCalculationResult {
  const breakdown: TaxBreakdown[] = [];
  let totalTax = 0;
  let remainingIncome = grossIncome;

  for (const bracket of NIGERIAN_TAX_BRACKETS_2026) {
    if (remainingIncome <= 0) break;

    const bracketMin = bracket.min;
    const bracketMax = bracket.max === Infinity ? remainingIncome : bracket.max;
    
    // Calculate taxable amount in this bracket
    const taxableInBracket = Math.max(0, Math.min(remainingIncome, bracketMax - bracketMin));
    
    if (taxableInBracket > 0) {
      const taxInBracket = taxableInBracket * bracket.rate;
      totalTax += taxInBracket;

      breakdown.push({
        bracket: bracket.label,
        amount: taxableInBracket,
        rate: bracket.rate,
        tax: taxInBracket
      });

      remainingIncome -= taxableInBracket;
    }
  }

  const taxableIncome = grossIncome;
  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;
  const netIncome = grossIncome - totalTax;

  return {
    grossIncome,
    taxableIncome,
    totalTax: Math.round(totalTax),
    breakdown,
    effectiveRate: parseFloat(effectiveRate.toFixed(2)),
    netIncome: Math.round(netIncome)
  };
}

/**
 * Calculate VAT according to Nigerian Tax Law 2026
 * VAT Rate: 7.5% (unchanged)
 * Expanded exemptions: food, rent, education, healthcare, public transport
 */
export function calculateVAT2026(salesAmount: number, isExempt: boolean = false): {
  salesAmount: number;
  vatRate: number;
  vatAmount: number;
  exempt: boolean;
} {
  const vatRate = 0.075; // 7.5%

  if (isExempt) {
    return {
      salesAmount,
      vatRate: 0,
      vatAmount: 0,
      exempt: true
    };
  }

  return {
    salesAmount,
    vatRate,
    vatAmount: Math.round(salesAmount * vatRate),
    exempt: false
  };
}

/**
 * Calculate Company Income Tax (CIT) according to Nigerian Tax Law 2026
 */
export function calculateCIT2026(taxableProfit: number): {
  taxableProfit: number;
  citRate: number;
  citAmount: number;
  category: string;
} {
  let citRate: number;
  let category: string;

  if (taxableProfit < 25000000) {
    citRate = 0;
    category = 'Small Company (Below ₦25m turnover): 0%';
  } else if (taxableProfit < 100000000) {
    citRate = 0.20;
    category = 'Medium Company (₦25m - ₦100m turnover): 20%';
  } else {
    citRate = 0.30;
    category = 'Large Company (Above ₦100m turnover): 30%';
  }

  return {
    taxableProfit,
    citRate,
    citAmount: Math.round(taxableProfit * citRate),
    category
  };
}

/**
 * Calculate Withholding Tax according to Nigerian Tax Law 2026
 */
export function calculateWithholdingTax2026(
  paymentAmount: number,
  paymentType: 'dividends' | 'interest' | 'rent' | 'contracts' | 'professional'
): {
  paymentAmount: number;
  whtRate: number;
  whtAmount: number;
  netPayment: number;
  paymentType: string;
} {
  const rates: Record<string, number> = {
    dividends: 0.10,
    interest: 0.10,
    rent: 0.10,
    contracts: 0.05,
    professional: 0.05
  };

  const whtRate = rates[paymentType] || 0.05;
  const whtAmount = Math.round(paymentAmount * whtRate);
  const netPayment = paymentAmount - whtAmount;

  return {
    paymentAmount,
    whtRate,
    whtAmount,
    netPayment,
    paymentType: paymentType.charAt(0).toUpperCase() + paymentType.slice(1)
  };
}

/**
 * Check if a transaction is VAT exempt according to 2026 law
 */
export function isVATExempt2026(transactionType: string): boolean {
  const exemptTypes = [
    'food',
    'groceries',
    'rent',
    'housing',
    'education',
    'tuition',
    'healthcare',
    'medical',
    'public_transport',
    'transportation'
  ];

  return exemptTypes.some(type => 
    transactionType.toLowerCase().includes(type.toLowerCase())
  );
}

/**
 * Format tax breakdown for display
 */
export function formatTaxBreakdown(result: TaxCalculationResult): string[] {
  const lines: string[] = [];
  
  lines.push(`Gross Income: ₦${result.grossIncome.toLocaleString()}`);
  lines.push(`Taxable Income: ₦${result.taxableIncome.toLocaleString()}`);
  lines.push('');
  lines.push('Progressive Tax Calculation (2026 Rates):');
  lines.push('');

  result.breakdown.forEach((item, index) => {
    if (item.tax > 0) {
      lines.push(
        `${index + 1}. ${item.bracket} @ ${(item.rate * 100).toFixed(0)}%`
      );
      lines.push(`   Amount: ₦${item.amount.toLocaleString()}`);
      lines.push(`   Tax: ₦${item.tax.toLocaleString()}`);
      lines.push('');
    }
  });

  lines.push(`Total Tax: ₦${result.totalTax.toLocaleString()}`);
  lines.push(`Effective Rate: ${result.effectiveRate.toFixed(2)}%`);
  lines.push(`Net Income: ₦${result.netIncome.toLocaleString()}`);

  return lines;
}

