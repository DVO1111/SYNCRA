import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Lock } from "lucide-react";
import WalletConnect from "@/components/WalletConnect";
import PayerIDValidation from "@/components/PayerIDValidation";
import TaxCalculator from "@/components/TaxCalculator";
import PaymentModal from "@/components/PaymentModal";
import ReceiptViewer from "@/components/ReceiptViewer";
import { Badge } from "@/components/ui/badge";
import heroBg from "@/assets/hero-bg.jpg";

type Step = "wallet" | "payer" | "calculator" | "payment" | "receipt";

const Index = () => {
  const [currentStep, setCurrentStep] = useState<Step>("wallet");
  const [walletAddress, setWalletAddress] = useState("");
  const [payerId, setPayerId] = useState("");
  const [taxAmount, setTaxAmount] = useState(0);
  const [income, setIncome] = useState(0);
  const [taxBreakdown, setTaxBreakdown] = useState<string[]>([]);
  const [taxType, setTaxType] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleWalletConnected = (address: string) => {
    setWalletAddress(address);
    setCurrentStep("payer");
  };

  const handlePayerValidated = (id: string) => {
    setPayerId(id);
    setCurrentStep("calculator");
  };

  const handleTaxCalculated = (tax: number, incomeValue: number, breakdown: string[], type: string) => {
    setTaxAmount(tax);
    setIncome(incomeValue);
    setTaxBreakdown(breakdown);
    setTaxType(type);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    setCurrentStep("receipt");
  };

  const stepVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen bg-background">
      <section
        className="relative py-20 px-4 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(88, 28, 135, 0.85) 100%), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6 mb-12"
          >
            <Badge className="bg-accent/20 text-accent-foreground border-accent/30 px-4 py-1">
              <Zap className="w-3 h-3 mr-1 inline" />
              Pay Taxes in Under 2 Minutes
            </Badge>

            <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground leading-tight">
              Crypto Tax Payments
              <br />
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>

            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Pay your Nigerian taxes directly with cryptocurrency. Instant conversion,
              automatic settlement, official receipts.
            </p>

            <div className="flex flex-wrap justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-primary-foreground/90">
                <Shield className="w-5 h-5 text-success" />
                <span className="text-sm font-medium">LIRS Verified</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/90">
                <Zap className="w-5 h-5 text-warning" />
                <span className="text-sm font-medium">Instant Settlement</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/90">
                <Lock className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">Secure & Encrypted</span>
              </div>
            </div>
          </motion.div>

          {currentStep !== "wallet" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center gap-2 mb-8"
            >
              {["payer", "calculator", "receipt"].map((step, index) => (
                <div
                  key={step}
                  className={`h-2 rounded-full transition-all ${
                    currentStep === step ? "w-12 bg-accent" :
                    ["payer", "calculator"].indexOf(currentStep) > index || currentStep === "receipt" ? "w-8 bg-success" :
                    "w-8 bg-muted"
                  }`}
                />
              ))}
            </motion.div>
          )}

          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              {currentStep === "wallet" && (
                <motion.div key="wallet" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
                  <WalletConnect onConnected={handleWalletConnected} />
                </motion.div>
              )}
              {currentStep === "payer" && (
                <motion.div key="payer" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
                  <PayerIDValidation onValidated={handlePayerValidated} />
                </motion.div>
              )}
              {currentStep === "calculator" && (
                <motion.div key="calculator" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
                  <TaxCalculator onCalculated={handleTaxCalculated} />
                </motion.div>
              )}
              {currentStep === "receipt" && (
                <motion.div key="receipt" variants={stepVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
                  <ReceiptViewer payerId={payerId} taxAmount={taxAmount} walletAddress={walletAddress} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        taxAmount={taxAmount}
        taxBreakdown={taxBreakdown}
        taxType={taxType}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
};

export default Index;
