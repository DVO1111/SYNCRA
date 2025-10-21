import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PayerIDValidationProps {
  onValidated: (payerId: string) => void;
}

const PayerIDValidation = ({ onValidated }: PayerIDValidationProps) => {
  const [payerId, setPayerId] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState("");
  const [verifiedName, setVerifiedName] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const validatePayerId = async () => {
    if (!payerId.trim()) {
      setError("Please enter your Payer ID or TIN");
      return;
    }

    setIsValidating(true);
    setError("");
    setVerifiedName("");

    try {
      // Call Cloud function to verify Tax ID with LIRS
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-tax-id`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taxId: payerId.trim() })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setVerifiedName(data.taxpayerName);
        setIsVerified(true);
        toast({
          title: "Tax ID Verified",
          description: `Verified: ${data.taxpayerName}`,
        });
        onValidated(payerId.toUpperCase());
      } else {
        setError(data.error || "Verification failed. Please check your Tax ID.");
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError("Unable to verify Tax ID. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card className="shadow-strong border-border/50 backdrop-blur-sm bg-card/80">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-secondary flex items-center justify-center shadow-soft flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-foreground">Verify Your Tax ID</h3>
              <p className="text-sm text-muted-foreground">
                Enter your TIN or Taxpayer ID from LIRS
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payerId">TIN or Taxpayer ID</Label>
              <Input
                id="payerId"
                placeholder="e.g., 1234567890 or N-16015654"
                value={payerId}
                onChange={(e) => {
                  setPayerId(e.target.value);
                  setError("");
                  setIsVerified(false);
                  setVerifiedName("");
                }}
                className={error ? "border-destructive" : ""}
                disabled={isVerified}
              />
              <p className="text-xs text-muted-foreground">
                Enter your 10-digit TIN or Taxpayer ID (N-XXXXXXXX format)
              </p>
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              {isVerified && verifiedName && (
                <div className="p-4 rounded-lg bg-gradient-secondary border border-secondary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <span className="text-sm font-medium text-secondary-foreground">Verified Taxpayer</span>
                  </div>
                  <p className="text-lg font-bold text-secondary-foreground">{verifiedName}</p>
                  <p className="text-xs text-secondary-foreground/70 mt-1">Tax ID: {payerId.toUpperCase()}</p>
                </div>
              )}
            </div>

            <Button
              size="lg"
              variant="secondary"
              onClick={validatePayerId}
              disabled={isValidating || isVerified}
              className="w-full"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying with LIRS...
                </>
              ) : isVerified ? (
                "Verified - Continue"
              ) : (
                "Verify Tax ID"
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 pt-2">
                <Badge variant="outline" className="text-xs">
                  Don't have a Tax ID?
                </Badge>
                <a
                  href="https://etax.lirs.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline flex items-center gap-1"
                >
                  Create one here <ExternalLink className="w-3 h-3" />
                </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayerIDValidation;
