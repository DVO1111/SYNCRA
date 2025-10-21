import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Loader2, Coins, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

interface WalletConnectProps {
  onConnected: (walletAddress: string) => void;
}

const WalletConnect = ({ onConnected }: WalletConnectProps) => {
  const [hasNotified, setHasNotified] = useState(false);
  const [solanaBalance, setSolanaBalance] = useState<number | null>(null);
  const [connectionTime, setConnectionTime] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Solana wallet hooks
  const { 
    publicKey, 
    connected, 
    connecting, 
    disconnect,
    wallet
  } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();

  // Handle wallet connection - opens wallet selection modal
  const handleConnectWallet = async () => {
    console.log("Opening Solana wallet selection modal");
    setHasNotified(false);
    setVisible(true);
  };

  // Fetch Solana balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (connected && publicKey && connection) {
        setIsLoadingBalance(true);
        try {
          console.log("Fetching balance for:", publicKey.toString());
          const balance = await connection.getBalance(publicKey);
          const balanceInSol = balance / LAMPORTS_PER_SOL;
          setSolanaBalance(balanceInSol);
          console.log("Balance fetched:", balanceInSol, "SOL");
        } catch (error) {
          console.error("Error fetching Solana balance:", error);
          toast({
            title: "Balance Error",
            description: "Could not fetch wallet balance. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingBalance(false);
        }
      }
    };

    fetchBalance();
  }, [connected, publicKey, connection]);

  // Handle connection success
  useEffect(() => {
    if (connected && publicKey && !hasNotified) {
      const startTime = Date.now();
      setConnectionTime(startTime);
      const walletAddress = publicKey.toString();
      
      toast({
        title: "Wallet Connected!",
        description: (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-mono text-sm">
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Connected via {wallet?.adapter.name || 'Solana Wallet'}
            </p>
          </div>
        ),
      });
      
      onConnected(walletAddress);
      setHasNotified(true);
    }
  }, [connected, publicKey, onConnected, hasNotified, wallet]);

  // Handle wallet disconnect
  const handleDisconnect = async () => {
    try {
      await disconnect();
      setSolanaBalance(null);
      setConnectionTime(null);
      setHasNotified(false);
      
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected successfully.",
      });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast({
        title: "Disconnect Error",
        description: "Could not disconnect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show connecting state
  if (connecting) {
    return (
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="flex items-center justify-center gap-3 p-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-foreground">Connecting to wallet...</span>
        </CardContent>
      </Card>
    );
  }

  // Show connected state
  if (connected && publicKey) {
    const walletAddress = publicKey.toString();
    const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

    return (
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Connected Wallet</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-foreground">{shortAddress}</code>
                  <Badge variant="secondary" className="text-xs">
                    {wallet?.adapter.name || 'Solana'}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              onClick={handleDisconnect}
              variant="outline"
              size="sm"
            >
              Disconnect
            </Button>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3">
            <Coins className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Balance:</span>
            {isLoadingBalance ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <span className="font-semibold text-foreground">
                {solanaBalance !== null ? `${solanaBalance.toFixed(4)} SOL` : "N/A"}
              </span>
            )}
          </div>

          {connection && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>Connected to Solana {connection.rpcEndpoint.includes('devnet') ? 'Devnet' : 'Mainnet'}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show connect button
  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardContent className="flex flex-col items-center justify-center gap-4 p-6">
        <div className="rounded-full bg-primary/10 p-4">
          <Wallet className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Connect Your Wallet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your Solana wallet to continue
          </p>
        </div>
        <Button
          onClick={handleConnectWallet}
          className="w-full"
          size="lg"
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          <span>Supports Phantom, Solflare, and other Solana wallets</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletConnect;
