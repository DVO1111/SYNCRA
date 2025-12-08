import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, Wallet, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminSettings {
  id: number;
  profit_wallet_address: string | null;
  payment_enabled: boolean;
  service_fee_percentage: number;
  min_payment_amount: number;
  max_payment_amount: number;
  tax_processing_enabled: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY || 'your-secret-admin-key-change-this';

export default function AdminDashboard() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profitWallet, setProfitWallet] = useState("");
  const [paymentEnabled, setPaymentEnabled] = useState(true);
  const [serviceFee, setServiceFee] = useState(2.5);
  const [minPayment, setMinPayment] = useState(1000);
  const [maxPayment, setMaxPayment] = useState(100000000);
  const [taxProcessingEnabled, setTaxProcessingEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-settings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ADMIN_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success && data.settings) {
        const s = data.settings;
        setSettings(s);
        setProfitWallet(s.profit_wallet_address || "");
        setPaymentEnabled(s.payment_enabled);
        setServiceFee(s.service_fee_percentage);
        setMinPayment(s.min_payment_amount);
        setMaxPayment(s.max_payment_amount);
        setTaxProcessingEnabled(s.tax_processing_enabled);
      } else {
        throw new Error(data.error || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load admin settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate wallet address format (basic)
      if (profitWallet && profitWallet.length < 32) {
        toast({
          title: "Invalid Wallet Address",
          description: "Please enter a valid Solana wallet address",
          variant: "destructive",
        });
        return;
      }

      // Validate service fee
      if (serviceFee < 0 || serviceFee > 100) {
        toast({
          title: "Invalid Service Fee",
          description: "Service fee must be between 0 and 100",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profit_wallet_address: profitWallet || null,
          payment_enabled: paymentEnabled,
          service_fee_percentage: serviceFee,
          min_payment_amount: minPayment,
          max_payment_amount: maxPayment,
          tax_processing_enabled: taxProcessingEnabled
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Settings Saved",
          description: "Admin settings have been updated successfully",
          variant: "default",
        });
        setSettings(data.settings);
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Settings className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage payment settings and profit collection</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-accent flex items-center justify-center">
              <Settings className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure payment processing and profit collection</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Profit Wallet Address */}
          <div className="space-y-2">
            <Label htmlFor="profitWallet" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Profit Collection Wallet Address
            </Label>
            <Input
              id="profitWallet"
              type="text"
              placeholder="Enter Solana wallet address for profit collection"
              value={profitWallet}
              onChange={(e) => setProfitWallet(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              All service fees and profits will be sent to this wallet address
            </p>
          </div>

          {/* Payment Enabled Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="paymentEnabled">Payment Processing</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable payment processing system-wide
              </p>
            </div>
            <Switch
              id="paymentEnabled"
              checked={paymentEnabled}
              onCheckedChange={setPaymentEnabled}
            />
          </div>

          {/* Service Fee */}
          <div className="space-y-2">
            <Label htmlFor="serviceFee">Service Fee Percentage (%)</Label>
            <Input
              id="serviceFee"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={serviceFee}
              onChange={(e) => setServiceFee(parseFloat(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Percentage of each transaction to collect as service fee
            </p>
          </div>

          {/* Min/Max Payment Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minPayment">Minimum Payment (₦)</Label>
              <Input
                id="minPayment"
                type="number"
                value={minPayment}
                onChange={(e) => setMinPayment(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPayment">Maximum Payment (₦)</Label>
              <Input
                id="maxPayment"
                type="number"
                value={maxPayment}
                onChange={(e) => setMaxPayment(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Tax Processing Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="taxProcessing">Tax Processing</Label>
              <p className="text-sm text-muted-foreground">
                Enable automatic tax processing and record keeping
              </p>
            </div>
            <Switch
              id="taxProcessing"
              checked={taxProcessingEnabled}
              onCheckedChange={setTaxProcessingEnabled}
            />
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50">
            {paymentEnabled ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <AlertCircle className="w-5 h-5 text-destructive" />
            )}
            <Badge variant={paymentEnabled ? "default" : "destructive"}>
              {paymentEnabled ? "Payments Active" : "Payments Disabled"}
            </Badge>
            {profitWallet && (
              <Badge variant="outline" className="font-mono text-xs">
                Wallet: {profitWallet.slice(0, 8)}...{profitWallet.slice(-8)}
              </Badge>
            )}
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

