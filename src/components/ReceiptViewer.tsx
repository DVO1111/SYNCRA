import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Download, CheckCircle2, Wallet } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ReceiptViewerProps {
  payerId: string;
  taxAmount: number;
  walletAddress: string;
}

const ReceiptViewer = ({ payerId, taxAmount, walletAddress }: ReceiptViewerProps) => {
  const receiptNumber = `${Date.now().toString().slice(-8)}/GUTSBJPY`;
  const assessRef = `${payerId}-${Date.now().toString().slice(-10)}-911`;
  const paymentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const handleDownload = () => {
    toast({
      title: "Receipt Downloaded",
      description: "Your tax receipt has been saved to your device",
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Success Message */}
      <Card className="bg-gradient-accent border-accent/20 overflow-hidden">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-accent-foreground mb-2">Payment Successful!</h2>
              <p className="text-accent-foreground/80">
                Your receipt has been sent to your wallet as an NFT
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-accent-foreground/70">
              <Wallet className="w-4 h-4" />
              <span className="font-mono">
                {walletAddress.substring(0, 10)}...{walletAddress.substring(walletAddress.length - 8)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Card */}
      <Card className="shadow-strong border-border/50 overflow-hidden bg-white">
        <CardHeader className="border-b bg-muted/30">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="font-bold text-foreground">{receiptNumber}</p>
                <p className="text-sm text-muted-foreground">{paymentDate}</p>
              </div>
              <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                <FileCheck className="w-10 h-10 text-muted-foreground" />
              </div>
            </div>
            <div className="pt-4">
              <h1 className="text-2xl font-bold text-foreground">REVENUE RECEIPT</h1>
              <p className="text-sm font-semibold text-foreground mt-1">Lagos State Government</p>
              <p className="text-xs text-muted-foreground italic">LSG State Internal Revenue Service</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Payment Details Header */}
          <div className="grid grid-cols-2 gap-4 pb-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground border-b border-border pb-1">PAYMENT DETAILS</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-xs text-muted-foreground">AssessRef: {assessRef}</p>
            </div>
          </div>

          {/* Payer Information */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <p className="text-sm font-semibold text-foreground">Payer</p>
              <p className="col-span-2 text-sm text-foreground font-mono">
                TAX PAYER / {payerId}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <p className="text-sm font-semibold text-foreground">Address</p>
              <p className="col-span-2 text-sm text-foreground">
                LAGOS, NIGERIA
              </p>
            </div>

            {/* Amount - Highlighted */}
            <div className="grid grid-cols-3 gap-2 bg-foreground text-background p-3 -mx-4">
              <p className="text-sm font-semibold">Amount</p>
              <p className="col-span-2 text-sm font-bold">
                NGN {taxAmount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Naira only)
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <p className="font-semibold text-foreground">Agency - Rev Code</p>
              <p className="col-span-2 text-muted-foreground">
                LIRS/Lekki Tax Station - PAYE Direct // Tax Year: {new Date().getFullYear()}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <p className="font-semibold text-foreground">Payment Details</p>
              <p className="col-span-2 text-muted-foreground">
                Paid via Crypto/Digital Payment of {paymentDate} into LIRS - Consolidated Revenue Account
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t">
              <p className="text-sm font-semibold text-foreground">Exec chairman (LIRS)</p>
              <div className="col-span-2">
                <p className="text-sm italic text-foreground">Lagos Inland Revenue Service</p>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center pt-4">
            <Badge className="bg-success text-success-foreground">Verified & Confirmed</Badge>
          </div>

          {/* Download Button */}
          <div className="pt-4">
            <Button
              variant="default"
              size="lg"
              className="w-full"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-2">
            This receipt is valid and can be verified on the LIRS eTax portal
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiptViewer;
